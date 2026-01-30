const User = require("../models/User");

// Upgrade user subscription
exports.upgradeSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const { tier } = req.body;

    if (!["free", "pro", "premium"].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription tier",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update subscription
    user.subscription = {
      tier,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Subscription upgraded to ${tier}`,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error("❌ Subscription upgrade error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get current subscription
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("subscription");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      subscription: user.subscription || { tier: "free", status: "active" },
    });
  } catch (error) {
    console.error("❌ Get subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.subscription.status = "cancelled";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled",
    });
  } catch (error) {
    console.error("❌ Cancel subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
