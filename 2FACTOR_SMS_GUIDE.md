# 2Factor.in SMS OTP Configuration Guide

## Current Implementation

**API Key:** `fbba1c8a-7898-11e9-ade6-0200cd936042`
**Phone Number:** `9916444412`

## Endpoint Being Used

```
GET https://2factor.in/API/V1/{api_key}/SMS/{phone}/AUTOGEN/ClashONOTP
```

## If You're Still Getting Voice Calls

### Option 1: Check 2Factor.in Dashboard Settings
1. Login to https://2factor.in/
2. Go to **Settings** or **API Settings**
3. Look for **Default OTP Method**
4. Ensure it's set to **SMS** (not Voice)
5. Check if there's a **DND (Do Not Disturb) fallback** option that switches to voice

### Option 2: Use Transactional SMS Endpoint

If AUTOGEN is forcing voice calls, we can use the transactional SMS endpoint:

**Current Code Location:** `/app/backend/server.py` line ~135

**Alternative Implementation:**
```python
# Generate OTP manually
otp = ''.join(random.choices(string.digits, k=6))

# Send via transactional SMS
url = f"https://2factor.in/API/R1/?module=TRANS_SMS&apikey={TWOFACTOR_API_KEY}&to={request.phone}&from=CLSHON&templatename=ClashONOTP&var1={otp}"

response = requests.get(url, timeout=10)
```

### Option 3: Use SMS Gateway with Template

Create a template in 2Factor.in dashboard:
1. Template Name: `ClashONOTP`
2. Template Content: `{#var#} is your OTP for ClashON. Valid for 5 minutes. Do not share with anyone.`
3. Get template approval
4. Use approved template in API calls

### Option 4: Contact 2Factor.in Support

If SMS is not working:
- Email: support@2factor.in
- Mention: "Getting voice calls instead of SMS with AUTOGEN endpoint"
- Request: Enable SMS-only mode for your API key

## Testing the Current Setup

Test from command line:
```bash
# Test 1: Current implementation
curl "https://2factor.in/API/V1/fbba1c8a-7898-11e9-ade6-0200cd936042/SMS/9916444412/AUTOGEN/ClashONOTP"

# Test 2: Without template name (if template is causing issue)
curl "https://2factor.in/API/V1/fbba1c8a-7898-11e9-ade6-0200cd936042/SMS/9916444412/AUTOGEN"

# Test 3: Check account balance and settings
curl "https://2factor.in/API/V1/fbba1c8a-7898-11e9-ade6-0200cd936042/BAL/SMS"
```

## Current Backend File Location

**File:** `/app/backend/server.py`
**Function:** `request_otp()` (around line 133-165)

To modify the implementation, edit this function and change the URL format.

## Verification Endpoint (This is Working)

The OTP verification is working correctly:
```
GET https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{session_id}/{otp}
```

## Recommended Next Steps

1. **Check 2Factor.in Dashboard** - Verify SMS is enabled
2. **Test the URL directly** - Use curl commands above
3. **Check account balance** - Ensure sufficient SMS credits
4. **Contact 2Factor.in** - If issue persists

## Alternative: Use Different SMS Provider

If 2Factor.in continues to send voice calls, consider:
- **Twilio** - More reliable SMS delivery
- **MSG91** - Indian SMS provider
- **AWS SNS** - Amazon's SMS service

I can help integrate any of these if needed.
