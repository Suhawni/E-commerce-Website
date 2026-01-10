import pymongo
import time
from datetime import datetime, timedelta, timezone

# 1. Connect to local MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["ecommerce_db"]

# 2. Generate unique IDs
timestamp = int(time.time() * 1000)
user_id = f"test-admin-{timestamp}"
session_token = f"manual_access_token_{timestamp}"

# 3. Create the Admin User
print("Creating user...")
db.users.insert_one({
    "id": user_id,
    "email": "admin@example.com",
    "name": "Admin User",
    "picture": "https://via.placeholder.com/150",
    # FIX: Use timezone.utc to make the date "Aware"
    "created_at": datetime.now(timezone.utc).isoformat()
})

# 4. Create the Session
print("Creating session...")
db.user_sessions.insert_one({
    "user_id": user_id,
    "session_token": session_token,
    # FIX: Use timezone.utc here as well
    "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    "created_at": datetime.now(timezone.utc).isoformat()
})

# 5. Output the result
print("\n" + "="*40)
print("SUCCESS! COPY THIS NEW TOKEN:")
print(f"{session_token}")
print("="*40)