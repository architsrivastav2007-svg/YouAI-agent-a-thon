/**
 * SOS Routes
 * 
 * Endpoints for SOS system:
 * - Manual SOS
 * - Location requests
 * - Accept/Deny responses
 */

const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');

// PHASE 3 - Manual SOS
router.post('/sos/manual', sosController.triggerManualSOS);

// PHASE 4 - Location Request
router.post('/location/request', sosController.requestLocation);

// PHASE 5 - Accept/Deny
router.post('/location/accept', sosController.acceptLocationRequest);
router.post('/location/deny', sosController.denyLocationRequest);

module.exports = router;
