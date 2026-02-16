from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import random
import string


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============= AUTH MODELS =============

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class OTPRecord(BaseModel):
    phone: str
    otp: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    verified: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


# ============= MODELS =============

# Venue Models
class TimeSlot(BaseModel):
    time: str  # e.g., "09:00 AM"
    available: bool = True
    price: float

class Venue(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    sport: str  # "Badminton" or "Cricket"
    image: Optional[str] = None  # base64 image
    rating: float
    smart_recording: bool = True
    base_price: float
    super_video_price: float
    amenities: List[str]
    slots: List[TimeSlot]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VenueCreate(BaseModel):
    name: str
    location: str
    sport: str
    image: Optional[str] = None
    rating: float = 4.5
    base_price: float
    super_video_price: float
    amenities: List[str] = []

# Booking Models
class BookingCreate(BaseModel):
    venue_id: str
    venue_name: str
    date: str  # "2025-07-15"
    time_slot: str  # "09:00 AM"
    sport: str
    super_video_enabled: bool = False
    total_price: float
    user_id: str
    user_name: str

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    venue_id: str
    venue_name: str
    date: str
    time_slot: str
    sport: str
    super_video_enabled: bool
    total_price: float
    user_id: str
    user_name: str
    pin_code: str = Field(default_factory=lambda: ''.join(random.choices(string.digits, k=6)))
    status: str = "confirmed"  # confirmed, completed, cancelled
    video_status: str = "pending"  # pending, processing, ready
    video_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Video Models
class Video(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    venue_name: str
    sport: str
    thumbnail: str  # base64
    video_url: str  # base64 or URL
    duration: int = 45  # seconds
    likes: int = 0
    views: int = 0
    user_id: str
    user_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoCreate(BaseModel):
    booking_id: str
    venue_name: str
    sport: str
    user_id: str
    user_name: str


# ============= AUTH ROUTES =============

@api_router.post("/auth/request-otp")
async def request_otp(request: OTPRequest):
    """Generate and send OTP to phone number"""
    # Generate 6-digit OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Store OTP with 5 minute expiry
    otp_record = OTPRecord(
        phone=request.phone,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=5)
    )
    
    # Delete any existing OTPs for this phone
    await db.otps.delete_many({"phone": request.phone})
    
    # Store new OTP
    await db.otps.insert_one(otp_record.dict())
    
    # In production, send OTP via SMS service (Twilio, etc.)
    # For demo, return OTP in response
    return {
        "success": True,
        "message": f"OTP sent to {request.phone}",
        "otp": otp  # Remove this in production!
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(verify: OTPVerify):
    """Verify OTP and login/signup user"""
    # Find OTP record
    otp_record = await db.otps.find_one({
        "phone": verify.phone,
        "otp": verify.otp,
        "verified": False
    })
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if OTP expired
    if datetime.utcnow() > otp_record['expires_at']:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Mark OTP as verified
    await db.otps.update_one(
        {"phone": verify.phone, "otp": verify.otp},
        {"$set": {"verified": True}}
    )
    
    # Find or create user
    user = await db.users.find_one({"phone": verify.phone})
    
    if not user:
        # Create new user
        new_user = User(phone=verify.phone, name=f"User {verify.phone[-4:]}")
        await db.users.insert_one(new_user.dict())
        user = new_user.dict()
    
    return {
        "success": True,
        "message": "Login successful",
        "user": User(**user)
    }

@api_router.get("/auth/user/{user_id}")
async def get_user(user_id: str):
    """Get user profile"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.put("/auth/user/{user_id}")
async def update_user(user_id: str, update: UserUpdate):
    """Update user profile"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id})
    return User(**user)


# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "ClashON API - Book Courts. Capture Glory.","version": "1.0", "status": "active"}

# Venue Endpoints
@api_router.post("/venues", response_model=Venue)
async def create_venue(venue: VenueCreate):
    """Create a new venue"""
    # Generate default time slots
    slots = []
    start_hour = 6
    for i in range(16):  # 6 AM to 10 PM (16 hours)
        hour = start_hour + i
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        if display_hour == 0:
            display_hour = 12
        time_str = f"{display_hour:02d}:00 {am_pm}"
        
        slots.append(TimeSlot(
            time=time_str,
            available=True,
            price=venue.base_price
        ))
    
    venue_dict = venue.dict()
    venue_dict['slots'] = [slot.dict() for slot in slots]
    venue_obj = Venue(**venue_dict)
    
    await db.venues.insert_one(venue_obj.dict())
    return venue_obj

@api_router.get("/venues", response_model=List[Venue])
async def get_venues(sport: Optional[str] = None):
    """Get all venues, optionally filtered by sport"""
    query = {}
    if sport:
        query['sport'] = sport
    
    venues = await db.venues.find(query).to_list(100)
    return [Venue(**venue) for venue in venues]

@api_router.get("/venues/{venue_id}", response_model=Venue)
async def get_venue(venue_id: str):
    """Get a specific venue by ID"""
    venue = await db.venues.find_one({"id": venue_id})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return Venue(**venue)

# Booking Endpoints
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    """Create a new booking"""
    booking_obj = Booking(**booking.dict())
    await db.bookings.insert_one(booking_obj.dict())
    return booking_obj

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(user_id: Optional[str] = None):
    """Get all bookings, optionally filtered by user"""
    query = {}
    if user_id:
        query['user_id'] = user_id
    
    bookings = await db.bookings.find(query).sort("created_at", -1).to_list(100)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    """Get a specific booking by ID"""
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return Booking(**booking)

@api_router.put("/bookings/{booking_id}/video-status")
async def update_video_status(booking_id: str, status: str, video_url: Optional[str] = None):
    """Update video processing status for a booking"""
    update_data = {"video_status": status}
    if video_url:
        update_data["video_url"] = video_url
    
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"success": True, "status": status}

# Video Endpoints
@api_router.post("/videos", response_model=Video)
async def create_video(video: VideoCreate):
    """Create a new highlight video"""
    # Mock video data - in real app, this would come from AI processing
    mock_thumbnail = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    mock_video = "mock_video_url"
    
    video_dict = video.dict()
    video_dict['thumbnail'] = mock_thumbnail
    video_dict['video_url'] = mock_video
    video_obj = Video(**video_dict)
    
    await db.videos.insert_one(video_obj.dict())
    return video_obj

@api_router.get("/videos", response_model=List[Video])
async def get_videos():
    """Get all videos for the Flex Feed"""
    videos = await db.videos.find().sort("created_at", -1).to_list(100)
    return [Video(**video) for video in videos]

@api_router.put("/videos/{video_id}/like")
async def like_video(video_id: str):
    """Like a video"""
    result = await db.videos.update_one(
        {"id": video_id},
        {"$inc": {"likes": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return {"success": True}

@api_router.put("/videos/{video_id}/view")
async def view_video(video_id: str):
    """Increment video view count"""
    result = await db.videos.update_one(
        {"id": video_id},
        {"$inc": {"views": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
    return {"success": True}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
