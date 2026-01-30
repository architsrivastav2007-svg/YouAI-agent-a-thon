/**
 * Emergency Contacts Controller
 * 
 * Handles CRUD operations for user emergency contacts
 */

const User = require('../models/User');
const {
  addEmergencyContact,
  removeEmergencyContact,
  getEmergencyContacts,
  setEmergencyContacts
} = require('../helper/emergencyContactsHelper');

/**
 * GET /api/emergency-contacts/:userEmail
 * 
 * Get all emergency contacts for a user
 */
exports.getContacts = async (req, res) => {
  console.log('[EMERGENCY-CONTACTS-API] ========== GET CONTACTS ==========');
  console.log('[EMERGENCY-CONTACTS-API] User:', req.params.userEmail);

  try {
    const result = await getEmergencyContacts(req.params.userEmail);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS-API] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve emergency contacts',
      error: error.message
    });
  }
};

/**
 * POST /api/emergency-contacts/add
 * 
 * Add a new emergency contact
 * Body: { userEmail, contactEmail }
 */
exports.addContact = async (req, res) => {
  console.log('[EMERGENCY-CONTACTS-API] ========== ADD CONTACT ==========');
  console.log('[EMERGENCY-CONTACTS-API] Body:', req.body);

  try {
    const { userEmail, contactEmail } = req.body;

    // Validation
    if (!userEmail || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userEmail, contactEmail'
      });
    }

    const result = await addEmergencyContact(userEmail, contactEmail);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS-API] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact',
      error: error.message
    });
  }
};

/**
 * POST /api/emergency-contacts/remove
 * 
 * Remove an emergency contact
 * Body: { userEmail, contactEmail }
 */
exports.removeContact = async (req, res) => {
  console.log('[EMERGENCY-CONTACTS-API] ========== REMOVE CONTACT ==========');
  console.log('[EMERGENCY-CONTACTS-API] Body:', req.body);

  try {
    const { userEmail, contactEmail } = req.body;

    // Validation
    if (!userEmail || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userEmail, contactEmail'
      });
    }

    const result = await removeEmergencyContact(userEmail, contactEmail);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS-API] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove emergency contact',
      error: error.message
    });
  }
};

/**
 * POST /api/emergency-contacts/set
 * 
 * Replace all emergency contacts
 * Body: { userEmail, contacts: [] }
 */
exports.setContacts = async (req, res) => {
  console.log('[EMERGENCY-CONTACTS-API] ========== SET CONTACTS ==========');
  console.log('[EMERGENCY-CONTACTS-API] Body:', req.body);

  try {
    const { userEmail, contacts } = req.body;

    // Validation
    if (!userEmail || !contacts) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userEmail, contacts'
      });
    }

    if (!Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        message: 'contacts must be an array'
      });
    }

    const result = await setEmergencyContacts(userEmail, contacts);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS-API] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set emergency contacts',
      error: error.message
    });
  }
};
