# Emergency Contacts API Documentation

## Overview

API endpoints for managing multiple emergency contacts for users.

**Base URL:** `http://localhost:5000/api/emergency-contacts`

## Authentication

Currently no authentication required (add middleware as needed for production).

---

## Endpoints

### 1. Get Emergency Contacts

Get all emergency contacts for a user.

**Endpoint:** `GET /api/emergency-contacts/:userEmail`

**Parameters:**
- `userEmail` (URL param, required) - Email of the user

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency contacts retrieved successfully",
  "contacts": [
    "mom@example.com",
    "dad@example.com",
    "sister@example.com"
  ]
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found",
  "contacts": []
}
```

**Example:**
```bash
curl http://localhost:5000/api/emergency-contacts/john@example.com
```

---

### 2. Add Emergency Contact

Add a new emergency contact to a user's list.

**Endpoint:** `POST /api/emergency-contacts/add`

**Body:**
```json
{
  "userEmail": "john@example.com",
  "contactEmail": "newcontact@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency contact added successfully",
  "contacts": [
    "mom@example.com",
    "dad@example.com",
    "newcontact@example.com"
  ]
}
```

**Response (400 Bad Request) - Duplicate:**
```json
{
  "success": false,
  "message": "Contact already exists",
  "contacts": [
    "mom@example.com",
    "dad@example.com"
  ]
}
```

**Response (400 Bad Request) - Invalid Email:**
```json
{
  "success": false,
  "message": "Invalid email format",
  "contacts": [
    "mom@example.com"
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/emergency-contacts/add \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "john@example.com",
    "contactEmail": "newcontact@example.com"
  }'
```

---

### 3. Remove Emergency Contact

Remove an emergency contact from a user's list.

**Endpoint:** `POST /api/emergency-contacts/remove`

**Body:**
```json
{
  "userEmail": "john@example.com",
  "contactEmail": "oldcontact@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency contact removed successfully",
  "contacts": [
    "mom@example.com",
    "dad@example.com"
  ]
}
```

**Response (400 Bad Request) - Not Found:**
```json
{
  "success": false,
  "message": "Contact not found in emergency contacts list",
  "contacts": [
    "mom@example.com",
    "dad@example.com"
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/emergency-contacts/remove \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "john@example.com",
    "contactEmail": "oldcontact@example.com"
  }'
```

---

### 4. Set (Replace) Emergency Contacts

Replace all emergency contacts with a new list.

**Endpoint:** `POST /api/emergency-contacts/set`

**Body:**
```json
{
  "userEmail": "john@example.com",
  "contacts": [
    "contact1@example.com",
    "contact2@example.com",
    "contact3@example.com"
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency contacts updated successfully",
  "contacts": [
    "contact1@example.com",
    "contact2@example.com",
    "contact3@example.com"
  ]
}
```

**Response (400 Bad Request) - Invalid Email:**
```json
{
  "success": false,
  "message": "Invalid email format: notanemail, no@domain",
  "contacts": [
    "mom@example.com"
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/emergency-contacts/set \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "john@example.com",
    "contacts": [
      "contact1@example.com",
      "contact2@example.com"
    ]
  }'
```

---

## Features

### Email Validation

All emails are validated using regex pattern:
```regex
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

**Valid emails:**
- `user@domain.com`
- `user.name@sub.domain.com`
- `user+tag@domain.co.uk`

**Invalid emails:**
- `notanemail`
- `no@domain`
- `@domain.com`

### Duplicate Prevention

Duplicate emails are automatically prevented (case-insensitive):

```javascript
// Input
contacts: ["mom@example.com", "MOM@example.com"]

// Stored (after save)
contacts: ["mom@example.com"]  // Only one entry
```

### Case-Insensitive Operations

All email comparisons are case-insensitive:

```javascript
// These are treated as the same contact
"Mom@Example.com"
"mom@example.com"
"MOM@EXAMPLE.COM"
```

---

## Integration with SOS System

### Manual SOS

When user triggers manual SOS, all emergency contacts receive:
- Database notification
- Email alert

**Example Flow:**
```javascript
User: john@example.com
Emergency Contacts: [mom@example.com, dad@example.com, sister@example.com]

↓ User triggers SOS

→ mom@example.com receives notification + email
→ dad@example.com receives notification + email
→ sister@example.com receives notification + email
```

### Location Request

Only emergency contacts can request location:

```javascript
// ✅ Allowed
POST /api/location/request
{
  "userEmail": "john@example.com",
  "receiverEmail": "mom@example.com"  // In emergency contacts
}

// ❌ Rejected (403 Forbidden)
POST /api/location/request
{
  "userEmail": "john@example.com",
  "receiverEmail": "stranger@example.com"  // NOT in emergency contacts
}
```

### Auto SOS

When location request times out (30 minutes), all emergency contacts receive AUTO_SOS:

```javascript
User: john@example.com
Emergency Contacts: [mom@example.com, dad@example.com, sister@example.com]

↓ Location request from mom@example.com expires

→ mom@example.com receives AUTO_SOS (original requester)
→ dad@example.com receives AUTO_SOS (other contact)
→ sister@example.com receives AUTO_SOS (other contact)
```

---

## Error Handling

### Missing Fields (400)
```json
{
  "success": false,
  "message": "Missing required fields: userEmail, contactEmail"
}
```

### User Not Found (404)
```json
{
  "success": false,
  "message": "User not found",
  "contacts": []
}
```

### Invalid Email (400)
```json
{
  "success": false,
  "message": "Invalid email format",
  "contacts": ["existing@contacts.com"]
}
```

### Contact Already Exists (400)
```json
{
  "success": false,
  "message": "Contact already exists",
  "contacts": ["existing@contacts.com"]
}
```

### Contact Not Found (400)
```json
{
  "success": false,
  "message": "Contact not found in emergency contacts list",
  "contacts": ["existing@contacts.com"]
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to add emergency contact",
  "error": "Detailed error message"
}
```

---

## Testing Examples

### Test with cURL

**Get contacts:**
```bash
curl http://localhost:5000/api/emergency-contacts/john@example.com
```

**Add contact:**
```bash
curl -X POST http://localhost:5000/api/emergency-contacts/add \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"john@example.com","contactEmail":"mom@example.com"}'
```

**Remove contact:**
```bash
curl -X POST http://localhost:5000/api/emergency-contacts/remove \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"john@example.com","contactEmail":"old@example.com"}'
```

**Set contacts:**
```bash
curl -X POST http://localhost:5000/api/emergency-contacts/set \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail":"john@example.com",
    "contacts":["mom@example.com","dad@example.com"]
  }'
```

### Test with JavaScript/Fetch

```javascript
// Get contacts
const response = await fetch('http://localhost:5000/api/emergency-contacts/john@example.com');
const data = await response.json();
console.log(data.contacts);

// Add contact
await fetch('http://localhost:5000/api/emergency-contacts/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userEmail: 'john@example.com',
    contactEmail: 'newcontact@example.com'
  })
});

// Remove contact
await fetch('http://localhost:5000/api/emergency-contacts/remove', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userEmail: 'john@example.com',
    contactEmail: 'oldcontact@example.com'
  })
});

// Set contacts
await fetch('http://localhost:5000/api/emergency-contacts/set', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userEmail: 'john@example.com',
    contacts: ['contact1@example.com', 'contact2@example.com']
  })
});
```

---

## Best Practices

### 1. Minimum Contacts
Recommend users add at least 2-3 emergency contacts:
```javascript
if (contacts.length < 2) {
  console.warn('User has less than 2 emergency contacts');
}
```

### 2. Maximum Contacts
Consider limiting the number of contacts (e.g., max 10):
```javascript
if (contacts.length > 10) {
  return { success: false, message: 'Maximum 10 emergency contacts allowed' };
}
```

### 3. Validation on Frontend
Validate emails on frontend before sending to API:
```javascript
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### 4. Confirmation for Remove
Always confirm before removing contacts:
```javascript
if (confirm(`Remove ${contactEmail} from emergency contacts?`)) {
  await removeContact(contactEmail);
}
```

### 5. Test Notifications
Allow users to send test notifications:
```javascript
POST /api/emergency-contacts/test
{
  "userEmail": "john@example.com",
  "contactEmail": "mom@example.com"
}
// Sends a test email/notification
```

---

## Security Considerations

### 1. Add Authentication
Protect endpoints with authentication middleware:
```javascript
router.post('/add', authMiddleware, emergencyContactsController.addContact);
```

### 2. Verify User Ownership
Ensure authenticated user can only modify their own contacts:
```javascript
if (req.user.email !== userEmail) {
  return res.status(403).json({ message: 'Unauthorized' });
}
```

### 3. Rate Limiting
Prevent abuse with rate limiting:
```javascript
const rateLimit = require('express-rate-limit');

const contactsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // Limit each IP to 20 requests per window
});

router.post('/add', contactsLimiter, emergencyContactsController.addContact);
```

### 4. Input Sanitization
Sanitize email inputs to prevent injection attacks:
```javascript
const validator = require('validator');

const sanitizedEmail = validator.normalizeEmail(contactEmail);
```

---

## Monitoring & Logging

All operations are logged with `[EMERGENCY-CONTACTS]` prefix:

```
[EMERGENCY-CONTACTS] Adding contact: mom@example.com to user: john@example.com
[EMERGENCY-CONTACTS] ✅ Contact added successfully
[EMERGENCY-CONTACTS] Total contacts: 3
```

Monitor these logs for:
- Unusual activity (many adds/removes)
- Failed operations
- Invalid email attempts
- User patterns
