# CourtBook - Playo-like Court Booking with AI Super Video

A modern mobile app for booking sports courts (Badminton & Cricket) with an innovative AI-powered "Super Video" feature that creates highlight reels from your games.

## 🎯 Features Implemented

### 1. **Venue Discovery & Booking**
- Browse courts by sport (Badminton/Cricket)
- Search venues by name or location
- View venue details with ratings and amenities
- "Smart Recording" badges for video-enabled venues
- Select date and 60-minute time slots
- Real-time pricing display

### 2. **Super Video Service**
- Toggle "Add Super Video" during checkout
- Mock AI video processing (ready for real integration)
- Features included:
  - 15-second action clips
  - Neon ball tracer effects
  - Super shot animations
  - Scoreboard outro
- Video price addon: ₹150-400 based on venue

### 3. **Booking Management**
- Secure 6-digit PIN codes for court access
- Booking status tracking (Confirmed/Completed/Cancelled)
- Video processing status (Pending/Processing/Ready)
- Filter bookings by status
- View all booking details and history

### 4. **Flex Feed (Social)**
- TikTok-style vertical scroll video feed
- View Super Video highlights from other users
- Like, comment, and share videos
- "Book this Court" CTA on every video
- Direct venue booking from videos

### 5. **Profile**
- Editable user profile
- Stats dashboard (bookings, videos, achievements)
- Menu items for favorites, notifications, payments
- Settings and support access

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)
- **Framework**: FastAPI with async/await
- **Database**: MongoDB with Motor async driver
- **Models**: Venues, Bookings, Videos
- **API Prefix**: All routes under `/api`

### Frontend (Expo + React Native)
- **Framework**: Expo Router (file-based routing)
- **Navigation**: React Navigation with tabs
- **State Management**: Zustand
- **UI Components**: Native React Native components
- **Styling**: StyleSheet with 8pt grid system

## 📁 Project Structure

```
app/
├── backend/
│   ├── server.py          # FastAPI app with all endpoints
│   ├── seed_data.py       # Sample venue data seeder
│   └── .env               # Environment variables
├── frontend/
│   ├── app/
│   │   ├── (tabs)/        # Tab navigation screens
│   │   │   ├── index.tsx           # Home/Venue Discovery
│   │   │   ├── flex-feed.tsx       # Social Video Feed
│   │   │   ├── bookings.tsx        # My Bookings
│   │   │   └── profile.tsx         # User Profile
│   │   ├── venue/[id].tsx          # Venue Detail Screen
│   │   ├── checkout.tsx            # Checkout Flow
│   │   └── booking-success.tsx     # Success Screen
│   ├── store/
│   │   └── useStore.ts             # Zustand State
│   └── .env                        # Environment variables
└── test_result.md                  # Testing documentation
```

## 🚀 API Endpoints

### Venues
- `GET /api/venues` - List all venues (optional ?sport filter)
- `GET /api/venues/{id}` - Get venue details
- `POST /api/venues` - Create new venue

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings (optional ?user_name filter)
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}/video-status` - Update video status

### Videos
- `POST /api/videos` - Create video
- `GET /api/videos` - List all videos
- `PUT /api/videos/{id}/like` - Like video
- `PUT /api/videos/{id}/view` - Increment views

## 📊 Sample Data

6 sample venues pre-seeded:
- **Badminton**: SportHub Arena, Elite Badminton Center, Ace Badminton Club
- **Cricket**: Champions Cricket Ground, Victory Cricket Academy, Premier Cricket Stadium

Each venue has:
- 16 time slots (6 AM - 9 PM)
- 4-5 amenities
- Smart Recording enabled
- Base pricing + Super Video addon pricing

## 🎨 Design System

### Colors
- **Primary**: #10b981 (Green)
- **Background**: #111827 (Dark Gray)
- **Cards**: #1f2937 (Medium Gray)
- **Text**: #ffffff (White), #9ca3af (Light Gray)
- **Accent**: #ef4444 (Red for video badges)

### Typography
- **Headers**: 24-28px, Bold
- **Body**: 14-16px, Regular
- **Small**: 12-13px, Regular

### Components
- **Touch Targets**: Minimum 44x44px
- **Border Radius**: 8-16px
- **Spacing**: 8pt grid (8, 16, 24, 32px)
- **Cards**: Elevated with shadows

## 🧪 Testing Status

### Backend: ✅ 100% Working
- All 13 API endpoints tested and working
- Venue filtering and retrieval working
- Booking creation with PIN codes working
- Video APIs functional

### Frontend: ⏳ Ready for Testing
- All screens implemented
- Navigation flow complete
- State management configured
- Backend integration ready

## 🚀 What's Mocked (MVP)

1. **Payment**: Mock payment flow (ready for Razorpay/Stripe)
2. **Video Processing**: Mock AI processing (ready for Shotstack/Magnifi)
3. **Video Playback**: Placeholder (ready for react-native-video)
4. **Camera/Recording**: Assumed (ready for IoT integration)
5. **Notifications**: In-app only (ready for push notifications)

## 🎯 Next Steps for Production

1. **Integrate Real Payment Gateway**
   - Add Razorpay/Stripe SDK
   - Implement payment verification
   - Add payment history

2. **Integrate Video Processing API**
   - Connect to Shotstack or Magnifi
   - Implement real video upload from courts
   - Add video storage (AWS S3/Cloudinary)

3. **Add Authentication**
   - Implement JWT/OAuth
   - Add user registration/login
   - Secure booking history

4. **Push Notifications**
   - Expo Notifications
   - Booking reminders
   - Video ready alerts

5. **Advanced Features**
   - Real-time court availability
   - Live Replay feature
   - Coach Mode analysis
   - Social sharing (Instagram/WhatsApp)
   - Payment history
   - Favorites system

## 💡 Unique Differentiators vs Playo

1. **Super Video Service**: AI-powered highlight reels with graphics
2. **Flex Feed**: Social discovery through game highlights
3. **Book from Videos**: Direct booking from social feed
4. **Smart Recording Badge**: Clear indication of video capability
5. **Integrated Flow**: Seamless from booking to video delivery

## 📱 User Flow

1. **Browse** → User opens app, sees venue cards with filters
2. **Select** → User picks venue, chooses date & time slot
3. **Checkout** → User toggles Super Video, sees price breakdown
4. **Pay** → Mock payment confirmation
5. **Success** → User receives PIN code & booking confirmation
6. **Play** → User uses PIN to access court
7. **Video** → AI processes game footage (mock)
8. **Share** → User views highlight in Bookings or Flex Feed
9. **Social** → Other users discover venue through Flex Feed
10. **Repeat** → "Book this Court" drives new bookings

## 🎉 MVP Complete!

This is a fully functional MVP of a court booking platform with innovative AI video features, ready for real-world integration of payment, video processing, and IoT camera systems.
