const express = require("express");
const router = express.Router();
const {
  upgradeSubscription,
  getSubscription,
  cancelSubscription,
} = require("../controllers/SubscriptionController");
const { extractUserId } = require("../middlewares/SimpleAuth");

router.post("/upgrade", extractUserId, upgradeSubscription);
router.get("/current", extractUserId, getSubscription);
router.post("/cancel", extractUserId, cancelSubscription);

module.exports = router;
