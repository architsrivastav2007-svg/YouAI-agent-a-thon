// controllers/user.controller.js
const User = require('../models/User');
const mongoose = require('mongoose');

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; // from simple auth middleware
    
    // Check if userId is a valid ObjectId, otherwise create a demo user response
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // Return a mock user for demo/simple auth
      return res.status(200).json({ 
        success: true, 
        user: {
          _id: userId,
          email: `${userId}@demo.local`,
          name: userId === 'demo-user' ? 'Demo User' : userId,
          goals: [],
          milestones: [],
          personality: {},
          growth: { journalStreak: 0, milestoneCount: 0 }
        }
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    // Simple logout - just clear client-side token
    return res
      .status(200)
      .json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('❌ Error during logout:', err);
    return res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};
