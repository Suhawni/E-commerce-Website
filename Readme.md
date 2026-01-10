backend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\Activate.ps1
uvicorn server:app --reload --port 5000

frontend
npm start

mongodb
& "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db

mongosh
& "C:\Users\hp\AppData\Local\Programs\mongosh\mongosh.exe"
test> use ecommerce_db
ecommerce_db> show collections

add product
db.products.insertOne({
...   id: "test-product-1",
...   name: "Handcrafted Wooden Bowl",
...   price: 1299,
...   description: "Premium handmade wooden bowl",
...   category: "wooden",
...   stock: 10,
...   images: [],
...   slug: "handcrafted-wooden-bowl",
...   created_at: new Date().toISOString()
... })

add image of product
ecommerce_db> db.products.updateOne(
...   { id: "test-product-1" },
...   { $set: { images: ["/uploads/sample.jpg"] } }
... )
...

for admin session
python create_admin.py

then add the token to
inspect->application->cookies