# SOS System - Implementation Guide

## Overview
A complete Manual SOS and Location Request system with 30-minute timeout and automatic SOS trigger.

## Architecture

### Models (Phase 1)
- **User** - Added `trustedContactEmail` field
- **Notification** - Stores web app notifications (SOS, LOCATION_REQUEST, AUTO_SOS)
- **LocationRequest** - Tracks location requests with 30-minute expiry

### Services (Phase 2)
- **emailService.js** - Isolated Nodemailer service for sending emails

### Controllers & Routes (Phase 3, 4, 5)
- **sosController.js** - Handles all SOS-related API endpoints
- **sosRoutes.js** - Route definitions

### Background Job (Phase 6)
- **autoSOSJob.js** - Monitors expired location requests every 1 minute

## API Endpoints

### 1. Manual SOS
```
POST /api/sos/manual
```
**Body:**
```json
{
  "userEmail": "user@example.com",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```
**Response:**
```json
{
  "success": true,
  "message": "SOS alert sent to trusted contact",
  "data": {
    "notificationId": "...",
    "sentTo": "trusted@example.com",
    "location": { "latitude": 40.7128, "longitude": -74.0060 }
  }
}
```

### 2. Request Location
```
POST /api/location/request
```
**Body:**
```json
{
  "userEmail": "user@example.com",
  "receiverEmail": "trusted@example.com"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Location request sent to user",
  "data": {
    "requestId": "...",
    "userEmail": "user@example.com",
    "expiresAt": "2026-01-31T03:30:00.000Z"
  }
}
```

### 3. Accept Location Request
```
POST /api/location/accept
```
**Body:**
```json
{
  "requestId": "...",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 15.5
}
```

### 4. Deny Location Request
```
POST /api/location/deny
```
**Body:**
```json
{
  "requestId": "..."
}
```

## Setup Instructions

### 1. Configure SMTP (Required)
Add to your `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the generated password in `SMTP_PASS`

### 2. Install Dependencies
```bash
cd backend
npm install nodemailer
```

### 3. Start Server
```bash
node server.js
```

You should see:
```
[EMAIL-SERVICE] ✅ SMTP configuration is valid
[AUTO-SOS-JOB] 🚀 Starting Auto SOS background job
[AUTO-SOS-JOB] ✅ Auto SOS job initialized
[SOS-SYSTEM] 🚀 SOS system active and monitoring
Server running on http://localhost:5000
```

## Testing Flow

### Test 1: Manual SOS
```bash
curl -X POST http://localhost:5000/api/sos/manual \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "user@example.com",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

**Expected:**
- ✅ Console logs show SOS processing
- ✅ Email sent to trusted contact
- ✅ Notification created in DB
- ✅ Response with success

### Test 2: Location Request Flow
```bash
# 1. Request location
curl -X POST http://localhost:5000/api/location/request \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "user@example.com",
    "receiverEmail": "trusted@example.com"
  }'

# 2a. Accept (within 30 minutes)
curl -X POST http://localhost:5000/api/location/accept \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQUEST_ID_FROM_STEP_1",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 15.5
  }'

# OR

# 2b. Deny
curl -X POST http://localhost:5000/api/location/deny \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQUEST_ID_FROM_STEP_1"
  }'
```

### Test 3: Auto SOS (30-minute timeout)
1. Create location request (Test 2, step 1)
2. **Do NOT respond** (no accept/deny)
3. Wait 30+ minutes
4. Background job will automatically trigger SOS
5. Check console logs every minute:
   ```
   [AUTO-SOS-JOB] ========== Checking for expired requests ==========
   [AUTO-SOS-JOB] Found 1 expired request(s)
   [AUTO-SOS-JOB] ✅ AUTO SOS email sent successfully
   ```

## Database Schema

### User
```javascript
{
  email: "user@example.com",
  trustedContactEmail: "trusted@example.com",
  // ... other fields
}
```

