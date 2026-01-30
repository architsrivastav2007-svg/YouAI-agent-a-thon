# Multiple Emergency Contacts - Code Summary

## Quick Reference: What Changed

### User Model Schema
```javascript
// BEFORE
trustedContactEmail: { type: String }

// AFTER  
emergencyContacts: {
  type: [String],
  default: [],
  validate: {
    validator: function(contacts) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return contacts.every(email => emailRegex.test(email));
    },
    message: 'All emergency contacts must be valid email addresses'
  }
}

// Pre-save hook for deduplication
userSchema.pre('save', function(next) {
  if (this.emergencyContacts && this.emergencyContacts.length > 0) {
    const uniqueContacts = [...new Set(
      this.emergencyContacts.map(email => email.toLowerCase())
    )];
    this.emergencyContacts = uniqueContacts;
  }
  next();
});
```

### Manual SOS - Send to ALL Contacts
```javascript
// BEFORE - Single contact
if (!user.trustedContactEmail) {
  return res.status(400).json({ message: 'No trusted contact' });
}
await sendEmail(user.trustedContactEmail, subject, body);

// AFTER - All contacts with tracking
if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
  return res.status(400).json({ message: 'No emergency contacts' });
}

const results = { successful: [], failed: [] };

for (const contactEmail of user.emergencyContacts) {
  try {
    await Notification.create({ toEmail: contactEmail, type: 'SOS', ... });
    await sendEmail(contactEmail, emailSubject, emailBody);
    results.successful.push({ email: contactEmail, notificationId });
  } catch (error) {
    results.failed.push({ email: contactEmail, error: error.message });
  }
}

// Return detailed results
res.status(results.failed.length > 0 && results.successful.length > 0 ? 207 : 200).json({
  success: true,
  data: {
    totalContacts: user.emergencyContacts.length,
    successful: results.successful.length,
    failed: results.failed.length,
    details: results
  }
});
```

### Location Request - Verify in Array
```javascript
// BEFORE - Exact match
if (user.trustedContactEmail !== receiverEmail) {
  return res.status(403).json({ message: 'Not the trusted contact' });
}

// AFTER - Check array membership (case-insensitive)
if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
  return res.status(400).json({ message: 'No emergency contacts configured' });
}

const isEmergencyContact = user.emergencyContacts.some(
  contact => contact.toLowerCase() === receiverEmail.toLowerCase()
);

if (!isEmergencyContact) {
  return res.status(403).json({ 
    message: 'Only emergency contacts can request location' 
  });
}
```

### Accept Location - Re-verify Authorization
```javascript
// NEW - Verify receiver is STILL an emergency contact
const user = await User.findOne({ email: locationRequest.userEmail });

const isStillEmergencyContact = user.emergencyContacts && user.emergencyContacts.some(
  contact => contact.toLowerCase() === locationRequest.receiverEmail.toLowerCase()
);

if (!isStillEmergencyContact) {
  // Requester was removed from emergency contacts
  locationRequest.status = 'DENIED';
  await locationRequest.save();
  
  return res.status(403).json({
    message: 'Cannot share location. Requester is no longer an emergency contact.'
  });
}
```

### Auto SOS - Send to ALL Contacts
```javascript
// BEFORE - Single receiver
await sendEmail(request.receiverEmail, emailSubject, emailBody);

// AFTER - All emergency contacts
const user = await User.findOne({ email: request.userEmail });

if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
  console.error('User has no emergency contacts');
  continue;
}

const results = { successful: [], failed: [] };

for (const contactEmail of user.emergencyContacts) {
  try {
    await Notification.create({ 
      toEmail: contactEmail, 
      type: 'AUTO_SOS',
      data: {
        userEmail: request.userEmail,
        originalRequester: request.receiverEmail  // Track who made the request
      }
    });
    await sendEmail(contactEmail, emailSubject, emailBody);
    results.successful.push(contactEmail);
  } catch (error) {
    results.failed.push({ email: contactEmail, error: error.message });
  }
}

console.log(`Successful: ${results.successful.length} / ${user.emergencyContacts.length}`);
```

## API Response Changes

### Manual SOS Response
```javascript
// BEFORE
{
  "success": true,
  "message": "SOS alert sent to trusted contact",
  "data": {
    "notificationId": "64f...",
    "sentTo": "contact@example.com",
    "location": { "latitude": 37.7749, "longitude": -122.4194 }
  }
}

// AFTER
{
  "success": true,
  "message": "SOS alert sent to all emergency contacts",
  "data": {
    "totalContacts": 3,
    "successful": 3,
    "failed": 0,
    "location": { "latitude": 37.7749, "longitude": -122.4194 },
    "details": {
      "successful": [
        { "email": "contact1@example.com", "notificationId": "64f..." },
        { "email": "contact2@example.com", "notificationId": "64f..." },
        { "email": "contact3@example.com", "notificationId": "64f..." }
      ],
      "failed": []
    }
  }
}
```

