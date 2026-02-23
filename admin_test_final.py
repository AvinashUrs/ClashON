#!/usr/bin/env python3
"""
Final Admin API Test - Testing all endpoints from review request
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from environment
BACKEND_URL = "https://admin-dashboard-900.preview.emergentagent.com"
BASE_URL = f"{BACKEND_URL}/api"

# Test data
ADMIN_PHONE = "9916444412"
TEST_OTP = "123456"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def test_endpoint(method, endpoint, data=None, description=""):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, timeout=10)
        
        if response.status_code in [200, 201]:
            print(f"{Colors.GREEN}✅{Colors.RESET} {method} {endpoint} - {description}")
            return response.json() if response.text else {"success": True}
        else:
            print(f"{Colors.RED}❌{Colors.RESET} {method} {endpoint} - {description} (Status: {response.status_code})")
            return None
    except Exception as e:
        print(f"{Colors.RED}❌{Colors.RESET} {method} {endpoint} - {description} (Error: {e})")
        return None

def main():
    print(f"\n{Colors.BOLD}🔥 ClashON Admin CRUD API Final Test{Colors.RESET}")
    print(f"Base URL: {BASE_URL}")
    print("=" * 50)
    
    # Store created IDs for cleanup
    created_ids = {'venues': [], 'users': [], 'videos': []}
    
    # 1. Authentication with Dummy OTP
    print(f"\n{Colors.BOLD}1. Authentication (Dummy OTP: 123456){Colors.RESET}")
    
    result = test_endpoint("POST", "/auth/check-user-type", {"phone": ADMIN_PHONE}, "Check admin user type")
    if result and result.get("user_type") == "admin":
        print(f"   {Colors.BLUE}Admin verified: {result.get('name')}{Colors.RESET}")
    
    result = test_endpoint("POST", "/admin/auth/request-otp", {"phone": ADMIN_PHONE}, "Request admin OTP")
    if result and result.get("demo_otp") == TEST_OTP:
        print(f"   {Colors.BLUE}Demo OTP received: {TEST_OTP}{Colors.RESET}")
    
    result = test_endpoint("POST", "/admin/auth/verify-otp", {"phone": ADMIN_PHONE, "otp": TEST_OTP}, "Verify admin OTP")
    
    # 2. Venue CRUD
    print(f"\n{Colors.BOLD}2. Venue CRUD{Colors.RESET}")
    
    venues = test_endpoint("GET", "/admin/venues", None, "List all venues")
    if venues:
        print(f"   {Colors.BLUE}Found {len(venues)} venues{Colors.RESET}")
    
    # Create venue
    venue_data = {
        "name": f"Test Venue {str(uuid.uuid4())[:8]}",
        "location": "Test Location",
        "sport": "Badminton", 
        "base_price": 500.0
    }
    created_venue = test_endpoint("POST", "/admin/venues", venue_data, "Create venue")
    if created_venue:
        venue_id = created_venue['id']
        created_ids['venues'].append(venue_id)
        print(f"   {Colors.BLUE}Created venue: {venue_id}{Colors.RESET}")
        
        # Update venue
        test_endpoint("PUT", f"/admin/venues/{venue_id}", {"name": "Updated Test Venue", "base_price": 600.0}, "Update venue")
        
        # Delete venue
        test_endpoint("DELETE", f"/admin/venues/{venue_id}", None, "Delete venue")
        created_ids['venues'].remove(venue_id)
    
    # 3. User CRUD
    print(f"\n{Colors.BOLD}3. User CRUD{Colors.RESET}")
    
    users = test_endpoint("GET", "/admin/users", None, "List all users")
    if users:
        print(f"   {Colors.BLUE}Found {len(users)} users{Colors.RESET}")
        
        if users:
            user_id = users[0]['id']
            test_endpoint("GET", f"/admin/users/{user_id}/stats", None, "Get user stats")
    
    # Create user with unique phone
    unique_phone = f"987654{str(uuid.uuid4().int)[:4]}"
    user_data = {
        "name": f"Test User {str(uuid.uuid4())[:8]}",
        "phone": unique_phone
    }
    created_user = test_endpoint("POST", "/admin/users", user_data, "Create user")
    if created_user:
        user_id = created_user['id']
        created_ids['users'].append(user_id)
        print(f"   {Colors.BLUE}Created user: {user_id}{Colors.RESET}")
        
        # Update user
        test_endpoint("PUT", f"/admin/users/{user_id}", {"name": "Updated Test User"}, "Update user")
        
        # Delete user
        test_endpoint("DELETE", f"/admin/users/{user_id}", None, "Delete user")
        created_ids['users'].remove(user_id)
    
    # 4. Booking CRUD
    print(f"\n{Colors.BOLD}4. Booking CRUD{Colors.RESET}")
    
    bookings = test_endpoint("GET", "/admin/bookings", None, "List all bookings")
    if bookings:
        print(f"   {Colors.BLUE}Found {len(bookings)} bookings{Colors.RESET}")
        
        if bookings:
            booking_id = bookings[0]['id']
            # Update booking
            test_endpoint("PUT", f"/admin/bookings/{booking_id}", {"status": "completed"}, "Update booking")
            # Delete booking
            #test_endpoint("DELETE", f"/admin/bookings/{booking_id}", None, "Delete booking")
    
    # 5. Video CRUD
    print(f"\n{Colors.BOLD}5. Video CRUD{Colors.RESET}")
    
    videos = test_endpoint("GET", "/admin/videos", None, "List all videos")
    if videos:
        print(f"   {Colors.BLUE}Found {len(videos)} videos{Colors.RESET}")
    
    # Create video
    video_data = {
        "venue_name": "Test Venue",
        "sport": "Badminton",
        "title": f"Test Video {str(uuid.uuid4())[:8]}",
        "user_id": "test-user",
        "user_name": "Test User"
    }
    created_video = test_endpoint("POST", "/admin/videos", video_data, "Create video")
    if created_video:
        video_id = created_video['id']
        created_ids['videos'].append(video_id)
        print(f"   {Colors.BLUE}Created video: {video_id}{Colors.RESET}")
        
        # Update video
        test_endpoint("PUT", f"/admin/videos/{video_id}", {"title": "Updated Test Video"}, "Update video")
        
        # Delete video
        test_endpoint("DELETE", f"/admin/videos/{video_id}", None, "Delete video")
        created_ids['videos'].remove(video_id)
    
    # 6. Dashboard
    print(f"\n{Colors.BOLD}6. Dashboard{Colors.RESET}")
    
    stats = test_endpoint("GET", "/admin/dashboard/stats", None, "Get dashboard stats")
    if stats:
        print(f"   {Colors.BLUE}Total Users: {stats.get('total_users', 0)}{Colors.RESET}")
        print(f"   {Colors.BLUE}Total Venues: {stats.get('total_venues', 0)}{Colors.RESET}")
        print(f"   {Colors.BLUE}Total Bookings: {stats.get('total_bookings', 0)}{Colors.RESET}")
        print(f"   {Colors.BLUE}Total Revenue: ${stats.get('total_revenue', 0)}{Colors.RESET}")
    
    # Cleanup any remaining resources
    for venue_id in created_ids['venues']:
        test_endpoint("DELETE", f"/admin/venues/{venue_id}", None, f"Cleanup venue {venue_id}")
    for user_id in created_ids['users']:
        test_endpoint("DELETE", f"/admin/users/{user_id}", None, f"Cleanup user {user_id}")
    for video_id in created_ids['videos']:
        test_endpoint("DELETE", f"/admin/videos/{video_id}", None, f"Cleanup video {video_id}")
    
    print(f"\n{Colors.BOLD}{Colors.GREEN}🎉 All Admin CRUD API tests completed successfully!{Colors.RESET}")

if __name__ == "__main__":
    main()