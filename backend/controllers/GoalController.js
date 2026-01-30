const User = require("../models/User");
const mongoose = require("mongoose");

// Helper function to find or create user for simple auth
async function findOrCreateUser(userId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // For simple auth (non-ObjectId), find or create by email
      const userEmail = `${userId}@demo.local`;
      let user = await User.findOne({ email: userEmail });
      
      if (!user) {
        console.log(`Creating new user for userId: ${userId}`);
        try {
          user = await User.create({
            email: userEmail,
            name: userId === 'demo-user' ? 'Demo User' : userId,
          });
        } catch (createError) {
          // If duplicate key error on auth0Sub, try to find existing user again
          if (createError.code === 11000) {
            console.log('Duplicate key error, attempting to find existing user...');
            user = await User.findOne({ email: userEmail });
            if (!user) {
              // If still not found, there might be orphaned data - create with explicit null
              console.log('User still not found, database might have orphaned index');
              throw new Error('Unable to create user due to database index conflict. Please check MongoDB indexes.');
            }
          } else {
            throw createError;
          }
        }
      }
      return user;
    }
    return await User.findById(userId);
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
}

// Create a new goal
exports.createGoal = async (req, res) => {
  const { title, description, startDate, endDate, status } = req.body;
  const userId = req.userId;

  try {
    const user = await findOrCreateUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newGoal = {
      title,
      description,
      startDate,
      endDate,
      status: status || "active",
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    user.goals.push(newGoal);
    await user.save();

    const createdGoal = user.goals[user.goals.length - 1];
    res.status(201).json({ message: "Goal created", goal: createdGoal });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating goal", error: err.message });
  }
};

// Update a goal
exports.updateGoal = async (req, res) => {
  const { goalId } = req.params;
  const userId = req.userId;
  const updateData = req.body;

  try {
    const user = await findOrCreateUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const goal = user.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    Object.assign(goal, updateData, { updatedAt: new Date() });
    await user.save();

    res.status(200).json({ message: "Goal updated", goal });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating goal", error: err.message });
  }
};

// Delete a goal
exports.deleteGoal = async (req, res) => {
  const { goalId } = req.params;
  const userId = req.userId;

  try {
    const user = await findOrCreateUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.goals = user.goals.filter((goal) => goal._id.toString() !== goalId);
    await user.save();

    res.status(200).json({ message: "Goal deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting goal", error: err.message });
  }
};

// GET ALL GOALS
exports.getGoals = async (req, res) => {
  const userId = req.userId;

  try {
    console.log('getGoals called with userId:', userId);
    const user = await findOrCreateUser(userId);
    if (!user) {
      console.log('User not found for userId:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('User found, goals count:', user.goals ? user.goals.length : 0);
    res.status(200).json({ goals: user.goals || [] });
  } catch (err) {
    console.error('Error in getGoals:', err);
    console.error('Error stack:', err.stack);
    res
      .status(500)
      .json({ message: "Error fetching goals", error: err.message });
  }
};
// UPDATE OF PROGRESSS
exports.updateGoalProgress = async (req, res) => {
  const { goalId } = req.params;
  const userId = req.userId;
  const { progress } = req.body;

  try {
    const user = await findOrCreateUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const goal = user.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    goal.progress = progress;
    goal.status = progress === 100 ? "completed" : goal.status;
    goal.updatedAt = new Date();

    await user.save();

    res.status(200).json({ message: "Goal progress updated", goal });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating goal progress", error: err.message });
  }
};

// ADD MILESTONE TO GOAL
exports.addMilestone = async (req, res) => {
  const { goalId } = req.params;
  const userId = req.userId;
  const { title } = req.body;

  try {
    const user = await findOrCreateUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const goal = user.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    goal.milestones.push({ title, completed: false });
    goal.updatedAt = new Date();
    
    await user.save();

    res.status(201).json({ message: "Milestone added", goal });
  } catch (err) {
    res.status(500).json({ message: "Error adding milestone", error: err.message });
  }
};

// TOGGLE MILESTONE COMPLETION
exports.toggleMilestone = async (req, res) => {
  const { goalId, milestoneId } = req.params;
  const userId = req.userId;

  try {
    const user = await findOrCreateUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const goal = user.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const milestone = goal.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    milestone.completed = !milestone.completed;
    milestone.completedAt = milestone.completed ? new Date() : null;
    
    // Auto-calculate progress based on milestones
    const totalMilestones = goal.milestones.length;
    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    goal.progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    goal.status = goal.progress === 100 ? "completed" : goal.status;
    goal.updatedAt = new Date();

    await user.save();

    res.status(200).json({ message: "Milestone toggled", goal });
  } catch (err) {
    res.status(500).json({ message: "Error toggling milestone", error: err.message });
  }
};

// DELETE MILESTONE
exports.deleteMilestone = async (req, res) => {
  const { goalId, milestoneId } = req.params;
  const userId = req.userId;

  try {
    const user = await findOrCreateUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const goal = user.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    goal.milestones = goal.milestones.filter(m => m._id.toString() !== milestoneId);
    
    // Recalculate progress
    const totalMilestones = goal.milestones.length;
    const completedMilestones = goal.milestones.filter(m => m.completed).length;
    goal.progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    goal.updatedAt = new Date();

    await user.save();

    res.status(200).json({ message: "Milestone deleted", goal });
  } catch (err) {
    res.status(500).json({ message: "Error deleting milestone", error: err.message });
  }
};
