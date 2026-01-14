# 🛒 E-commerce Website

A full-stack E-commerce Website built using FastAPI, React, and MongoDB. The project supports admin authentication, product management, and image handling.

## Project Structure

Business/
├── backend/
├── frontend/
└── README.md

## Backend Setup (FastAPI)

```
cd backend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\Activate.ps1
uvicorn server:app --reload --port 5000
```

Backend runs on:
```http://localhost:5000```

## Frontend Setup (React)

```
cd frontend
npm start
```

Frontend runs on:
```
http://localhost:3000
```

## MongoDB Setup

Start MongoDB server:

```
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db
```

Open Mongo shell:

```
"C:\Users\hp\AppData\Local\Programs\mongosh\mongosh.exe"
```

## Database Setup

```
use ecommerce_db
show collections
```

## Add Product

```
db.products.insertOne({
  id: "test-product-1",
  name: "Handcrafted Wooden Bowl",
  price: 1299,
  description: "Premium handmade wooden bowl",
  category: "wooden",
  stock: 10,
  images: [],
  slug: "handcrafted-wooden-bowl",
  created_at: new Date().toISOString()
})
```

## Add Product Image

```
db.products.updateOne(
  { id: "test-product-1" },
  { $set: { images: ["/uploads/sample.jpg"] } }
)
```

## Admin Setup

```
python create_admin.py
```

Copy the generated admin token and add it manually in the browser:

Inspect → Application → Cookies

## Features

- Admin authentication
- Product management
- Image upload support
- MongoDB integration
- FastAPI backend
- React frontend

## Tech Stack

Frontend: React, JavaScript  
Backend: FastAPI (Python)  
Database: MongoDB

## Notes

MongoDB must be running before backend  
Backend and frontend must run simultaneously
