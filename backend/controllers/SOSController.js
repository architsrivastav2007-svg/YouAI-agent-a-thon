/**
 * PHASE 3, 4, 5 - SOS Controller
 * 
 * Handles:
 * - Manual SOS button
 * - Location requests
 * - Accept/Deny responses
 */

const User = require('../models/User');
const Notification = require('../models/Notification');
const LocationRequest = require('../models/LocationRequest');
const { sendEmail } = require('../services/emailService');

/**
 * PHASE 3 - Manual SOS (Updated for Multiple Emergency Contacts)
 * POST /api/sos/manual
 * 
 * User triggers emergency SOS button
 * Sends immediate notification to ALL emergency contacts
 * Logs success/failure per contact
 */
exports.triggerManualSOS = async (req, res) => {
  console.log('[SOS-MANUAL] ========== MANUAL SOS TRIGGERED ==========');
  console.log('[SOS-MANUAL] Request body:', req.body);

  try {
    const { userEmail, latitude, longitude } = req.body;

    // Validation
    if (!userEmail || !latitude || !longitude) {
      console.log('[SOS-MANUAL] ❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userEmail, latitude, longitude'
      });
    }

    // Find user and their emergency contacts
    console.log('[SOS-MANUAL] Finding user:', userEmail);
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log('[SOS-MANUAL] ❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has emergency contacts
    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      console.log('[SOS-MANUAL] ❌ No emergency contacts configured');
      return res.status(400).json({
        success: false,
        message: 'No emergency contacts configured for this user. Please add at least one emergency contact.'
      });
    }

    console.log('[SOS-MANUAL] Emergency contacts count:', user.emergencyContacts.length);
    console.log('[SOS-MANUAL] Emergency contacts:', user.emergencyContacts);
    console.log('[SOS-MANUAL] Location:', { latitude, longitude });

    // Track results per contact
    const results = {
      successful: [],
      failed: []
    };

    // Send SOS to ALL emergency contacts
    for (const contactEmail of user.emergencyContacts) {
      console.log('[SOS-MANUAL] ========================================');
      console.log('[SOS-MANUAL] Processing contact:', contactEmail);

      try {
        // Create notification in database
        const notification = await Notification.create({
          toEmail: contactEmail,
          type: 'SOS',
          message: `🚨 EMERGENCY SOS from ${userEmail}`,
          data: {
            latitude,
            longitude,
            userEmail,
            timestamp: new Date()
          }
        });

        console.log('[SOS-MANUAL] ✅ Notification created for', contactEmail, '- ID:', notification._id);

        // Send email to this emergency contact
        const emailSubject = '🚨 EMERGENCY SOS ALERT';
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff3cd; padding: 20px; border: 3px solid #dc3545;">
            <h1 style="color: #dc3545; text-align: center;">🚨 EMERGENCY SOS ALERT 🚨</h1>
            
            <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h2>Emergency Contact Request</h2>
              <p><strong>${userEmail}</strong> has triggered an emergency SOS alert and needs immediate assistance.</p>
              
              <h3>Location Details:</h3>
              <ul>
                <li><strong>Latitude:</strong> ${latitude}</li>
                <li><strong>Longitude:</strong> ${longitude}</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              
              <p style="margin-top: 20px;">
                <a href="https://www.google.com/maps?q=${latitude},${longitude}" 
                   style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  📍 View Location on Google Maps
                </a>
              </p>
            </div>
            
            <p style="color: #856404; font-size: 14px; text-align: center;">
              This is an automated emergency alert. Please take immediate action.
            </p>
          </div>
        `;

        console.log('[SOS-MANUAL] Sending email to:', contactEmail);
        await sendEmail(contactEmail, emailSubject, emailBody);

        console.log('[SOS-MANUAL] ✅ SOS email sent successfully to:', contactEmail);
        results.successful.push({
          email: contactEmail,
          notificationId: notification._id
        });

      } catch (error) {
        console.error('[SOS-MANUAL] ❌ Failed to send SOS to:', contactEmail);
        console.error('[SOS-MANUAL] Error:', error.message);
        results.failed.push({
          email: contactEmail,
          error: error.message
        });
        // Continue processing other contacts
      }
    }

    console.log('[SOS-MANUAL] ========================================');
    console.log('[SOS-MANUAL] ✅ Manual SOS processing complete');
    console.log('[SOS-MANUAL] Successful:', results.successful.length);
    console.log('[SOS-MANUAL] Failed:', results.failed.length);

    // Determine response status
    const allFailed = results.successful.length === 0;
    const partialSuccess = results.failed.length > 0 && results.successful.length > 0;

    if (allFailed) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send SOS to any emergency contacts',
        results
      });
    }

    res.status(partialSuccess ? 207 : 200).json({
      success: true,
      message: partialSuccess 
        ? 'SOS sent to some emergency contacts, but some failed'
        : 'SOS alert sent to all emergency contacts',
      data: {
        totalContacts: user.emergencyContacts.length,
        successful: results.successful.length,
        failed: results.failed.length,
        location: { latitude, longitude },
        details: results
      }
    });

  } catch (error) {
    console.error('[SOS-MANUAL] ❌ Fatal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SOS alert',
      error: error.message
    });
  }
};

/**
 * PHASE 4 - Request Location (Updated for Multiple Emergency Contacts)
 * POST /api/location/request
 * 
 * Emergency contact requests user's current location
 * Validates that receiver is in user's emergencyContacts array
 * Creates 30-minute expiry timer
 */
exports.requestLocation = async (req, res) => {
  console.log('[LOCATION-REQUEST] ========== LOCATION REQUEST ==========');
  console.log('[LOCATION-REQUEST] Request body:', req.body);

  try {
    const { userEmail, receiverEmail } = req.body;

    // Validation
    if (!userEmail || !receiverEmail) {
      console.log('[LOCATION-REQUEST] ❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userEmail, receiverEmail'
      });
    }

    // Verify receiver is in the emergency contacts list
    console.log('[LOCATION-REQUEST] Verifying receiver is an emergency contact');
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log('[LOCATION-REQUEST] ❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if emergencyContacts exists and has contacts
    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      console.log('[LOCATION-REQUEST] ❌ No emergency contacts configured');
      return res.status(400).json({
        success: false,
        message: 'User has no emergency contacts configured'
      });
    }

    // Verify receiver is in the emergency contacts array (case-insensitive)
    const isEmergencyContact = user.emergencyContacts.some(
      contact => contact.toLowerCase() === receiverEmail.toLowerCase()
    );

    if (!isEmergencyContact) {
      console.log('[LOCATION-REQUEST] ❌ Unauthorized: Not an emergency contact');
      console.log('[LOCATION-REQUEST] Receiver:', receiverEmail);
      console.log('[LOCATION-REQUEST] Emergency contacts:', user.emergencyContacts);
      return res.status(403).json({
        success: false,
        message: 'Only emergency contacts can request location. You are not listed as an emergency contact for this user.'
      });
    }

    console.log('[LOCATION-REQUEST] ✅ Receiver verified as emergency contact');

    // Check for existing pending request
    const existingRequest = await LocationRequest.findOne({
      userEmail,
      status: 'PENDING'
    });

    if (existingRequest) {
      console.log('[LOCATION-REQUEST] ⚠️ Pending request already exists');
      return res.status(400).json({
        success: false,
        message: 'Location request already pending',
        data: {
          requestId: existingRequest._id,
          expiresAt: existingRequest.expiresAt
        }
      });
    }

    // Create location request with 30-minute expiry
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    const locationRequest = await LocationRequest.create({
      userEmail,
      receiverEmail,
      status: 'PENDING',
      createdAt: new Date(),
      expiresAt
    });

    console.log('[LOCATION-REQUEST] ✅ Location request created:', locationRequest._id);
    console.log('[LOCATION-REQUEST] Expires at:', expiresAt);

    // Create notification in database
    const notification = await Notification.create({
      toEmail: userEmail,
      type: 'LOCATION_REQUEST',
      message: `${receiverEmail} is requesting your current location`,
      data: {
        requestId: locationRequest._id,
        receiverEmail,
        expiresAt
      }
    });

    console.log('[LOCATION-REQUEST] ✅ Notification created:', notification._id);

    // Send email to user
    const emailSubject = '📍 Location Request from Emergency Contact';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #e7f3ff; padding: 20px; border: 2px solid #0056b3;">
        <h1 style="color: #0056b3; text-align: center;">📍 Location Request</h1>
        
        <div style="background-color: white; padding: 20px; margin: 20px 0;">
          <p><strong>${receiverEmail}</strong> (one of your emergency contacts) is requesting your current location.</p>
          
          <div style="background-color: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0;">⚠️ Important</h3>
            <p>You have <strong>30 minutes</strong> to respond to this request.</p>
            <p>If you don't respond within 30 minutes, an <strong>automatic SOS</strong> will be triggered and sent to ALL your emergency contacts.</p>
          </div>
          
          <p><strong>Expires at:</strong> ${expiresAt.toLocaleString()}</p>
          
          <p style="margin-top: 20px;">Please log in to your account to accept or deny this request.</p>
        </div>
        
        <p style="color: #004085; font-size: 14px; text-align: center;">
          This is an automated notification from one of your emergency contacts.
        </p>
      </div>
    `;

    console.log('[LOCATION-REQUEST] Sending email to user:', userEmail);
    await sendEmail(userEmail, emailSubject, emailBody);

    console.log('[LOCATION-REQUEST] ✅ Location request completed successfully');

    res.status(200).json({
      success: true,
      message: 'Location request sent to user',
      data: {
        requestId: locationRequest._id,
        userEmail,
        expiresAt,
        notificationId: notification._id
      }
    });

  } catch (error) {
    console.error('[LOCATION-REQUEST] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send location request',
      error: error.message
    });
  }
};

