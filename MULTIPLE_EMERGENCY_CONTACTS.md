# Multiple Emergency Contacts - Migration Guide

## Overview

The SOS system has been upgraded to support **multiple emergency contacts** instead of a single trusted contact. This provides better safety coverage by alerting multiple people during emergencies.

## What Changed

### Before (Single Contact)
```javascript
{
  trustedContactEmail: "contact@example.com"  // Single string
}
```

### After (Multiple Contacts)
```javascript
{
  emergencyContacts: [                        // Array of strings
    "contact1@example.com",
    "contact2@example.com",
    "contact3@example.com"
  ]
}
```

## Changes by File

### 1. User Model (`backend/models/User.js`)

**Schema Changes:**
- ❌ Removed: `trustedContactEmail` (String)
- ✅ Added: `emergencyContacts` (Array of Strings)

**Features:**
- **Email Validation**: Validates all emails match format `user@domain.com`
- **Duplicate Prevention**: Pre-save hook automatically removes duplicate emails (case-insensitive)
- **Default Value**: Empty array `[]`

**Example:**
```javascript
// Valid
emergencyContacts: [
  "mom@example.com",
  "dad@example.com",
  "sister@example.com"
]

// Invalid - will fail validation
emergencyContacts: [
  "notanemail",        // ❌ Invalid format
  "no@domain"          // ❌ Missing TLD
]

// Duplicates automatically removed
emergencyContacts: [
  "mom@example.com",
  "MOM@example.com"    // ✅ Will be deduplicated to one entry
]
```

### 2. SOS Controller (`backend/controllers/sosController.js`)

#### **triggerManualSOS** - Manual SOS Button

**Changes:**
- Sends SOS to **ALL** emergency contacts (was single contact)
- Loops through `emergencyContacts` array
- Creates notification + sends email for each contact
- Tracks success/failure per contact
- Returns detailed results showing successful and failed contacts

**Response Codes:**
- `200` - All contacts notified successfully
- `207` - Partial success (some failed)
- `500` - All contacts failed

**Response Example:**
```json
{
  "success": true,
  "message": "SOS alert sent to all emergency contacts",
  "data": {
    "totalContacts": 3,
    "successful": 3,
    "failed": 0,
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "details": {
      "successful": [
        {
          "email": "mom@example.com",
          "notificationId": "64f5a1b2c3d4e5f6g7h8i9j0"
        },
        {
          "email": "dad@example.com",
          "notificationId": "64f5a1b2c3d4e5f6g7h8i9j1"
        },
        {
          "email": "sister@example.com",
          "notificationId": "64f5a1b2c3d4e5f6g7h8i9j2"
        }
      ],
      "failed": []
    }
  }
}
```

**Logging:**
```
[SOS-MANUAL] ========================================
[SOS-MANUAL] Processing contact: mom@example.com
[SOS-MANUAL] ✅ Notification created for mom@example.com - ID: 64f...
[SOS-MANUAL] ✅ SOS email sent successfully to: mom@example.com
[SOS-MANUAL] ========================================
[SOS-MANUAL] Processing contact: dad@example.com
...
[SOS-MANUAL] ========================================
[SOS-MANUAL] ✅ Manual SOS processing complete
[SOS-MANUAL] Successful: 3
[SOS-MANUAL] Failed: 0
```

#### **requestLocation** - Location Request

**Changes:**
- Validates receiver is in `emergencyContacts` array (was exact match check)
- Uses case-insensitive comparison
- Better error messages
- Email warns about AUTO_SOS to all contacts

**Security:**
- Only users in `emergencyContacts` array can request location
- Returns `403 Forbidden` if requester is not an emergency contact

**Example Check:**
```javascript
const isEmergencyContact = user.emergencyContacts.some(
  contact => contact.toLowerCase() === receiverEmail.toLowerCase()
);

if (!isEmergencyContact) {
  return res.status(403).json({
    message: 'Only emergency contacts can request location'
  });
}
```

#### **acceptLocationRequest** - Accept Location

**Changes:**
- Verifies receiver is **still** in `emergencyContacts` array before sharing location
- Prevents sharing location if contact was removed
- Automatically denies request if requester is no longer authorized

**Security Flow:**
```javascript
// 1. Find location request
const locationRequest = await LocationRequest.findById(requestId);

// 2. Get current user data
const user = await User.findOne({ email: locationRequest.userEmail });

// 3. Verify receiver is STILL an emergency contact
const isStillEmergencyContact = user.emergencyContacts.some(
  contact => contact.toLowerCase() === locationRequest.receiverEmail.toLowerCase()
);

// 4. If not, deny the request
if (!isStillEmergencyContact) {
  locationRequest.status = 'DENIED';
  await locationRequest.save();
  return res.status(403);
}
```

