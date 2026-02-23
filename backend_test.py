#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for ClashON Admin APIs
Testing all Admin CRUD operations as requested
"""

import requests
import json
import sys
import os
from datetime import datetime

# Use environment URL or fallback
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://admin-dashboard-900.preview.emergentagent.com')
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

def log_test(message, status="INFO"):
    color = Colors.BLUE if status == "INFO" else Colors.GREEN if status == "PASS" else Colors.RED if status == "FAIL" else Colors.YELLOW
    print(f"{color}[{status}]{Colors.RESET} {message}")

def log_error(message, response=None):
    log_test(f"❌ {message}", "FAIL")
    if response:
        try:
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.json()}")
        except:
            print(f"   Response: {response.text[:200]}...")

def log_success(message):
    log_test(f"✅ {message}", "PASS")

def test_api_endpoint(method, endpoint, data=None, expected_status=200, description=""):
    """Generic API test function"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(url, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code == expected_status:
            log_success(f"{method} {endpoint} - {description}")
            return response
        else:
            log_error(f"{method} {endpoint} - {description} (Expected {expected_status}, got {response.status_code})", response)
            return None
    except requests.exceptions.RequestException as e:
        log_error(f"{method} {endpoint} - {description} (Connection Error: {e})")
        return None
    except Exception as e:
        log_error(f"{method} {endpoint} - {description} (Error: {e})")
        return None