### Partial Success (HTTP 207)
```javascript
{
  "success": true,
  "message": "SOS sent to some emergency contacts, but some failed",
  "data": {
    "totalContacts": 3,
    "successful": 2,
    "failed": 1,
    "details": {
      "successful": [
        { "email": "contact1@example.com", "notificationId": "64f..." },
        { "email": "contact2@example.com", "notificationId": "64f..." }
      ],
      "failed": [
        { "email": "badcontact@example.com", "error": "SMTP error" }
      ]
    }
  }
}
```

## Error Messages

### User Validation Errors
```javascript
// No contacts configured
{
  "success": false,
  "message": "No emergency contacts configured for this user. Please add at least one emergency contact."
}

// Invalid email format
{
  "errors": {
    "emergencyContacts": {
      "message": "All emergency contacts must be valid email addresses"
    }
  }
}
```

### Authorization Errors
```javascript
// Requester not in emergency contacts
{
  "success": false,
  "message": "Only emergency contacts can request location. You are not listed as an emergency contact for this user."
}

// Requester removed from emergency contacts
{
  "success": false,
  "message": "Cannot share location. Requester is no longer listed as an emergency contact."
}
```

## Logging Format

### Manual SOS Logs
```
[SOS-MANUAL] ========== MANUAL SOS TRIGGERED ==========
[SOS-MANUAL] Emergency contacts count: 3
[SOS-MANUAL] Emergency contacts: ['mom@...', 'dad@...', 'sister@...']
[SOS-MANUAL] ========================================
[SOS-MANUAL] Processing contact: mom@example.com
[SOS-MANUAL] ✅ Notification created for mom@example.com - ID: 64f...
[SOS-MANUAL] ✅ SOS email sent successfully to: mom@example.com
[SOS-MANUAL] ========================================
[SOS-MANUAL] ✅ Manual SOS processing complete
[SOS-MANUAL] Successful: 3
[SOS-MANUAL] Failed: 0
```

### Auto SOS Logs
```
[AUTO-SOS-JOB] Sending AUTO_SOS to 3 emergency contact(s)
[AUTO-SOS-JOB] Emergency contacts: ['mom@...', 'dad@...', 'sister@...']
[AUTO-SOS-JOB] ----------------------------------------
[AUTO-SOS-JOB] Processing contact: mom@example.com
[AUTO-SOS-JOB] ✅ AUTO_SOS notification created for mom@example.com
[AUTO-SOS-JOB] ✅ AUTO SOS email sent successfully to: mom@example.com
[AUTO-SOS-JOB] ----------------------------------------
[AUTO-SOS-JOB] ✅ Auto SOS completed for request: 64f...
[AUTO-SOS-JOB] Successful: 3 / 3
[AUTO-SOS-JOB] Failed: 0
```

## Files Modified

1. **backend/models/User.js**
   - Replace `trustedContactEmail` with `emergencyContacts` array
   - Add email validation
   - Add pre-save hook for deduplication

2. **backend/controllers/sosController.js**
   - `triggerManualSOS`: Loop through all contacts, track results
   - `requestLocation`: Verify receiver in emergencyContacts array
   - `acceptLocationRequest`: Re-verify authorization before sharing
   - `denyLocationRequest`: Log authorization status

3. **backend/jobs/autoSOSJob.js**
   - Fetch user's emergencyContacts array
   - Loop through all contacts to send AUTO_SOS
   - Track success/failure per contact

## Migration Script

```javascript
// backend/migrations/migrateToMultipleContacts.js
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrateToMultipleContacts() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const users = await User.find({ 
    trustedContactEmail: { $exists: true, $ne: null } 
  });
  
  console.log(`Found ${users.length} users to migrate`);
  
  for (const user of users) {
    user.emergencyContacts = [user.trustedContactEmail];
    user.trustedContactEmail = undefined;
    await user.save();
    console.log(`✅ Migrated: ${user.email} -> [${user.emergencyContacts[0]}]`);
  }
  
  console.log('Migration complete');
  process.exit(0);
}

migrateToMultipleContacts();
```

## Testing Checklist

- [ ] User with multiple contacts receives SOS to all
- [ ] User with no contacts gets proper error message
- [ ] Invalid email addresses fail validation
- [ ] Duplicate emails auto-removed (case-insensitive)
- [ ] Only emergency contacts can request location
- [ ] Non-emergency contact gets 403 error
- [ ] Removed contact cannot receive location share
- [ ] Auto SOS sends to all emergency contacts
- [ ] Partial success returns HTTP 207
- [ ] All failures return HTTP 500
- [ ] Detailed logging shows per-contact results
