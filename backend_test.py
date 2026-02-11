#!/usr/bin/env python3
"""
CourtBook Backend API Testing Script
Tests all backend endpoints for the court booking application
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Use the production URL from frontend/.env
BASE_URL = "https://vidcourt.preview.emergentagent.com/api"

class CourtBookTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "CourtBook API" in data.get("message", ""):
                    self.log_test("API Root", True, "API is accessible and responding correctly")
                    return True
                else:
                    self.log_test("API Root", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("API Root", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("API Root", False, f"Connection error: {str(e)}")
            return False
    
    def test_get_venues(self):
        """Test GET /api/venues - Should return 6 venues"""
        try:
            response = self.session.get(f"{self.base_url}/venues")
            if response.status_code == 200:
                venues = response.json()
                if len(venues) == 6:
                    # Check venue structure and slots
                    badminton_count = sum(1 for v in venues if v.get('sport') == 'Badminton')
                    cricket_count = sum(1 for v in venues if v.get('sport') == 'Cricket')
                    
                    # Verify each venue has 16 time slots (6 AM to 9 PM)
                    slots_valid = True
                    for venue in venues:
                        if len(venue.get('slots', [])) != 16:
                            slots_valid = False
                            break
                    
                    if badminton_count == 3 and cricket_count == 3 and slots_valid:
                        self.log_test("Get All Venues", True, f"Found 6 venues (3 Badminton, 3 Cricket) with 16 slots each")
                        return venues
                    else:
                        self.log_test("Get All Venues", False, f"Venue distribution incorrect: {badminton_count} Badminton, {cricket_count} Cricket, slots_valid: {slots_valid}")
                        return None
                else:
                    self.log_test("Get All Venues", False, f"Expected 6 venues, got {len(venues)}")
                    return None
            else:
                self.log_test("Get All Venues", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Get All Venues", False, f"Error: {str(e)}")
            return None
    
    def test_get_venues_by_sport(self):
        """Test GET /api/venues?sport=Badminton - Should filter by sport"""
        try:
            response = self.session.get(f"{self.base_url}/venues?sport=Badminton")
            if response.status_code == 200:
                venues = response.json()
                if len(venues) == 3 and all(v.get('sport') == 'Badminton' for v in venues):
                    self.log_test("Get Venues by Sport", True, f"Found 3 Badminton venues")
                    return True
                else:
                    self.log_test("Get Venues by Sport", False, f"Expected 3 Badminton venues, got {len(venues)}")
                    return False
            else:
                self.log_test("Get Venues by Sport", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Venues by Sport", False, f"Error: {str(e)}")
            return False
    
    def test_get_venue_by_id(self, venues):
        """Test GET /api/venues/{venue_id} - Should return specific venue"""
        if not venues:
            self.log_test("Get Venue by ID", False, "No venues available for testing")
            return None
            
        try:
            venue_id = venues[0]['id']
            response = self.session.get(f"{self.base_url}/venues/{venue_id}")
            if response.status_code == 200:
                venue = response.json()
                if venue['id'] == venue_id and len(venue.get('slots', [])) == 16:
                    self.log_test("Get Venue by ID", True, f"Retrieved venue {venue['name']} with 16 slots")
                    return venue
                else:
                    self.log_test("Get Venue by ID", False, f"Venue data incomplete or incorrect")
                    return None
            else:
                self.log_test("Get Venue by ID", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Get Venue by ID", False, f"Error: {str(e)}")
            return None
    
    def test_create_booking(self, venue):
        """Test POST /api/bookings - Create booking with super_video_enabled=true"""
        if not venue:
            self.log_test("Create Booking", False, "No venue available for booking")
            return None
            
        try:
            booking_data = {
                "venue_id": venue['id'],
                "venue_name": venue['name'],
                "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "time_slot": "09:00 AM",
                "sport": venue['sport'],
                "super_video_enabled": True,
                "total_price": venue['base_price'] + venue['super_video_price'],
                "user_name": "Test User"
            }
            
            response = self.session.post(f"{self.base_url}/bookings", json=booking_data)
            if response.status_code == 200:
                booking = response.json()
                # Verify booking has PIN code (6 digits)
                pin_code = booking.get('pin_code', '')
                if len(pin_code) == 6 and pin_code.isdigit():
                    self.log_test("Create Booking", True, f"Created booking with PIN {pin_code}, super_video_enabled: {booking.get('super_video_enabled')}")
                    return booking
                else:
                    self.log_test("Create Booking", False, f"Invalid PIN code: {pin_code}")
                    return None
            else:
                self.log_test("Create Booking", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Create Booking", False, f"Error: {str(e)}")
            return None
    
    def test_get_bookings(self):
        """Test GET /api/bookings - List all bookings"""
        try:
            response = self.session.get(f"{self.base_url}/bookings")
            if response.status_code == 200:
                bookings = response.json()
                self.log_test("Get All Bookings", True, f"Retrieved {len(bookings)} bookings")
                return bookings
            else:
                self.log_test("Get All Bookings", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Get All Bookings", False, f"Error: {str(e)}")
            return None
    
    def test_get_bookings_by_user(self):
        """Test GET /api/bookings?user_name=Test User - Filter by user"""
        try:
            response = self.session.get(f"{self.base_url}/bookings?user_name=Test User")
            if response.status_code == 200:
                bookings = response.json()
                if all(b.get('user_name') == 'Test User' for b in bookings):
                    self.log_test("Get Bookings by User", True, f"Retrieved {len(bookings)} bookings for Test User")
                    return True
                else:
                    self.log_test("Get Bookings by User", False, "Some bookings don't belong to Test User")
                    return False
            else:
                self.log_test("Get Bookings by User", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Bookings by User", False, f"Error: {str(e)}")
            return False
    
    def test_get_booking_by_id(self, booking):
        """Test GET /api/bookings/{booking_id} - Get specific booking"""
        if not booking:
            self.log_test("Get Booking by ID", False, "No booking available for testing")
            return False
            
        try:
            booking_id = booking['id']
            response = self.session.get(f"{self.base_url}/bookings/{booking_id}")
            if response.status_code == 200:
                retrieved_booking = response.json()
                if retrieved_booking['id'] == booking_id:
                    self.log_test("Get Booking by ID", True, f"Retrieved booking {booking_id}")
                    return True
                else:
                    self.log_test("Get Booking by ID", False, "Booking ID mismatch")
                    return False
            else:
                self.log_test("Get Booking by ID", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Booking by ID", False, f"Error: {str(e)}")
            return False
    
    def test_update_video_status(self, booking):
        """Test PUT /api/bookings/{booking_id}/video-status - Update video status"""
        if not booking:
            self.log_test("Update Video Status", False, "No booking available for testing")
            return False
            
        try:
            booking_id = booking['id']
            # Test status transitions: pending -> processing -> ready
            statuses = ["processing", "ready"]
            
            for status in statuses:
                response = self.session.put(
                    f"{self.base_url}/bookings/{booking_id}/video-status",
                    params={"status": status, "video_url": f"mock_video_{status}.mp4"}
                )
                if response.status_code != 200:
                    self.log_test("Update Video Status", False, f"Failed to update to {status}: HTTP {response.status_code}")
                    return False
            
            self.log_test("Update Video Status", True, "Successfully updated video status through transitions")
            return True
        except Exception as e:
            self.log_test("Update Video Status", False, f"Error: {str(e)}")
            return False
    
    def test_create_video(self, booking):
        """Test POST /api/videos - Create highlight video"""
        if not booking:
            self.log_test("Create Video", False, "No booking available for video creation")
            return None
            
        try:
            video_data = {
                "booking_id": booking['id'],
                "venue_name": booking['venue_name'],
                "sport": booking['sport'],
                "user_name": booking['user_name']
            }
            
            response = self.session.post(f"{self.base_url}/videos", json=video_data)
            if response.status_code == 200:
                video = response.json()
                if video.get('thumbnail') and video.get('video_url'):
                    self.log_test("Create Video", True, f"Created video for booking {booking['id']}")
                    return video
                else:
                    self.log_test("Create Video", False, "Video missing thumbnail or video_url")
                    return None
            else:
                self.log_test("Create Video", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Create Video", False, f"Error: {str(e)}")
            return None
    
    def test_get_videos(self):
        """Test GET /api/videos - List all videos"""
        try:
            response = self.session.get(f"{self.base_url}/videos")
            if response.status_code == 200:
                videos = response.json()
                self.log_test("Get All Videos", True, f"Retrieved {len(videos)} videos")
                return videos
            else:
                self.log_test("Get All Videos", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Get All Videos", False, f"Error: {str(e)}")
            return None
    
    def test_like_video(self, video):
        """Test PUT /api/videos/{video_id}/like - Increment likes"""
        if not video:
            self.log_test("Like Video", False, "No video available for testing")
            return False
            
        try:
            video_id = video['id']
            initial_likes = video.get('likes', 0)
            
            response = self.session.put(f"{self.base_url}/videos/{video_id}/like")
            if response.status_code == 200:
                # Verify likes increased
                updated_response = self.session.get(f"{self.base_url}/videos")
                if updated_response.status_code == 200:
                    videos = updated_response.json()
                    updated_video = next((v for v in videos if v['id'] == video_id), None)
                    if updated_video and updated_video['likes'] == initial_likes + 1:
                        self.log_test("Like Video", True, f"Likes increased from {initial_likes} to {updated_video['likes']}")
                        return True
                    else:
                        self.log_test("Like Video", False, "Likes count not updated correctly")
                        return False
                else:
                    self.log_test("Like Video", True, "Like request successful (couldn't verify count)")
                    return True
            else:
                self.log_test("Like Video", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Like Video", False, f"Error: {str(e)}")
            return False
    
    def test_view_video(self, video):
        """Test PUT /api/videos/{video_id}/view - Increment views"""
        if not video:
            self.log_test("View Video", False, "No video available for testing")
            return False
            
        try:
            video_id = video['id']
            initial_views = video.get('views', 0)
            
            response = self.session.put(f"{self.base_url}/videos/{video_id}/view")
            if response.status_code == 200:
                # Verify views increased
                updated_response = self.session.get(f"{self.base_url}/videos")
                if updated_response.status_code == 200:
                    videos = updated_response.json()
                    updated_video = next((v for v in videos if v['id'] == video_id), None)
                    if updated_video and updated_video['views'] == initial_views + 1:
                        self.log_test("View Video", True, f"Views increased from {initial_views} to {updated_video['views']}")
                        return True
                    else:
                        self.log_test("View Video", False, "Views count not updated correctly")
                        return False
                else:
                    self.log_test("View Video", True, "View request successful (couldn't verify count)")
                    return True
            else:
                self.log_test("View Video", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("View Video", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🚀 Starting CourtBook Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test API connectivity
        if not self.test_api_root():
            print("❌ API not accessible. Stopping tests.")
            return False
        
        # Test Venue APIs
        print("\n📍 Testing Venue APIs...")
        venues = self.test_get_venues()
        self.test_get_venues_by_sport()
        venue = self.test_get_venue_by_id(venues)
        
        # Test Booking APIs
        print("\n📋 Testing Booking APIs...")
        booking = self.test_create_booking(venue)
        self.test_get_bookings()
        self.test_get_bookings_by_user()
        self.test_get_booking_by_id(booking)
        self.test_update_video_status(booking)
        
        # Test Video APIs
        print("\n🎥 Testing Video APIs...")
        video = self.test_create_video(booking)
        videos = self.test_get_videos()
        if video:
            self.test_like_video(video)
            self.test_view_video(video)
        elif videos:
            # Use existing video if available
            self.test_like_video(videos[0])
            self.test_view_video(videos[0])
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = CourtBookTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)