/**
 * PHASE 5 - Accept Location Request (Updated for Multiple Emergency Contacts)
 * POST /api/location/accept
 * 
 * User accepts location request and shares location
 * Verifies requester is still in emergencyContacts before sharing
 */
exports.acceptLocationRequest = async (req, res) => {
  console.log('[LOCATION-ACCEPT] ========== ACCEPT LOCATION REQUEST ==========');
  console.log('[LOCATION-ACCEPT] Request body:', req.body);

  try {
    const { requestId, latitude, longitude, accuracy } = req.body;

    // Validation
    if (!requestId || !latitude || !longitude) {
      console.log('[LOCATION-ACCEPT] ❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: requestId, latitude, longitude'
      });
    }

    // Find and update location request
    console.log('[LOCATION-ACCEPT] Finding request:', requestId);
    const locationRequest = await LocationRequest.findById(requestId);

    if (!locationRequest) {
      console.log('[LOCATION-ACCEPT] ❌ Request not found');
      return res.status(404).json({
        success: false,
        message: 'Location request not found'
      });
    }

    if (locationRequest.status !== 'PENDING') {
      console.log('[LOCATION-ACCEPT] ❌ Request already responded to');
      return res.status(400).json({
        success: false,
        message: `Request already ${locationRequest.status.toLowerCase()}`
      });
    }

    // Verify receiver is still an emergency contact (in case they were removed)
    console.log('[LOCATION-ACCEPT] Verifying receiver is still an emergency contact');
    const user = await User.findOne({ email: locationRequest.userEmail });
    
    if (!user) {
      console.log('[LOCATION-ACCEPT] ❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isStillEmergencyContact = user.emergencyContacts && user.emergencyContacts.some(
      contact => contact.toLowerCase() === locationRequest.receiverEmail.toLowerCase()
    );

    if (!isStillEmergencyContact) {
      console.log('[LOCATION-ACCEPT] ❌ Receiver is no longer an emergency contact');
      // Mark request as denied since requester is no longer authorized
      locationRequest.status = 'DENIED';
      locationRequest.respondedAt = new Date();
      await locationRequest.save();
      
      return res.status(403).json({
        success: false,
        message: 'Cannot share location. Requester is no longer listed as an emergency contact.'
      });
    }

    // Update request status and location
    locationRequest.status = 'ACCEPTED';
    locationRequest.respondedAt = new Date();
    locationRequest.location = {
      latitude,
      longitude,
      accuracy,
      timestamp: new Date()
    };
    await locationRequest.save();

    console.log('[LOCATION-ACCEPT] ✅ Request updated to ACCEPTED');

    // Create notification for receiver
    const notification = await Notification.create({
      toEmail: locationRequest.receiverEmail,
      type: 'LOCATION_SHARED',
      message: `${locationRequest.userEmail} has shared their location`,
      data: {
        latitude,
        longitude,
        accuracy,
        userEmail: locationRequest.userEmail
      }
    });

    console.log('[LOCATION-ACCEPT] ✅ Notification created:', notification._id);

    // Send email to receiver with location
    const emailSubject = '✅ Location Shared';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #d4edda; padding: 20px; border: 2px solid #28a745;">
        <h1 style="color: #155724; text-align: center;">✅ Location Shared</h1>
        
        <div style="background-color: white; padding: 20px; margin: 20px 0;">
          <p><strong>${locationRequest.userEmail}</strong> has accepted your location request and shared their current location.</p>
          
          <h3>Location Details:</h3>
          <ul>
            <li><strong>Latitude:</strong> ${latitude}</li>
            <li><strong>Longitude:</strong> ${longitude}</li>
            <li><strong>Accuracy:</strong> ${accuracy ? accuracy.toFixed(2) + ' meters' : 'Unknown'}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          
          <p style="margin-top: 20px;">
            <a href="https://www.google.com/maps?q=${latitude},${longitude}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              📍 View Location on Google Maps
            </a>
          </p>
        </div>
        
        <p style="color: #155724; font-size: 14px; text-align: center;">
          Location shared voluntarily by the user.
        </p>
      </div>
    `;

    console.log('[LOCATION-ACCEPT] Sending email to receiver:', locationRequest.receiverEmail);
    await sendEmail(locationRequest.receiverEmail, emailSubject, emailBody);

    console.log('[LOCATION-ACCEPT] ✅ Location acceptance completed successfully');

    res.status(200).json({
      success: true,
      message: 'Location shared with trusted contact',
      data: {
        requestId: locationRequest._id,
        sentTo: locationRequest.receiverEmail,
        location: { latitude, longitude, accuracy }
      }
    });

  } catch (error) {
    console.error('[LOCATION-ACCEPT] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept location request',
      error: error.message
    });
  }
};

/**
 * PHASE 5 - Deny Location Request (Updated for Multiple Emergency Contacts)
 * POST /api/location/deny
 * 
 * User denies location request
 * Verifies requester is still an emergency contact
 */
exports.denyLocationRequest = async (req, res) => {
  console.log('[LOCATION-DENY] ========== DENY LOCATION REQUEST ==========');
  console.log('[LOCATION-DENY] Request body:', req.body);

  try {
    const { requestId } = req.body;

    // Validation
    if (!requestId) {
      console.log('[LOCATION-DENY] ❌ Missing requestId');
      return res.status(400).json({
        success: false,
        message: 'Missing required field: requestId'
      });
    }

    // Find and update location request
    console.log('[LOCATION-DENY] Finding request:', requestId);
    const locationRequest = await LocationRequest.findById(requestId);

    if (!locationRequest) {
      console.log('[LOCATION-DENY] ❌ Request not found');
      return res.status(404).json({
        success: false,
        message: 'Location request not found'
      });
    }

    if (locationRequest.status !== 'PENDING') {
      console.log('[LOCATION-DENY] ❌ Request already responded to');
      return res.status(400).json({
        success: false,
        message: `Request already ${locationRequest.status.toLowerCase()}`
      });
    }

    // Verify receiver is still an emergency contact (for logging purposes)
    const user = await User.findOne({ email: locationRequest.userEmail });
    if (user && user.emergencyContacts) {
      const isStillEmergencyContact = user.emergencyContacts.some(
        contact => contact.toLowerCase() === locationRequest.receiverEmail.toLowerCase()
      );
      console.log('[LOCATION-DENY] Receiver still an emergency contact:', isStillEmergencyContact);
    }

    // Update request status
    locationRequest.status = 'DENIED';
    locationRequest.respondedAt = new Date();
    await locationRequest.save();

    console.log('[LOCATION-DENY] ✅ Request updated to DENIED');

    // Create notification for receiver
    const notification = await Notification.create({
      toEmail: locationRequest.receiverEmail,
      type: 'LOCATION_DENIED',
      message: `${locationRequest.userEmail} has denied the location request`,
      data: {
        userEmail: locationRequest.userEmail,
        deniedAt: new Date()
      }
    });

    console.log('[LOCATION-DENY] ✅ Notification created:', notification._id);

    // Send email to receiver
    const emailSubject = '❌ Location Request Denied';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8d7da; padding: 20px; border: 2px solid #dc3545;">
        <h1 style="color: #721c24; text-align: center;">❌ Location Request Denied</h1>
        
        <div style="background-color: white; padding: 20px; margin: 20px 0;">
          <p><strong>${locationRequest.userEmail}</strong> has declined your location request.</p>
          
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          
          <div style="background-color: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107;">
            <p><strong>Note:</strong> The user has actively responded and denied the location request. No automatic SOS will be triggered.</p>
          </div>
        </div>
        
        <p style="color: #721c24; font-size: 14px; text-align: center;">
          User has chosen not to share their location at this time.
        </p>
      </div>
    `;

    console.log('[LOCATION-DENY] Sending email to receiver:', locationRequest.receiverEmail);
    await sendEmail(locationRequest.receiverEmail, emailSubject, emailBody);

    console.log('[LOCATION-DENY] ✅ Location denial completed successfully');

    res.status(200).json({
      success: true,
      message: 'Location request denied',
      data: {
        requestId: locationRequest._id,
        notifiedTo: locationRequest.receiverEmail
      }
    });

  } catch (error) {
    console.error('[LOCATION-DENY] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deny location request',
      error: error.message
    });
  }
};
