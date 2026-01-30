/**
 * PHASE 6 - Auto SOS Background Job (Updated for Multiple Emergency Contacts)
 * 
 * Monitors location requests for 30-minute timeout
 * Automatically triggers SOS to ALL emergency contacts if user doesn't respond
 */

const LocationRequest = require('../models/LocationRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

/**
 * Check for expired location requests and trigger auto SOS
 * Sends notifications to ALL emergency contacts
 * Runs every 1 minute
 */
async function checkExpiredRequests() {
  console.log('[AUTO-SOS-JOB] ========== Checking for expired requests ==========');
  console.log('[AUTO-SOS-JOB] Time:', new Date().toLocaleString());

  try {
    // Find all PENDING requests that have expired
    const expiredRequests = await LocationRequest.find({
      status: 'PENDING',
      expiresAt: { $lt: new Date() }
    });

    console.log('[AUTO-SOS-JOB] Found', expiredRequests.length, 'expired request(s)');

    if (expiredRequests.length === 0) {
      console.log('[AUTO-SOS-JOB] No expired requests. Job complete.');
      return;
    }

    // Process each expired request
    for (const request of expiredRequests) {
      console.log('[AUTO-SOS-JOB] ========================================');
      console.log('[AUTO-SOS-JOB] Processing expired request:', request._id);
      console.log('[AUTO-SOS-JOB] User:', request.userEmail);
      console.log('[AUTO-SOS-JOB] Original requester:', request.receiverEmail);
      console.log('[AUTO-SOS-JOB] Expired at:', request.expiresAt);

      try {
        // Update request status to TIMEOUT
        request.status = 'TIMEOUT';
        request.respondedAt = new Date();
        await request.save();

        console.log('[AUTO-SOS-JOB] ✅ Request marked as TIMEOUT');

        // Find user to get ALL emergency contacts
        const user = await User.findOne({ email: request.userEmail });
        
        if (!user) {
          console.error('[AUTO-SOS-JOB] ❌ User not found:', request.userEmail);
          continue;
        }

        if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
          console.error('[AUTO-SOS-JOB] ❌ User has no emergency contacts:', request.userEmail);
          continue;
        }

        console.log('[AUTO-SOS-JOB] Sending AUTO_SOS to', user.emergencyContacts.length, 'emergency contact(s)');
        console.log('[AUTO-SOS-JOB] Emergency contacts:', user.emergencyContacts);

        // Track results per contact
        const results = {
          successful: [],
          failed: []
        };

        // Send AUTO_SOS to ALL emergency contacts
        for (const contactEmail of user.emergencyContacts) {
          console.log('[AUTO-SOS-JOB] ----------------------------------------');
          console.log('[AUTO-SOS-JOB] Processing contact:', contactEmail);

          try {
            // Create AUTO_SOS notification
            const notification = await Notification.create({
              toEmail: contactEmail,
              type: 'AUTO_SOS',
              message: `🚨 AUTO SOS: ${request.userEmail} did not respond to location request within 30 minutes`,
              data: {
                userEmail: request.userEmail,
                requestId: request._id,
                expiredAt: request.expiresAt,
                triggeredAt: new Date(),
                originalRequester: request.receiverEmail
              }
            });

            console.log('[AUTO-SOS-JOB] ✅ AUTO_SOS notification created for', contactEmail, '- ID:', notification._id);

            // Send AUTO SOS email
            const emailSubject = '🚨 AUTOMATIC SOS ALERT - No Response';
            const emailBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff3cd; padding: 20px; border: 3px solid #dc3545;">
                <h1 style="color: #dc3545; text-align: center;">🚨 AUTOMATIC SOS ALERT 🚨</h1>
                
                <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #dc3545;">
                  <h2>30-Minute Timeout Triggered</h2>
                  <p><strong>${request.userEmail}</strong> did not respond to a location request within the 30-minute window.</p>
                  
                  <div style="background-color: #f8d7da; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545;">
                    <h3>⚠️ IMPORTANT</h3>
                    <p>This automatic SOS was triggered because:</p>
                    <ul>
                      <li><strong>${request.receiverEmail}</strong> requested their location at <strong>${request.createdAt.toLocaleString()}</strong></li>
                      <li>The request expired at <strong>${request.expiresAt.toLocaleString()}</strong></li>
                      <li>No response was received within 30 minutes</li>
                    </ul>
                    <p><strong>This may indicate an emergency situation.</strong></p>
                  </div>
                  
                  <h3>Action Required:</h3>
                  <p>As an emergency contact for <strong>${request.userEmail}</strong>, please attempt to reach them immediately through other means:</p>
                  <ul>
                    <li>📞 Phone call</li>
                    <li>📱 Text message</li>
                    <li>🏠 Visit their last known location if appropriate</li>
                    <li>🚨 Contact emergency services if you cannot reach them</li>
                  </ul>
                  
                  <p><strong>Alert triggered at:</strong> ${new Date().toLocaleString()}</p>
                  ${contactEmail !== request.receiverEmail ? `<p style="font-size: 14px; color: #666;">Note: You are receiving this as one of ${request.userEmail}'s emergency contacts. The original location request was made by ${request.receiverEmail}.</p>` : ''}
                </div>
                
                <p style="color: #856404; font-size: 14px; text-align: center;">
                  This is an automated safety alert. Please take immediate action.
                </p>
              </div>
            `;

            console.log('[AUTO-SOS-JOB] Sending AUTO SOS email to:', contactEmail);
            await sendEmail(contactEmail, emailSubject, emailBody);

            console.log('[AUTO-SOS-JOB] ✅ AUTO SOS email sent successfully to:', contactEmail);
            results.successful.push(contactEmail);

          } catch (error) {
            console.error('[AUTO-SOS-JOB] ❌ Failed to send AUTO SOS to:', contactEmail);
            console.error('[AUTO-SOS-JOB] Error:', error.message);
            results.failed.push({
              email: contactEmail,
              error: error.message
            });
            // Continue processing other contacts
          }
        }

        console.log('[AUTO-SOS-JOB] ----------------------------------------');
        console.log('[AUTO-SOS-JOB] ✅ Auto SOS completed for request:', request._id);
        console.log('[AUTO-SOS-JOB] Successful:', results.successful.length, '/', user.emergencyContacts.length);
        console.log('[AUTO-SOS-JOB] Failed:', results.failed.length);

        if (results.failed.length > 0) {
          console.error('[AUTO-SOS-JOB] Failed contacts:', results.failed);
        }

      } catch (error) {
        console.error('[AUTO-SOS-JOB] ❌ Error processing request', request._id);
        console.error('[AUTO-SOS-JOB] Error:', error.message);
        // Continue processing other requests
      }
    }

    console.log('[AUTO-SOS-JOB] ========== Job complete ==========');
    console.log('[AUTO-SOS-JOB] Processed', expiredRequests.length, 'expired request(s)');

  } catch (error) {
    console.error('[AUTO-SOS-JOB] ❌ Fatal error in job:');
    console.error('[AUTO-SOS-JOB] Error:', error);
  }
}

/**
 * Initialize background job
 * Runs every 1 minute
 */
function startAutoSOSJob() {
  console.log('[AUTO-SOS-JOB] 🚀 Starting Auto SOS background job');
  console.log('[AUTO-SOS-JOB] Interval: 1 minute (60000ms)');

  // Run immediately on start
  checkExpiredRequests();

  // Then run every 1 minute
  setInterval(checkExpiredRequests, 60000); // 60000ms = 1 minute

  console.log('[AUTO-SOS-JOB] ✅ Auto SOS job initialized');
}

module.exports = {
  startAutoSOSJob,
  checkExpiredRequests
};
