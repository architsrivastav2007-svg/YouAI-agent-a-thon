// routes/JournalRoute.js
const express = require("express");
const router = express.Router();
const { extractUserId } = require("../middlewares/SimpleAuth");

const {
  createJournal,
  getJournals,
} = require("../controllers/JournalController");

// Simple auth: extracts userId from header or uses 'demo-user'
router.post("/add-journal", extractUserId, createJournal);
router.get("/history", extractUserId, getJournals);

module.exports = router;
