from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request, Response, Depends, Header
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import aiofiles
import shutil
import razorpay
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create upload directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# Razorpay client
razorpay_client = razorpay.Client(
    auth=(os.environ.get('RAZORPAY_KEY_ID', ''), os.environ.get('RAZORPAY_KEY_SECRET', ''))
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ============ Models ============
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    picture: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    description: str
    category: str  # "jewellery" or "wooden"
    stock: int
    images: List[str] = []
    slug: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    price: float
    description: str
    category: str
    stock: int

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"ORD-{secrets.token_hex(6).upper()}")
    customer_name: str
    customer_email: str
    phone: str
    shipping_address: str
    items: List[dict]  # [{product_id, product_name, quantity, price}]
    total_amount: float
    payment_method: str  # "cod" or "online"
    payment_status: str = "pending"  # pending, completed, failed
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    order_status: str = "processing"  # processing, shipped, delivered, cancelled
    tracking_link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    phone: str
    shipping_address: str
    items: List[dict]
    total_amount: float
    payment_method: str

class OrderStatusUpdate(BaseModel):
    order_status: str
    tracking_link: Optional[str] = None

class SessionRequest(BaseModel):
    redirect_url: str

# ============ Auth Helper ============
async def get_current_user(authorization: Optional[str] = Header(None), session_token: Optional[str] = None) -> Optional[User]:
    token = session_token
    
    if not token and authorization:
        if authorization.startswith('Bearer '):
            token = authorization.replace('Bearer ', '')
    
    if not token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        return None
    
    if datetime.fromisoformat(session['expires_at']) < datetime.now(timezone.utc):
        return None
    
    user = await db.users.find_one({"id": session['user_id']})
    if not user:
        return None
    
    return User(**user)

async def require_auth(request: Request) -> User:
    # Check cookie first
    session_token = request.cookies.get('session_token')
    
    # Check Authorization header as fallback
    authorization = request.headers.get('authorization')
    
    user = await get_current_user(authorization=authorization, session_token=session_token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return user

# ============ Email Helper ============
def send_email(to_email: str, subject: str, body: str):
    try:
        smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        
        if not smtp_user or not smtp_password:
            logging.warning("SMTP credentials not configured")
            return
        
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        logging.info(f"Email sent to {to_email}")
    except Exception as e:
        logging.error(f"Failed to send email: {e}")

# ============ Auth Routes ============
@api_router.get("/")
async def root():
    return {"message": "E-commerce API"}

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get('X-Session-ID')
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Get session data from Emergent Auth
    try:
        auth_response = requests.get(
            'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
            headers={'X-Session-ID': session_id}
        )
        auth_response.raise_for_status()
        session_data = auth_response.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid session: {str(e)}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": session_data['email']})
    
    if not existing_user:
        # Create new user
        user = User(
            id=session_data['id'],
            email=session_data['email'],
            name=session_data['name'],
            picture=session_data['picture']
        )
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
    
    # Create session
    session_token = session_data['session_token']
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        user_id=session_data['id'],
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_dict = user_session.model_dump()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {"user": session_data, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await require_auth(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get('session_token')
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ============ Product Routes ============
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, request: Request):
    await require_auth(request)
    
    # Generate slug
    slug = product.name.lower().replace(' ', '-').replace('&', 'and')
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    product_obj = Product(
        **product.model_dump(),
        slug=slug
    )
    
    product_dict = product_obj.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    
    await db.products.insert_one(product_dict)
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return Product(**product)

@api_router.get("/products/slug/{slug}", response_model=Product)
async def get_product_by_slug(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, request: Request):
    await require_auth(request)
    
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Generate new slug if name changed
    slug = product.name.lower().replace(' ', '-').replace('&', 'and')
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    update_dict = product.model_dump()
    update_dict['slug'] = slug
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": update_dict}
    )
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    await require_auth(request)
    
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}

@api_router.post("/products/{product_id}/upload")
async def upload_product_images(product_id: str, files: List[UploadFile] = File(...), request: Request = None):
    await require_auth(request)
    
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    uploaded_urls = []
    
    for file in files:
        # Generate unique filename
        file_ext = file.filename.split('.')[-1]
        unique_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = UPLOAD_DIR / unique_name
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Generate URL
        file_url = f"/uploads/{unique_name}"
        uploaded_urls.append(file_url)
    
    # Update product images
    current_images = product.get('images', [])
    current_images.extend(uploaded_urls)
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"images": current_images}}
    )
    
    return {"urls": uploaded_urls}

# ============ Order Routes ============
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_obj = Order(**order.model_dump())
    
    order_dict = order_obj.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    order_dict['updated_at'] = order_dict['updated_at'].isoformat()
    
    await db.orders.insert_one(order_dict)
    
    # Send email to owner
    owner_email = os.environ.get('OWNER_EMAIL', '')
    if owner_email:
        email_body = f"""
        <h2>New Order Received!</h2>
        <p><strong>Order Number:</strong> {order_obj.order_number}</p>
        <p><strong>Customer:</strong> {order_obj.customer_name}</p>
        <p><strong>Email:</strong> {order_obj.customer_email}</p>
        <p><strong>Phone:</strong> {order_obj.phone}</p>
        <p><strong>Total Amount:</strong> ₹{order_obj.total_amount}</p>
        <p><strong>Payment Method:</strong> {order_obj.payment_method.upper()}</p>
        <p><strong>Shipping Address:</strong> {order_obj.shipping_address}</p>
        <hr>
        <h3>Items:</h3>
        <ul>
        {''.join([f"<li>{item['product_name']} x {item['quantity']} - ₹{item['price']}</li>" for item in order_obj.items])}
        </ul>
        """
        send_email(owner_email, f"New Order: {order_obj.order_number}", email_body)
    
    return order_obj

@api_router.get("/orders/{order_number}", response_model=Order)
async def get_order_by_number(order_number: str):
    order = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order['updated_at'], str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return Order(**order)

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(request: Request):
    await require_auth(request)
    
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, request: Request):
    await require_auth(request)
    
    update_data = {
        "order_status": status_update.order_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status_update.tracking_link:
        update_data["tracking_link"] = status_update.tracking_link
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order updated"}

# ============ Payment Routes ============
@api_router.post("/payment/create-order")
async def create_razorpay_order(amount: float):
    try:
        razorpay_order = razorpay_client.order.create({
            "amount": int(amount * 100),  # Convert to paise
            "currency": "INR",
            "payment_capture": 1
        })
        return razorpay_order
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/payment/verify")
async def verify_payment(order_id: str, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # Update order
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "payment_status": "completed",
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"status": "success"}
    except Exception as e:
        # Update order as failed
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "payment_status": "failed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        raise HTTPException(status_code=400, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()