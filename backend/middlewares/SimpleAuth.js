/**
 * Simple Authentication Middleware
 * 
 * How it works:
 * 1. Checks for 'x-user-id' header in the request
 * 2. If found, uses that userId (allows multi-user support)
 * 3. If not found, uses a default 'demo-user' ID
 * 4. Attaches userId to req.userId for controllers to use
 * 
 * This is a simple system - no JWT, no passwords, just optional userId identification.
 * Perfect for demos or internal tools where security isn't critical.
 */

const extractUserId = (req, res, next) => {
  // Check for custom header, fallback to demo user
  const userId = req.headers['x-user-id'] || 'demo-user';
  
  console.log('SimpleAuth - Extracted userId:', userId);
  
  // Attach to request object for controllers
  req.userId = userId;
  
  next();
};

module.exports = { extractUserId };
