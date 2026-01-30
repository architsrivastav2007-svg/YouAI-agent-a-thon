/**
 * Emergency Contacts Routes
 * 
 * Endpoints for managing user emergency contacts
 */

const express = require('express');
const router = express.Router();
const emergencyContactsController = require('../controllers/emergencyContactsController');

// Get all emergency contacts for a user
router.get('/:userEmail', emergencyContactsController.getContacts);

// Add emergency contact
router.post('/add', emergencyContactsController.addContact);

// Remove emergency contact
router.post('/remove', emergencyContactsController.removeContact);

// Set (replace) all emergency contacts
router.post('/set', emergencyContactsController.setContacts);

module.exports = router;