### Notification
```javascript
{
  toEmail: "trusted@example.com",
  type: "SOS", // or "LOCATION_REQUEST", "AUTO_SOS", etc.
  message: "🚨 EMERGENCY SOS from user@example.com",
  read: false,
  data: {
    latitude: 40.7128,
    longitude: -74.0060,
    userEmail: "user@example.com"
  },
  createdAt: "2026-01-31T02:00:00.000Z"
}
```

### LocationRequest
```javascript
{
  userEmail: "user@example.com",
  receiverEmail: "trusted@example.com",
  status: "PENDING", // or "ACCEPTED", "DENIED", "TIMEOUT"
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 15.5,
    timestamp: "2026-01-31T02:30:00.000Z"
  },
  createdAt: "2026-01-31T02:00:00.000Z",
  expiresAt: "2026-01-31T02:30:00.000Z",
  respondedAt: "2026-01-31T02:15:00.000Z"
}
```

## Console Logs Reference

Every operation produces clear console logs:

### Manual SOS
```
[SOS-MANUAL] ========== MANUAL SOS TRIGGERED ==========
[SOS-MANUAL] Finding user: user@example.com
[SOS-MANUAL] Trusted contact: trusted@example.com
[SOS-MANUAL] ✅ Notification created in DB: 123abc
[EMAIL-SERVICE] Sending email to: trusted@example.com
[EMAIL-SERVICE] ✅ Email sent successfully
[SOS-MANUAL] ✅ Manual SOS completed successfully
```

### Location Request
```
[LOCATION-REQUEST] ========== LOCATION REQUEST ==========
[LOCATION-REQUEST] ✅ Location request created: 456def
[LOCATION-REQUEST] Expires at: 2026-01-31T02:30:00.000Z
[EMAIL-SERVICE] ✅ Email sent successfully
```

### Auto SOS
```
[AUTO-SOS-JOB] ========== Checking for expired requests ==========
[AUTO-SOS-JOB] Found 1 expired request(s)
[AUTO-SOS-JOB] Processing expired request: 456def
[AUTO-SOS-JOB] ✅ Request marked as TIMEOUT
[AUTO-SOS-JOB] ✅ AUTO SOS email sent successfully
```

## Safety Features

1. **Authorization** - Only trustedContactEmail can request location
2. **No Public Exposure** - Location never exposed publicly
3. **Clear Logging** - Every step logged for debugging
4. **Error Handling** - Errors logged but don't crash system
5. **Status Tracking** - All requests tracked with timestamps
6. **30-Minute Window** - Automatic escalation if no response

## Troubleshooting

### Email not sending
1. Check console logs for `[EMAIL-SERVICE]` errors
2. Verify SMTP credentials in `.env`
3. Test email config: Server logs show SMTP validation on startup
4. Gmail: Ensure App Password is used (not regular password)

### Auto SOS not triggering
1. Check console logs every minute for `[AUTO-SOS-JOB]`
2. Verify LocationRequest exists with status=PENDING
3. Verify expiresAt is in the past
4. Background job runs every 60 seconds

### No logs appearing
1. Ensure server.js loads the routes and job correctly
2. Check that endpoints are being hit (use curl or Postman)
3. Verify MongoDB connection is working

## Future Enhancements

- [ ] Frontend UI components
- [ ] Real-time notifications (WebSockets)
- [ ] Multiple trusted contacts
- [ ] Location history tracking
- [ ] SMS integration
- [ ] Mobile app integration

## Files Created

```
backend/
├── models/
│   ├── Notification.js          (Phase 1)
│   ├── LocationRequest.js       (Phase 1)
│   └── User.js                  (Modified - added trustedContactEmail)
├── services/
│   └── emailService.js          (Phase 2)
├── controllers/
│   └── sosController.js         (Phase 3, 4, 5)
├── routes/
│   └── sosRoutes.js             (Routes)
├── jobs/
│   └── autoSOSJob.js            (Phase 6)
└── server.js                    (Modified - wired everything)
```

## License
Internal use only.
