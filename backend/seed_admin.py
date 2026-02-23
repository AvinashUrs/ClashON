import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin data
admin_data = {
    "id": "admin-001",
    "phone": "9916444412",
    "name": "Admin",
    "email": "admin@clashon.com",
    "role": "superadmin"
}

async def seed_admin():
    """Seed admin user"""
    print("Creating admin user...")
    
    # Check if admin already exists
    existing = await db.admins.find_one({"phone": admin_data["phone"]})
    
    if existing:
        print(f"✅ Admin already exists: {admin_data['phone']}")
    else:
        await db.admins.insert_one(admin_data)
        print(f"✅ Admin created: {admin_data['phone']}")
    
    print(f"\nAdmin Login Details:")
    print(f"Phone: {admin_data['phone']}")
    print(f"Role: {admin_data['role']}")
    print(f"\nUse this phone number to login to admin panel via OTP")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admin())
