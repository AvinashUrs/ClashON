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

# Sample venues data with images
venues_data = [
    {
        "id": "venue-001",
        "name": "Elite Badminton Arena",
        "location": "Indiranagar, Bangalore",
        "sport": "Badminton",
        "rating": 4.8,
        "smart_recording": True,
        "base_price": 500,
        "super_video_price": 200,
        "image": "https://images.unsplash.com/photo-1626926938421-90124a4b83fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwyfHxiYWRtaW50b24lMjBjb3VydHxlbnwwfHx8fDE3NzA4ODUwODJ8MA&ixlib=rb-4.1.0&q=85&w=800",
        "amenities": ["Parking", "Changing Room", "Water", "AC Courts"],
        "slots": []
    },
    {
        "id": "venue-002",
        "name": "Champions Cricket Stadium",
        "location": "Whitefield, Bangalore",
        "sport": "Cricket",
        "rating": 4.7,
        "smart_recording": True,
        "base_price": 1500,
        "super_video_price": 300,
        "image": "https://images.unsplash.com/photo-1512719994953-eabf50895df7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxjcmlja2V0JTIwc3RhZGl1bXxlbnwwfHx8fDE3NzA4ODUwODh8MA&ixlib=rb-4.1.0&q=85&w=800",
        "amenities": ["Turf Ground", "Floodlights", "Pavilion", "Practice Nets"],
        "slots": []
    },
    {
        "id": "venue-003",
        "name": "ProCourt Badminton Center",
        "location": "Koramangala, Bangalore",
        "sport": "Badminton",
        "rating": 4.9,
        "smart_recording": True,
        "base_price": 600,
        "super_video_price": 200,
        "image": "https://images.unsplash.com/photo-1626926938421-90124a4b83fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwyfHxiYWRtaW50b24lMjBjb3VydHxlbnwwfHx8fDE3NzA4ODUwODJ8MA&ixlib=rb-4.1.0&q=85&w=800",
        "amenities": ["Parking", "Cafeteria", "Pro Shop", "AC Courts", "Lockers"],
        "slots": []
    },
    {
        "id": "venue-004",
        "name": "Victory Cricket Arena",
        "location": "HSR Layout, Bangalore",
        "sport": "Cricket",
        "rating": 4.6,
        "smart_recording": True,
        "base_price": 1200,
        "super_video_price": 300,
        "image": "https://images.unsplash.com/photo-1512719994953-eabf50895df7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxjcmlja2V0JTIwc3RhZGl1bXxlbnwwfHx8fDE3NzA4ODUwODh8MA&ixlib=rb-4.1.0&q=85&w=800",
        "amenities": ["Coaching Available", "Turf Ground", "Changing Room", "Water"],
        "slots": []
    },
    {
        "id": "venue-005",
        "name": "Ace Shuttle Courts",
        "location": "Jayanagar, Bangalore",
        "sport": "Badminton",
        "rating": 4.5,
        "smart_recording": True,
        "base_price": 450,
        "super_video_price": 150,
        "image": "https://images.unsplash.com/photo-1626926938421-90124a4b83fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwyfHxiYWRtaW50b24lMjBjb3VydHxlbnwwfHx8fDE3NzA4ODUwODJ8MA&ixlib=rb-4.1.0&q=85&w=800",
        "amenities": ["Parking", "Water", "AC Courts"],
        "slots": []
    },
    {
        "id": "venue-006",
        "name": "Premier Cricket Ground",
        "location": "Electronic City, Bangalore",
        "sport": "Cricket",
        "rating": 4.8,
        "smart_recording": True,
        "base_price": 2000,
        "super_video_price": 400,
        "image": "https://images.unsplash.com/photo-1512719994953-eabf50895df7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwxfHxjcmlja2V0JTIwc3RhZGl1bXxlbnwwfHx8fDE3NzA4ODUwODh8MA&ixlib=rb-4.1.0&q=85&w=800",
        "amenities": ["Full Size Ground", "Floodlights", "Pavilion", "Parking", "Cafeteria"],
        "slots": []
    }
]

def generate_slots(base_price):
    """Generate time slots from 6 AM to 10 PM"""
    slots = []
    start_hour = 6
    
    for i in range(16):  # 16 hours of slots
        hour = start_hour + i
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        if display_hour == 0:
            display_hour = 12
        time_str = f"{display_hour:02d}:00 {am_pm}"
        
        slots.append({
            "time": time_str,
            "available": True,
            "price": base_price
        })
    
    return slots

async def seed_venues():
    """Seed sample venues into database"""
    print("Starting to seed venues...")
    
    # Clear existing venues
    await db.venues.delete_many({})
    print("Cleared existing venues")
    
    # Add slots to each venue
    for venue in venues_data:
        venue["slots"] = generate_slots(venue["base_price"])
    
    # Insert venues
    result = await db.venues.insert_many(venues_data)
    print(f"Inserted {len(result.inserted_ids)} venues")
    
    # Print summary
    print("\n✅ Sample venues seeded successfully!")
    print("\nVenues added:")
    for venue in venues_data:
        print(f"  - {venue['name']} ({venue['sport']}) - ₹{venue['base_price']}/hr")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_venues())