This prevents the scenario:
1. Alice adds Bob as emergency contact
2. Bob requests location
3. Alice removes Bob from emergency contacts
4. Alice accepts the request ❌ (blocked - Bob is no longer authorized)

#### **denyLocationRequest** - Deny Location

**Changes:**
- Verifies receiver status (for logging)
- No security change (user can always deny)

### 3. Auto SOS Job (`backend/jobs/autoSOSJob.js`)

**Changes:**
- Sends AUTO_SOS to **ALL** emergency contacts (was single receiver)
- Fetches user's `emergencyContacts` array
- Loops through all contacts to send notification + email
- Tracks success/failure per contact
- Continues processing if one contact fails

**Email Changes:**
- Includes original requester information
- Shows note if recipient is not the original requester

**Example Email:**
```
🚨 AUTOMATIC SOS ALERT 🚨

john@example.com did not respond to a location request within 30 minutes.

This automatic SOS was triggered because:
- alice@example.com requested their location at 2:00 PM
- The request expired at 2:30 PM
- No response was received within 30 minutes

Action Required:
As an emergency contact for john@example.com, please attempt to reach them...

Note: You are receiving this as one of john@example.com's emergency contacts.
The original location request was made by alice@example.com.
```

**Logging:**
```
[AUTO-SOS-JOB] Sending AUTO_SOS to 3 emergency contact(s)
[AUTO-SOS-JOB] ----------------------------------------
[AUTO-SOS-JOB] Processing contact: mom@example.com
[AUTO-SOS-JOB] ✅ AUTO_SOS notification created for mom@example.com
[AUTO-SOS-JOB] ✅ AUTO SOS email sent successfully to: mom@example.com
[AUTO-SOS-JOB] ----------------------------------------
[AUTO-SOS-JOB] ✅ Auto SOS completed for request: 64f...
[AUTO-SOS-JOB] Successful: 3 / 3
[AUTO-SOS-JOB] Failed: 0
```

## Migration Steps

### For Existing Users

**Option 1: Manual Migration Script**
```javascript
// backend/migrations/migrateToMultipleContacts.js
const User = require('./models/User');

async function migrate() {
  const users = await User.find({ trustedContactEmail: { $exists: true } });
  
  for (const user of users) {
    if (user.trustedContactEmail) {
      // Move single contact to array
      user.emergencyContacts = [user.trustedContactEmail];
      user.trustedContactEmail = undefined; // Remove old field
      await user.save();
      console.log(`✅ Migrated user: ${user.email}`);
    }
  }
  
  console.log(`Migration complete: ${users.length} users`);
}

migrate();
```

**Option 2: MongoDB Shell**
```javascript
// Run in MongoDB shell
db.users.find({ trustedContactEmail: { $exists: true } }).forEach(user => {
  db.users.updateOne(
    { _id: user._id },
    {
      $set: { emergencyContacts: [user.trustedContactEmail] },
      $unset: { trustedContactEmail: "" }
    }
  );
});
```

### For New Users

Simply add emergency contacts to the array:
```javascript
const user = await User.create({
  email: "john@example.com",
  emergencyContacts: [
    "mom@example.com",
    "dad@example.com",
    "sister@example.com"
  ]
});
```

## API Usage Examples

### Add Emergency Contact

```javascript
// Add to existing array
const user = await User.findOne({ email: "john@example.com" });
user.emergencyContacts.push("newcontact@example.com");
await user.save(); // Auto-deduplication happens here
```

### Remove Emergency Contact

```javascript
const user = await User.findOne({ email: "john@example.com" });
user.emergencyContacts = user.emergencyContacts.filter(
  email => email !== "oldcontact@example.com"
);
await user.save();
```

### Update All Contacts

```javascript
const user = await User.findOne({ email: "john@example.com" });
user.emergencyContacts = [
  "contact1@example.com",
  "contact2@example.com"
];
await user.save();
```

## Safety Features

### 1. Email Validation
```javascript
// Valid emails
"user@domain.com"           ✅
"user.name@sub.domain.com"  ✅
"user+tag@domain.co.uk"     ✅

// Invalid emails
"notanemail"                ❌ Validation error
"no@domain"                 ❌ Validation error
"@domain.com"               ❌ Validation error
```

### 2. Duplicate Prevention
```javascript
// Input
emergencyContacts: [
  "mom@example.com",
  "MOM@example.com",
  "mom@EXAMPLE.com"
]

// After save (automatic)
emergencyContacts: [
  "mom@example.com"  // Only one entry
]
```

### 3. Authorization Checks