def main():
    print(f"\n{Colors.BOLD}🚀 ClashON Admin API Test Suite{Colors.RESET}")
    print(f"Testing against: {BACKEND_URL}")
    print(f"Base API URL: {BASE_URL}")
    print("=" * 60)
    
    # Store test data for cleanup
    created_resources = {
        'venues': [],
        'users': [],
        'bookings': [],
        'videos': []
    }
    
    # ===== 1. AUTHENTICATION TESTS =====
    print(f"\n{Colors.BOLD}1. AUTHENTICATION TESTS{Colors.RESET}")
    
    # Check user type
    response = test_api_endpoint(
        "POST", "/auth/check-user-type",
        {"phone": ADMIN_PHONE},
        200, "Check admin user type"
    )
    if response and response.json().get("user_type") != "admin":
        log_error("Admin phone not recognized as admin!")
        return False
    
    # Check regular user type
    test_api_endpoint(
        "POST", "/auth/check-user-type",
        {"phone": "9999999999"},
        200, "Check regular user type"
    )
    
    # Request admin OTP
    response = test_api_endpoint(
        "POST", "/admin/auth/request-otp",
        {"phone": ADMIN_PHONE},
        200, "Request admin OTP"
    )
    if response and response.json().get("demo_otp") != TEST_OTP:
        log_error(f"Expected demo OTP {TEST_OTP}, got {response.json().get('demo_otp')}")
    
    # Verify admin OTP
    test_api_endpoint(
        "POST", "/admin/auth/verify-otp",
        {"phone": ADMIN_PHONE, "otp": TEST_OTP},
        200, "Verify admin OTP"
    )
    
    # ===== 2. DASHBOARD STATS =====
    print(f"\n{Colors.BOLD}2. DASHBOARD STATS{Colors.RESET}")
    
    response = test_api_endpoint(
        "GET", "/admin/dashboard/stats",
        None, 200, "Get dashboard statistics"
    )
    if response:
        stats = response.json()
        required_fields = ['total_users', 'total_venues', 'total_bookings', 'total_revenue', 'recent_bookings']
        for field in required_fields:
            if field not in stats:
                log_error(f"Missing field in dashboard stats: {field}")
            else:
                log_test(f"   {field}: {stats[field]}", "INFO")
    
    # ===== 3. VENUE CRUD TESTS =====
    print(f"\n{Colors.BOLD}3. VENUE CRUD TESTS{Colors.RESET}")
    
    # Get all venues
    response = test_api_endpoint(
        "GET", "/admin/venues",
        None, 200, "Get all venues"
    )
    if response:
        venues = response.json()
        log_test(f"   Found {len(venues)} venues", "INFO")
    
    # Create a new venue
    venue_data = {
        "name": "Test Admin Venue",
        "location": "Admin Test Location",
        "sport": "Badminton",
        "base_price": 500.0,
        "amenities": ["Parking", "Washroom"],
        "description": "Test venue created by admin"
    }
    
    response = test_api_endpoint(
        "POST", "/admin/venues",
        venue_data, 200, "Create new venue"
    )
    if response:
        created_venue = response.json()
        venue_id = created_venue['id']
        created_resources['venues'].append(venue_id)
        log_test(f"   Created venue ID: {venue_id}", "INFO")
        
        # Update the venue
        update_data = {
            "name": "Updated Test Venue",
            "base_price": 600.0
        }
        response = test_api_endpoint(
            "PUT", f"/admin/venues/{venue_id}",
            update_data, 200, "Update venue"
        )
        
        # Get specific venue
        test_api_endpoint(
            "GET", f"/admin/venues/{venue_id}",
            None, 200, "Get specific venue"
        )
        
        # Delete the venue (cleanup)
        test_api_endpoint(
            "DELETE", f"/admin/venues/{venue_id}",
            None, 200, "Delete venue"
        )
        created_resources['venues'].remove(venue_id)
    
    # ===== 4. USER CRUD TESTS =====
    print(f"\n{Colors.BOLD}4. USER CRUD TESTS{Colors.RESET}")
    
    # Get all users
    response = test_api_endpoint(
        "GET", "/admin/users",
        None, 200, "Get all users"
    )
    if response:
        users = response.json()
        log_test(f"   Found {len(users)} users", "INFO")
    
    # Create a new user
    user_data = {
        "name": "Admin Test User",
        "phone": "9876543210",
        "email": "admintest@example.com"
    }
    
    response = test_api_endpoint(
        "POST", "/admin/users",
        user_data, 200, "Create new user"
    )
    if response:
        created_user = response.json()
        user_id = created_user['id']
        created_resources['users'].append(user_id)
        log_test(f"   Created user ID: {user_id}", "INFO")
        
        # Get specific user
        test_api_endpoint(
            "GET", f"/admin/users/{user_id}",
            None, 200, "Get specific user"
        )
        
        # Get user stats
        response = test_api_endpoint(
            "GET", f"/admin/users/{user_id}/stats",
            None, 200, "Get user stats"
        )
        if response:
            stats = response.json()
            log_test(f"   User stats: {stats.get('total_bookings', 0)} bookings, ${stats.get('total_spent', 0)} spent", "INFO")
        
        # Update user
        update_data = {
            "name": "Updated Test User",
            "email": "updated@example.com"
        }
        test_api_endpoint(
            "PUT", f"/admin/users/{user_id}",
            update_data, 200, "Update user"
        )
        
        # Delete user (cleanup)
        test_api_endpoint(
            "DELETE", f"/admin/users/{user_id}",
            None, 200, "Delete user"
        )
        created_resources['users'].remove(user_id)
    
    # ===== 5. BOOKING CRUD TESTS =====
    print(f"\n{Colors.BOLD}5. BOOKING CRUD TESTS{Colors.RESET}")
    
    # Get all bookings
    response = test_api_endpoint(
        "GET", "/admin/bookings",
        None, 200, "Get all bookings"
    )
    if response:
        bookings = response.json()
        log_test(f"   Found {len(bookings)} bookings", "INFO")
        
        # If we have bookings, test updating one
        if bookings:
            booking_id = bookings[0]['id']
            log_test(f"   Testing with booking ID: {booking_id}", "INFO")
            
            # Update booking status
            response = test_api_endpoint(
                "PUT", f"/admin/bookings/{booking_id}",
                {"status": "completed"}, 200, "Update booking status"
            )
            
            # Get specific booking
            test_api_endpoint(
                "GET", f"/admin/bookings/{booking_id}",
                None, 200, "Get specific booking"
            )
    
    # ===== 6. VIDEO CRUD TESTS =====
    print(f"\n{Colors.BOLD}6. VIDEO CRUD TESTS{Colors.RESET}")
    
    # Get all videos
    response = test_api_endpoint(
        "GET", "/admin/videos",
        None, 200, "Get all videos"
    )
    if response:
        videos = response.json()
        log_test(f"   Found {len(videos)} videos", "INFO")
    
    # Create a test video
    video_data = {
        "venue_name": "Test Venue",
        "sport": "Badminton",
        "title": "Admin Test Video",
        "description": "Test video created by admin",
        "user_id": "test-user-id",
        "user_name": "Test User",
        "duration": 60
    }
    
    response = test_api_endpoint(
        "POST", "/admin/videos",
        video_data, 200, "Create new video"
    )
    if response:
        created_video = response.json()
        video_id = created_video['id']
        created_resources['videos'].append(video_id)
        log_test(f"   Created video ID: {video_id}", "INFO")
        
        # Get specific video
        test_api_endpoint(
            "GET", f"/admin/videos/{video_id}",
            None, 200, "Get specific video"
        )
        
        # Update video
        update_data = {
            "title": "Updated Test Video",
            "is_featured": True
        }
        test_api_endpoint(
            "PUT", f"/admin/videos/{video_id}",
            update_data, 200, "Update video"
        )
        
        # Delete video (cleanup)
        test_api_endpoint(
            "DELETE", f"/admin/videos/{video_id}",
            None, 200, "Delete video"
        )
        created_resources['videos'].remove(video_id)
    
    # ===== FINAL CLEANUP =====
    print(f"\n{Colors.BOLD}CLEANUP{Colors.RESET}")
    
    # Clean up any remaining test resources
    for venue_id in created_resources['venues']:
        test_api_endpoint("DELETE", f"/admin/venues/{venue_id}", None, 200, f"Cleanup venue {venue_id}")
    
    for user_id in created_resources['users']:
        test_api_endpoint("DELETE", f"/admin/users/{user_id}", None, 200, f"Cleanup user {user_id}")
    
    for video_id in created_resources['videos']:
        test_api_endpoint("DELETE", f"/admin/videos/{video_id}", None, 200, f"Cleanup video {video_id}")
    
    print(f"\n{Colors.BOLD}✅ All Admin CRUD API tests completed!{Colors.RESET}")
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Test failed with error: {e}{Colors.RESET}")
        sys.exit(1)