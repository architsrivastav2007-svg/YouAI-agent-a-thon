/**
 * Emergency Contacts Management Utility
 * 
 * Helper functions for managing emergency contacts in User model
 * Can be imported into controllers or used in admin scripts
 */

const User = require('../models/User');

/**
 * Add emergency contact to user
 * - Validates email format
 * - Prevents duplicates (case-insensitive)
 * - Returns updated contact list
 * 
 * @param {string} userEmail - Email of user to update
 * @param {string} contactEmail - Emergency contact email to add
 * @returns {Promise<Object>} Result with success status and updated contacts
 */
async function addEmergencyContact(userEmail, contactEmail) {
  console.log('[EMERGENCY-CONTACTS] Adding contact:', contactEmail, 'to user:', userEmail);

  try {
    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        contacts: []
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return {
        success: false,
        message: 'Invalid email format',
        contacts: user.emergencyContacts || []
      };
    }

    // Initialize array if doesn't exist
    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }

    // Check for duplicate (case-insensitive)
    const isDuplicate = user.emergencyContacts.some(
      email => email.toLowerCase() === contactEmail.toLowerCase()
    );

    if (isDuplicate) {
      return {
        success: false,
        message: 'Contact already exists',
        contacts: user.emergencyContacts
      };
    }

    // Add contact
    user.emergencyContacts.push(contactEmail.toLowerCase());
    await user.save();

    console.log('[EMERGENCY-CONTACTS] ✅ Contact added successfully');
    console.log('[EMERGENCY-CONTACTS] Total contacts:', user.emergencyContacts.length);

    return {
      success: true,
      message: 'Emergency contact added successfully',
      contacts: user.emergencyContacts
    };

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS] ❌ Error adding contact:', error);
    return {
      success: false,
      message: error.message,
      contacts: []
    };
  }
}

/**
 * Remove emergency contact from user
 * - Case-insensitive removal
 * - Returns updated contact list
 * 
 * @param {string} userEmail - Email of user to update
 * @param {string} contactEmail - Emergency contact email to remove
 * @returns {Promise<Object>} Result with success status and updated contacts
 */
async function removeEmergencyContact(userEmail, contactEmail) {
  console.log('[EMERGENCY-CONTACTS] Removing contact:', contactEmail, 'from user:', userEmail);

  try {
    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        contacts: []
      };
    }

    // Initialize array if doesn't exist
    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }

    // Remove contact (case-insensitive)
    const originalLength = user.emergencyContacts.length;
    user.emergencyContacts = user.emergencyContacts.filter(
      email => email.toLowerCase() !== contactEmail.toLowerCase()
    );

    // Check if contact was found
    if (user.emergencyContacts.length === originalLength) {
      return {
        success: false,
        message: 'Contact not found in emergency contacts list',
        contacts: user.emergencyContacts
      };
    }

    await user.save();

    console.log('[EMERGENCY-CONTACTS] ✅ Contact removed successfully');
    console.log('[EMERGENCY-CONTACTS] Remaining contacts:', user.emergencyContacts.length);

    return {
      success: true,
      message: 'Emergency contact removed successfully',
      contacts: user.emergencyContacts
    };

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS] ❌ Error removing contact:', error);
    return {
      success: false,
      message: error.message,
      contacts: []
    };
  }
}

/**
 * Get all emergency contacts for a user
 * 
 * @param {string} userEmail - Email of user
 * @returns {Promise<Object>} Result with contacts list
 */
async function getEmergencyContacts(userEmail) {
  console.log('[EMERGENCY-CONTACTS] Getting contacts for user:', userEmail);

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        contacts: []
      };
    }

    return {
      success: true,
      message: 'Emergency contacts retrieved successfully',
      contacts: user.emergencyContacts || []
    };

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS] ❌ Error getting contacts:', error);
    return {
      success: false,
      message: error.message,
      contacts: []
    };
  }
}

/**
 * Replace all emergency contacts for a user
 * - Validates all emails
 * - Removes duplicates automatically
 * 
 * @param {string} userEmail - Email of user to update
 * @param {string[]} contacts - Array of contact emails
 * @returns {Promise<Object>} Result with success status and updated contacts
 */
async function setEmergencyContacts(userEmail, contacts) {
  console.log('[EMERGENCY-CONTACTS] Setting contacts for user:', userEmail);
  console.log('[EMERGENCY-CONTACTS] New contacts:', contacts);

  try {
    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        contacts: []
      };
    }

    // Validate all emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = contacts.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return {
        success: false,
        message: `Invalid email format: ${invalidEmails.join(', ')}`,
        contacts: user.emergencyContacts || []
      };
    }

    // Set contacts (save will auto-deduplicate via pre-save hook)
    user.emergencyContacts = contacts.map(email => email.toLowerCase());
    await user.save();

    console.log('[EMERGENCY-CONTACTS] ✅ Contacts updated successfully');
    console.log('[EMERGENCY-CONTACTS] Total contacts:', user.emergencyContacts.length);

    return {
      success: true,
      message: 'Emergency contacts updated successfully',
      contacts: user.emergencyContacts
    };

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS] ❌ Error setting contacts:', error);
    return {
      success: false,
      message: error.message,
      contacts: []
    };
  }
}

/**
 * Check if an email is an emergency contact for a user
 * 
 * @param {string} userEmail - Email of user
 * @param {string} contactEmail - Email to check
 * @returns {Promise<Object>} Result with isContact boolean
 */
async function isEmergencyContact(userEmail, contactEmail) {
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        isContact: false
      };
    }

    const isContact = user.emergencyContacts && user.emergencyContacts.some(
      email => email.toLowerCase() === contactEmail.toLowerCase()
    );

    return {
      success: true,
      isContact,
      message: isContact 
        ? 'Email is an emergency contact' 
        : 'Email is not an emergency contact'
    };

  } catch (error) {
    console.error('[EMERGENCY-CONTACTS] ❌ Error checking contact:', error);
    return {
      success: false,
      message: error.message,
      isContact: false
    };
  }
}

module.exports = {
  addEmergencyContact,
  removeEmergencyContact,
  getEmergencyContacts,
  setEmergencyContacts,
  isEmergencyContact
};
