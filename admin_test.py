#!/usr/bin/env python3
"""
ClashON Admin Backend API Testing Script
Tests all admin-specific backend endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Use the production URL from frontend/.env
BASE_URL = "https://admin-dashboard-900.preview.emergentagent.com/api"

class ClashONAdminTester:
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
                if "ClashON API" in data.get("message", ""):
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
    
    def test_check_user_type_admin(self):
        """Test POST /api/auth/check-user-type with admin phone"""
        try:
            admin_phone = "9916444412"
            response = self.session.post(
                f"{self.base_url}/auth/check-user-type",
                json={"phone": admin_phone}
            )
            if response.status_code == 200:
                data = response.json()
                if (data.get("user_type") == "admin" and 
                    data.get("name") == "Admin"):
                    self.log_test("Check Admin User Type", True, f"Correctly identified admin: {data}")
                    return True
                else:
                    self.log_test("Check Admin User Type", False, f"Wrong user type or name: {data}")
                    return False
            else:
                self.log_test("Check Admin User Type", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Check Admin User Type", False, f"Error: {str(e)}")
            return False
    
    def test_check_user_type_regular(self):
        """Test POST /api/auth/check-user-type with regular phone"""
        try:
            regular_phone = "9876543210"
            response = self.session.post(
                f"{self.base_url}/auth/check-user-type",
                json={"phone": regular_phone}
            )
            if response.status_code == 200:
                data = response.json()
                user_type = data.get("user_type")
                if user_type in ["user", "new_user"]:
                    self.log_test("Check Regular User Type", True, f"Correctly identified non-admin: {data}")
                    return True
                else:
                    self.log_test("Check Regular User Type", False, f"Wrong user type: {data}")
                    return False
            else:
                self.log_test("Check Regular User Type", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Check Regular User Type", False, f"Error: {str(e)}")
            return False
    
    def test_admin_dashboard_stats(self):
        """Test GET /api/admin/dashboard/stats"""
        try:
            response = self.session.get(f"{self.base_url}/admin/dashboard/stats")
            if response.status_code == 200:
                stats = response.json()
                required_fields = [
                    "total_users", "total_venues", "total_bookings", 
                    "total_revenue", "recent_bookings"
                ]
                
                missing_fields = [field for field in required_fields if field not in stats]
                if not missing_fields:
                    self.log_test("Admin Dashboard Stats", True, f"All required fields present: users={stats.get('total_users')}, venues={stats.get('total_venues')}, bookings={stats.get('total_bookings')}, revenue={stats.get('total_revenue')}")
                    return stats
                else:
                    self.log_test("Admin Dashboard Stats", False, f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_test("Admin Dashboard Stats", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Admin Dashboard Stats", False, f"Error: {str(e)}")
            return None
    
    def test_admin_get_venues(self):
        """Test GET /api/admin/venues"""
        try:
            response = self.session.get(f"{self.base_url}/admin/venues")
            if response.status_code == 200:
                venues = response.json()
                if isinstance(venues, list):
                    self.log_test("Admin Get Venues", True, f"Retrieved {len(venues)} venues")
                    return venues
                else:
                    self.log_test("Admin Get Venues", False, f"Response is not a list: {type(venues)}")
                    return None
            else:
                self.log_test("Admin Get Venues", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Admin Get Venues", False, f"Error: {str(e)}")
            return None
    
    def test_admin_delete_venue(self, venues):
        """Test DELETE /api/admin/venues/{venue_id}"""
        if not venues or len(venues) == 0:
            self.log_test("Admin Delete Venue", False, "No venues available to test deletion")
            return False
            
        try:
            # Get a venue to delete (create a test venue first)
            test_venue_data = {
                "name": "Test Venue For Deletion",
                "location": "Test Location",
                "sport": "Badminton",
                "base_price": 500.0,
                "super_video_price": 200.0,
                "amenities": ["Test Amenity"]
            }
            
            # Create test venue
            create_response = self.session.post(f"{self.base_url}/venues", json=test_venue_data)
            if create_response.status_code == 200:
                test_venue = create_response.json()
                venue_id = test_venue['id']
                
                # Now delete it
                delete_response = self.session.delete(f"{self.base_url}/admin/venues/{venue_id}")
                if delete_response.status_code == 200:
                    delete_data = delete_response.json()
                    if delete_data.get("success") is True:
                        self.log_test("Admin Delete Venue", True, f"Successfully deleted venue {venue_id}")
                        return True
                    else:
                        self.log_test("Admin Delete Venue", False, f"Delete response indicates failure: {delete_data}")
                        return False
                else:
                    self.log_test("Admin Delete Venue", False, f"HTTP {delete_response.status_code}: {delete_response.text}")
                    return False
            else:
                self.log_test("Admin Delete Venue", False, f"Failed to create test venue: HTTP {create_response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Delete Venue", False, f"Error: {str(e)}")
            return False
    
    def test_admin_get_users(self):
        """Test GET /api/admin/users"""
        try:
            response = self.session.get(f"{self.base_url}/admin/users")
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    self.log_test("Admin Get Users", True, f"Retrieved {len(users)} users")
                    return users
                else:
                    self.log_test("Admin Get Users", False, f"Response is not a list: {type(users)}")
                    return None
            else:
                self.log_test("Admin Get Users", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Admin Get Users", False, f"Error: {str(e)}")
            return None
    
    def test_admin_get_user_stats(self, users):
        """Test GET /api/admin/users/{user_id}/stats"""
        if not users or len(users) == 0:
            self.log_test("Admin Get User Stats", False, "No users available to test stats")
            return False
            
        try:
            user_id = users[0]['id']
            response = self.session.get(f"{self.base_url}/admin/users/{user_id}/stats")
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["user", "total_bookings", "total_spent", "recent_bookings"]
                missing_fields = [field for field in required_fields if field not in stats]
                
                if not missing_fields:
                    self.log_test("Admin Get User Stats", True, f"User stats retrieved: bookings={stats.get('total_bookings')}, spent={stats.get('total_spent')}")
                    return True
                else:
                    self.log_test("Admin Get User Stats", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Admin Get User Stats", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Admin Get User Stats", False, f"Error: {str(e)}")
            return False
    
    def test_admin_get_bookings(self):
        """Test GET /api/admin/bookings"""
        try:
            response = self.session.get(f"{self.base_url}/admin/bookings")
            if response.status_code == 200:
                bookings = response.json()
                if isinstance(bookings, list):
                    self.log_test("Admin Get Bookings", True, f"Retrieved {len(bookings)} bookings")
                    return bookings
                else:
                    self.log_test("Admin Get Bookings", False, f"Response is not a list: {type(bookings)}")
                    return None
            else:
                self.log_test("Admin Get Bookings", False, f"HTTP {response.status_code}: {response.text}")
                return None
        except Exception as e:
            self.log_test("Admin Get Bookings", False, f"Error: {str(e)}")
            return None
    
    def test_admin_update_booking_status(self, bookings):
        """Test PUT /api/admin/bookings/{booking_id}/status"""
        if not bookings or len(bookings) == 0:
            self.log_test("Admin Update Booking Status", False, "No bookings available to test status update")
            return False
            
        try:
            booking_id = bookings[0]['id']
            new_status = "completed"
            
            response = self.session.put(
                f"{self.base_url}/admin/bookings/{booking_id}/status",
                params={"status": new_status}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") is True and result.get("status") == new_status:
                    self.log_test("Admin Update Booking Status", True, f"Successfully updated booking {booking_id} to {new_status}")
                    return True
                else:
                    self.log_test("Admin Update Booking Status", False, f"Update response indicates failure: {result}")
                    return False
            else:
                self.log_test("Admin Update Booking Status", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Admin Update Booking Status", False, f"Error: {str(e)}")
            return False
    
    def run_all_admin_tests(self):
        """Run all admin API tests"""
        print(f"🚀 Starting ClashON Admin Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test API connectivity
        if not self.test_api_root():
            print("❌ API not accessible. Stopping tests.")
            return False
        
        # Test Auth APIs
        print("\n🔐 Testing Auth APIs...")
        self.test_check_user_type_admin()
        self.test_check_user_type_regular()
        
        # Test Admin Dashboard
        print("\n📊 Testing Admin Dashboard APIs...")
        self.test_admin_dashboard_stats()
        
        # Test Admin Venue Management
        print("\n🏟️ Testing Admin Venue APIs...")
        venues = self.test_admin_get_venues()
        self.test_admin_delete_venue(venues)
        
        # Test Admin User Management
        print("\n👥 Testing Admin User APIs...")
        users = self.test_admin_get_users()
        self.test_admin_get_user_stats(users)
        
        # Test Admin Booking Management
        print("\n📋 Testing Admin Booking APIs...")
        bookings = self.test_admin_get_bookings()
        self.test_admin_update_booking_status(bookings)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 ADMIN TEST SUMMARY")
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
    tester = ClashONAdminTester()
    success = tester.run_all_admin_tests()
    sys.exit(0 if success else 1)