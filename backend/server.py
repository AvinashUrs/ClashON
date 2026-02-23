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

# ============= CONFIGURATION =============
# DUMMY OTP MODE - Set to True to bypass real OTP service
DUMMY_OTP_MODE = True
DUMMY_OTP = "123456"

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============= AUTH MODELS =============

class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: str
    email: Optional[str] = None
    role: str = "admin"  # admin, superadmin
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AdminCreate(BaseModel):
    phone: str
    name: str
    email: Optional[str] = None
    role: str = "admin"

class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class AdminOTPRequest(BaseModel):
    phone: str

class AdminOTPVerify(BaseModel):
    phone: str
    otp: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: str
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    phone: str
    name: str
    email: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: str

class OTPRecord(BaseModel):
    phone: str
    otp: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    verified: bool = False


# ============= VENUE MODELS =============

class TimeSlot(BaseModel):
    time: str
    available: bool = True
    price: float

class Venue(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    address: Optional[str] = None
    sport: str
    image: Optional[str] = None
    images: List[str] = []  # Multiple images
    rating: float = 4.5
    total_reviews: int = 0
    smart_recording: bool = True
    base_price: float
    super_video_price: float = 200
    amenities: List[str] = []
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    opening_time: str = "06:00 AM"
    closing_time: str = "10:00 PM"
    slots: List[TimeSlot] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VenueCreate(BaseModel):
    name: str
    location: str
    address: Optional[str] = None
    sport: str
    image: Optional[str] = None
    images: List[str] = []
    rating: float = 4.5
    smart_recording: bool = True
    base_price: float
    super_video_price: float = 200
    amenities: List[str] = []
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    opening_time: str = "06:00 AM"
    closing_time: str = "10:00 PM"

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    sport: Optional[str] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None
    rating: Optional[float] = None
    smart_recording: Optional[bool] = None
    base_price: Optional[float] = None
    super_video_price: Optional[float] = None
    amenities: Optional[List[str]] = None
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    is_active: Optional[bool] = None


# ============= BOOKING MODELS =============

class BookingCreate(BaseModel):
    venue_id: str
    venue_name: str
    date: str
    time_slot: str
    sport: str
    super_video_enabled: bool = False
    total_price: float
    user_id: str
    user_name: str

class BookingUpdate(BaseModel):
    date: Optional[str] = None
    time_slot: Optional[str] = None
    status: Optional[str] = None
    video_status: Optional[str] = None
    super_video_enabled: Optional[bool] = None
    total_price: Optional[float] = None

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
    status: str = "confirmed"
    video_status: str = "pending"
    video_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============= VIDEO MODELS =============

class Video(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: Optional[str] = None
    venue_name: str
    sport: str
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    duration: int = 45
    likes: int = 0
    views: int = 0
    user_id: str
    user_name: str
    is_featured: bool = False
    is_public: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoCreate(BaseModel):
    booking_id: Optional[str] = None
    venue_name: str
    sport: str
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    duration: int = 45
    user_id: str
    user_name: str

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_public: Optional[bool] = None


# ============= AUTH ROUTES =============

@api_router.post("/auth/check-user-type")
async def check_user_type(request: OTPRequest):
    """Check if phone belongs to admin or user"""
    admin = await db.admins.find_one({"phone": request.phone})
    if admin:
        return {"user_type": "admin", "name": admin.get("name", "Admin")}
    
    user = await db.users.find_one({"phone": request.phone})
    if user:
        return {"user_type": "user", "name": user.get("name", "")}
    
    return {"user_type": "new_user", "name": ""}

@api_router.post("/auth/request-otp")
async def request_otp(request: OTPRequest):
    """Generate OTP - Using DUMMY OTP for testing"""
    # Check if this phone is an admin
    admin = await db.admins.find_one({"phone": request.phone})
    if admin:
        return {
            "success": True,
            "is_admin": True,
            "message": "This phone is registered as admin. Redirecting to admin login..."
        }
    
    if DUMMY_OTP_MODE:
        # Store dummy OTP
        otp_record = OTPRecord(
            phone=request.phone,
            otp=DUMMY_OTP,
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        await db.otps.delete_many({"phone": request.phone})
        await db.otps.insert_one(otp_record.dict())
        
        return {
            "success": True,
            "is_admin": False,
            "message": f"DEMO MODE: Use OTP {DUMMY_OTP} to login",
            "demo_otp": DUMMY_OTP
        }
    
    return {"success": False, "message": "OTP service disabled"}

@api_router.post("/auth/verify-otp")
async def verify_otp(verify: OTPVerify):
    """Verify OTP and create/login user"""
    if DUMMY_OTP_MODE:
        if verify.otp != DUMMY_OTP:
            raise HTTPException(status_code=400, detail=f"Invalid OTP. Use {DUMMY_OTP} for demo")
    else:
        otp_record = await db.otps.find_one({"phone": verify.phone, "verified": False})
        if not otp_record or otp_record['otp'] != verify.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        if datetime.utcnow() > otp_record['expires_at']:
            raise HTTPException(status_code=400, detail="OTP expired")
        await db.otps.update_one({"phone": verify.phone}, {"$set": {"verified": True}})
    
    # Find or create user
    user = await db.users.find_one({"phone": verify.phone})
    
    if not user:
        new_user = User(phone=verify.phone, name=verify.name)
        await db.users.insert_one(new_user.dict())
        user = new_user.dict()
    else:
        if verify.name and verify.name != user.get('name'):
            await db.users.update_one({"phone": verify.phone}, {"$set": {"name": verify.name}})
            user['name'] = verify.name
    
    return {"success": True, "message": "Login successful", "user": User(**user)}


# ============= ADMIN AUTH ROUTES =============

@api_router.post("/admin/auth/request-otp")
async def admin_request_otp(request: AdminOTPRequest):
    """Generate admin OTP - Using DUMMY OTP for testing"""
    if DUMMY_OTP_MODE:
        otp_record = OTPRecord(
            phone=request.phone,
            otp=DUMMY_OTP,
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        await db.admin_otps.delete_many({"phone": request.phone})
        await db.admin_otps.insert_one(otp_record.dict())
        
        return {
            "success": True,
            "message": f"DEMO MODE: Use OTP {DUMMY_OTP} to login as admin",
            "demo_otp": DUMMY_OTP
        }
    
    return {"success": False, "message": "OTP service disabled"}

@api_router.post("/admin/auth/verify-otp")
async def admin_verify_otp(verify: AdminOTPVerify):
    """Verify admin OTP and login"""
    if DUMMY_OTP_MODE:
        if verify.otp != DUMMY_OTP:
            raise HTTPException(status_code=400, detail=f"Invalid OTP. Use {DUMMY_OTP} for demo")
    else:
        otp_record = await db.admin_otps.find_one({"phone": verify.phone, "verified": False})
        if not otp_record or otp_record['otp'] != verify.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        await db.admin_otps.update_one({"phone": verify.phone}, {"$set": {"verified": True}})
    
    admin = await db.admins.find_one({"phone": verify.phone})
    if not admin:
        raise HTTPException(status_code=403, detail="Not authorized as admin")
    
    return {"success": True, "message": "Admin login successful", "admin": Admin(**admin)}


# ============= ADMIN DASHBOARD =============

@api_router.get("/admin/dashboard/stats")
async def get_admin_stats():
    """Get dashboard statistics"""
    try:
        total_users = await db.users.count_documents({})
        total_venues = await db.venues.count_documents({})
        total_bookings = await db.bookings.count_documents({})
        total_videos = await db.videos.count_documents({})
        total_admins = await db.admins.count_documents({})
        
        confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
        completed_bookings = await db.bookings.count_documents({"status": "completed"})
        cancelled_bookings = await db.bookings.count_documents({"status": "cancelled"})
        
        active_venues = await db.venues.count_documents({"is_active": True})
        
        revenue_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_price"}}}]
        revenue_result = await db.bookings.aggregate(revenue_pipeline).to_list(1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        recent_bookings = await db.bookings.find().sort("created_at", -1).limit(5).to_list(5)
        recent_users = await db.users.find().sort("created_at", -1).limit(5).to_list(5)
        
        return {
            "total_users": total_users,
            "total_venues": total_venues,
            "total_bookings": total_bookings,
            "total_videos": total_videos,
            "total_admins": total_admins,
            "confirmed_bookings": confirmed_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "active_venues": active_venues,
            "total_revenue": total_revenue,
            "recent_bookings": [Booking(**b) for b in recent_bookings],
            "recent_users": [User(**u) for u in recent_users]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= ADMIN VENUE CRUD =============

@api_router.get("/admin/venues", response_model=List[Venue])
async def admin_get_all_venues(is_active: Optional[bool] = None, sport: Optional[str] = None):
    """Get all venues with optional filters"""
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    if sport:
        query["sport"] = sport
    venues = await db.venues.find(query).sort("created_at", -1).to_list(1000)
    return [Venue(**venue) for venue in venues]

@api_router.get("/admin/venues/{venue_id}", response_model=Venue)
async def admin_get_venue(venue_id: str):
    """Get single venue details"""
    venue = await db.venues.find_one({"id": venue_id})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return Venue(**venue)

@api_router.post("/admin/venues", response_model=Venue)
async def admin_create_venue(venue: VenueCreate):
    """Create a new venue"""
    # Generate time slots
    slots = []
    start_hour = 6
    for i in range(16):
        hour = start_hour + i
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        if display_hour == 0:
            display_hour = 12
        time_str = f"{display_hour:02d}:00 {am_pm}"
        slots.append(TimeSlot(time=time_str, available=True, price=venue.base_price))
    
    venue_dict = venue.dict()
    venue_dict['slots'] = [slot.dict() for slot in slots]
    venue_obj = Venue(**venue_dict)
    
    await db.venues.insert_one(venue_obj.dict())
    return venue_obj

@api_router.put("/admin/venues/{venue_id}", response_model=Venue)
async def admin_update_venue(venue_id: str, venue_update: VenueUpdate):
    """Update venue details"""
    update_data = {k: v for k, v in venue_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # If base_price is updated, also update slot prices
    if "base_price" in update_data:
        venue = await db.venues.find_one({"id": venue_id})
        if venue and venue.get('slots'):
            updated_slots = []
            for slot in venue['slots']:
                slot['price'] = update_data['base_price']
                updated_slots.append(slot)
            update_data['slots'] = updated_slots
    
    result = await db.venues.update_one({"id": venue_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    venue = await db.venues.find_one({"id": venue_id})
    return Venue(**venue)

@api_router.delete("/admin/venues/{venue_id}")
async def admin_delete_venue(venue_id: str):
    """Delete a venue"""
    result = await db.venues.delete_one({"id": venue_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Venue not found")
    return {"success": True, "message": "Venue deleted"}


# ============= ADMIN USER CRUD =============

@api_router.get("/admin/users", response_model=List[User])
async def admin_get_all_users(search: Optional[str] = None):
    """Get all users with optional search"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    users = await db.users.find(query).sort("created_at", -1).to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/admin/users/{user_id}", response_model=User)
async def admin_get_user(user_id: str):
    """Get single user details"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.get("/admin/users/{user_id}/stats")
async def admin_get_user_stats(user_id: str):
    """Get detailed stats for a user"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    total_bookings = await db.bookings.count_documents({"user_id": user_id})
    completed_bookings = await db.bookings.count_documents({"user_id": user_id, "status": "completed"})
    
    spent_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]
    spent_result = await db.bookings.aggregate(spent_pipeline).to_list(1)
    total_spent = spent_result[0]["total"] if spent_result else 0
    
    total_videos = await db.videos.count_documents({"user_id": user_id})
    recent_bookings = await db.bookings.find({"user_id": user_id}).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "user": User(**user),
        "total_bookings": total_bookings,
        "completed_bookings": completed_bookings,
        "total_spent": total_spent,
        "total_videos": total_videos,
        "recent_bookings": [Booking(**b) for b in recent_bookings]
    }

@api_router.post("/admin/users", response_model=User)
async def admin_create_user(user: UserCreate):
    """Create a new user"""
    existing = await db.users.find_one({"phone": user.phone})
    if existing:
        raise HTTPException(status_code=400, detail="User with this phone already exists")
    
    new_user = User(**user.dict())
    await db.users.insert_one(new_user.dict())
    return new_user

@api_router.put("/admin/users/{user_id}", response_model=User)
async def admin_update_user(user_id: str, user_update: UserUpdate):
    """Update user details"""
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Check phone uniqueness if updating phone
    if "phone" in update_data:
        existing = await db.users.find_one({"phone": update_data["phone"], "id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already in use")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id})
    return User(**user)

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str):
    """Delete a user"""
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User deleted"}


# ============= ADMIN BOOKING CRUD =============

@api_router.get("/admin/bookings", response_model=List[Booking])
async def admin_get_all_bookings(
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    venue_id: Optional[str] = None,
    date: Optional[str] = None
):
    """Get all bookings with optional filters"""
    query = {}
    if status:
        query['status'] = status
    if user_id:
        query['user_id'] = user_id
    if venue_id:
        query['venue_id'] = venue_id
    if date:
        query['date'] = date
    
    bookings = await db.bookings.find(query).sort("created_at", -1).to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/admin/bookings/{booking_id}", response_model=Booking)
async def admin_get_booking(booking_id: str):
    """Get single booking details"""
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return Booking(**booking)

@api_router.post("/admin/bookings", response_model=Booking)
async def admin_create_booking(booking: BookingCreate):
    """Create a new booking (admin)"""
    booking_obj = Booking(**booking.dict())
    await db.bookings.insert_one(booking_obj.dict())
    return booking_obj

@api_router.put("/admin/bookings/{booking_id}", response_model=Booking)
async def admin_update_booking(booking_id: str, booking_update: BookingUpdate):
    """Update booking details"""
    update_data = {k: v for k, v in booking_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    if "status" in update_data and update_data["status"] not in ["confirmed", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking = await db.bookings.find_one({"id": booking_id})
    return Booking(**booking)

@api_router.put("/admin/bookings/{booking_id}/status")
async def admin_update_booking_status(booking_id: str, status: str):
    """Quick status update for booking"""
    if status not in ["confirmed", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"success": True, "status": status}

@api_router.delete("/admin/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str):
    """Delete a booking"""
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"success": True, "message": "Booking deleted"}


# ============= ADMIN VIDEO CRUD =============

@api_router.get("/admin/videos", response_model=List[Video])
async def admin_get_all_videos(
    user_id: Optional[str] = None,
    sport: Optional[str] = None,
    is_featured: Optional[bool] = None
):
    """Get all videos with optional filters"""
    query = {}
    if user_id:
        query['user_id'] = user_id
    if sport:
        query['sport'] = sport
    if is_featured is not None:
        query['is_featured'] = is_featured
    
    videos = await db.videos.find(query).sort("created_at", -1).to_list(1000)
    return [Video(**video) for video in videos]

@api_router.get("/admin/videos/{video_id}", response_model=Video)
async def admin_get_video(video_id: str):
    """Get single video details"""
    video = await db.videos.find_one({"id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return Video(**video)

@api_router.post("/admin/videos", response_model=Video)
async def admin_create_video(video: VideoCreate):
    """Create a new video"""
    video_obj = Video(**video.dict())
    await db.videos.insert_one(video_obj.dict())
    return video_obj

@api_router.put("/admin/videos/{video_id}", response_model=Video)
async def admin_update_video(video_id: str, video_update: VideoUpdate):
    """Update video details"""
    update_data = {k: v for k, v in video_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.videos.update_one({"id": video_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video = await db.videos.find_one({"id": video_id})
    return Video(**video)

@api_router.delete("/admin/videos/{video_id}")
async def admin_delete_video(video_id: str):
    """Delete a video"""
    result = await db.videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"success": True, "message": "Video deleted"}


# ============= ADMIN MANAGEMENT =============

@api_router.get("/admin/admins", response_model=List[Admin])
async def admin_get_all_admins():
    """Get all admin users"""
    admins = await db.admins.find().to_list(100)
    return [Admin(**admin) for admin in admins]

@api_router.post("/admin/admins", response_model=Admin)
async def admin_create_admin(admin: AdminCreate):
    """Create a new admin"""
    existing = await db.admins.find_one({"phone": admin.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Admin with this phone already exists")
    
    new_admin = Admin(**admin.dict())
    await db.admins.insert_one(new_admin.dict())
    return new_admin

@api_router.put("/admin/admins/{admin_id}", response_model=Admin)
async def admin_update_admin(admin_id: str, admin_update: AdminUpdate):
    """Update admin details"""
    update_data = {k: v for k, v in admin_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.admins.update_one({"id": admin_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    admin = await db.admins.find_one({"id": admin_id})
    return Admin(**admin)

@api_router.delete("/admin/admins/{admin_id}")
async def admin_delete_admin(admin_id: str):
    """Delete an admin"""
    result = await db.admins.delete_one({"id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"success": True, "message": "Admin deleted"}


# ============= PUBLIC USER ROUTES =============

@api_router.get("/")
async def root():
    return {
        "message": "ClashON API - Book Courts. Capture Glory.",
        "version": "2.0",
        "status": "active",
        "demo_mode": DUMMY_OTP_MODE,
        "demo_otp": DUMMY_OTP if DUMMY_OTP_MODE else None
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
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    user = await db.users.find_one({"id": user_id})
    return User(**user)


# ============= PUBLIC VENUE ROUTES =============

@api_router.post("/venues", response_model=Venue)
async def create_venue(venue: VenueCreate):
    """Create a new venue (public)"""
    slots = []
    start_hour = 6
    for i in range(16):
        hour = start_hour + i
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        if display_hour == 0:
            display_hour = 12
        time_str = f"{display_hour:02d}:00 {am_pm}"
        slots.append(TimeSlot(time=time_str, available=True, price=venue.base_price))
    
    venue_dict = venue.dict()
    venue_dict['slots'] = [slot.dict() for slot in slots]
    venue_obj = Venue(**venue_dict)
    
    await db.venues.insert_one(venue_obj.dict())
    return venue_obj

@api_router.get("/venues", response_model=List[Venue])
async def get_venues(sport: Optional[str] = None):
    """Get all active venues"""
    query = {"is_active": True}
    if sport:
        query['sport'] = sport
    venues = await db.venues.find(query).to_list(100)
    return [Venue(**venue) for venue in venues]

@api_router.get("/venues/{venue_id}", response_model=Venue)
async def get_venue(venue_id: str):
    """Get a specific venue"""
    venue = await db.venues.find_one({"id": venue_id})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return Venue(**venue)


# ============= PUBLIC BOOKING ROUTES =============

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    """Create a new booking"""
    booking_obj = Booking(**booking.dict())
    await db.bookings.insert_one(booking_obj.dict())
    return booking_obj

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(user_id: Optional[str] = None):
    """Get bookings for a user"""
    query = {}
    if user_id:
        query['user_id'] = user_id
    bookings = await db.bookings.find(query).sort("created_at", -1).to_list(100)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    """Get a specific booking"""
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return Booking(**booking)

@api_router.put("/bookings/{booking_id}/video-status")
async def update_video_status(booking_id: str, status: str, video_url: Optional[str] = None):
    """Update video status for a booking"""
    update_data = {"video_status": status}
    if video_url:
        update_data["video_url"] = video_url
    
    result = await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"success": True, "status": status}


# ============= PUBLIC VIDEO ROUTES =============

@api_router.post("/videos", response_model=Video)
async def create_video(video: VideoCreate):
    """Create a new video"""
    video_obj = Video(**video.dict())
    await db.videos.insert_one(video_obj.dict())
    return video_obj

@api_router.get("/videos", response_model=List[Video])
async def get_videos():
    """Get all public videos for Flex Feed"""
    videos = await db.videos.find({"is_public": True}).sort("created_at", -1).to_list(100)
    return [Video(**video) for video in videos]

@api_router.put("/videos/{video_id}/like")
async def like_video(video_id: str):
    """Like a video"""
    result = await db.videos.update_one({"id": video_id}, {"$inc": {"likes": 1}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"success": True}

@api_router.put("/videos/{video_id}/view")
async def view_video(video_id: str):
    """Increment video view count"""
    result = await db.videos.update_one({"id": video_id}, {"$inc": {"views": 1}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"success": True}


# ============= APP CONFIGURATION =============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