**Location Request:**
```javascript
// ❌ FAILS if requester not in emergencyContacts
POST /api/location/request
{
  "userEmail": "john@example.com",
  "receiverEmail": "stranger@example.com"  // Not in John's emergencyContacts
}

// Response: 403 Forbidden
```

**Accept Location:**
```javascript
// ❌ FAILS if requester was removed from emergencyContacts
// Scenario:
// 1. Alice adds Bob to emergencyContacts
// 2. Bob requests location (creates pending request)
// 3. Alice removes Bob from emergencyContacts
// 4. Alice tries to accept request

// Response: 403 Forbidden
// Message: "Cannot share location. Requester is no longer listed as an emergency contact."
```

### 4. Partial Success Handling

If some contacts fail to receive notifications:
```javascript
// Response: 207 Multi-Status
{
  "success": true,
  "message": "SOS sent to some emergency contacts, but some failed",
  "data": {
    "totalContacts": 3,
    "successful": 2,
    "failed": 1,
    "details": {
      "successful": [
        { "email": "mom@example.com", "notificationId": "..." },
        { "email": "dad@example.com", "notificationId": "..." }
      ],
      "failed": [
        { "email": "invalid@domain.com", "error": "Invalid email" }
      ]
    }
  }
}
```

## Testing

### Test Multiple Contacts

```javascript
// 1. Create test user with multiple contacts
const user = await User.create({
  email: "test@example.com",
  emergencyContacts: [
    "contact1@test.com",
    "contact2@test.com",
    "contact3@test.com"
  ]
});

// 2. Trigger manual SOS
const response = await fetch('http://localhost:5000/api/sos/manual', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userEmail: "test@example.com",
    latitude: 37.7749,
    longitude: -122.4194
  })
});

// 3. Check all contacts received notifications
const notifications = await Notification.find({
  type: 'SOS',
  toEmail: { $in: user.emergencyContacts }
});

console.log(`Notifications sent: ${notifications.length} / ${user.emergencyContacts.length}`);
```

### Test Authorization

```javascript
// 1. Try to request location from non-emergency contact
const response = await fetch('http://localhost:5000/api/location/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userEmail: "test@example.com",
    receiverEmail: "stranger@example.com"  // Not in emergencyContacts
  })
});

// Expected: 403 Forbidden
console.log(response.status); // 403
```

### Test Auto SOS to All Contacts

```javascript
// 1. Create expired location request
const request = await LocationRequest.create({
  userEmail: "test@example.com",
  receiverEmail: "contact1@test.com",
  status: 'PENDING',
  expiresAt: new Date(Date.now() - 1000) // Already expired
});

// 2. Manually trigger auto SOS job
const { checkExpiredRequests } = require('./jobs/autoSOSJob');
await checkExpiredRequests();

// 3. Verify all contacts received AUTO_SOS
const autoSOSNotifications = await Notification.find({
  type: 'AUTO_SOS',
  data: { userEmail: "test@example.com" }
});

console.log(`AUTO_SOS sent to: ${autoSOSNotifications.length} contacts`);
```

## Best Practices

### 1. Minimum Contacts
Recommend users add at least 2-3 emergency contacts for redundancy.

### 2. Contact Diversity
Suggest different types of contacts:
- Family member
- Close friend
- Neighbor
- Coworker

### 3. Keep Contacts Updated
Remind users to review and update emergency contacts periodically.

### 4. Test Notifications
Allow users to send test notifications to verify contacts are reachable.

## Troubleshooting

### No contacts configured
```
Error: "No emergency contacts configured for this user"
Solution: Add at least one email to emergencyContacts array
```

### Some emails invalid
```
Error: "All emergency contacts must be valid email addresses"
Solution: Fix invalid email formats before saving
```

### Duplicate emails
```
No error - automatically handled
Result: Duplicates removed on save (case-insensitive)
```

### Contact not receiving notifications
```
Check:
1. Email is in emergencyContacts array
2. Email service is configured (SMTP)
3. Check spam folder
4. Verify email address is correct
5. Check backend logs for send failures
```

## Summary

**Benefits of Multiple Contacts:**
- ✅ Better safety coverage - more people notified
- ✅ Redundancy if one contact is unavailable
- ✅ Partial success handling - continues if some fail
- ✅ Detailed logging per contact
- ✅ Authorization checks prevent unauthorized access

**Key Security Features:**
- Email validation prevents invalid addresses
- Automatic deduplication prevents spam
- Authorization checks at every endpoint
- Re-verification before sharing location
- Detailed success/failure tracking

**Migration Path:**
- Backward compatible (empty array by default)
- Easy migration from single contact
- No breaking changes to API structure
