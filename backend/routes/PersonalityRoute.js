const express = require("express");
const router = express.Router();
const { updatePersonality } = require("../controllers/PersonalityController");
const { extractUserId } = require("../middlewares/SimpleAuth");

// Simple auth: extracts userId from header or uses 'demo-user'
router.post("/update", extractUserId, updatePersonality);

module.exports = router;
