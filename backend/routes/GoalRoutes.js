// routes/goalRoutes.js
const express = require("express");
const router = express.Router();
const goalController = require("../controllers/GoalController");
const { extractUserId } = require("../middlewares/SimpleAuth");

// Simple auth applied to all goal routes
router.use(extractUserId);

router.post("/create", goalController.createGoal);
router.delete("/del/:goalId", goalController.deleteGoal);
router.get("/get-goals", goalController.getGoals);
router.patch("/update/:goalId", goalController.updateGoalProgress);

// Milestone routes
router.post("/:goalId/milestone", goalController.addMilestone);
router.patch("/:goalId/milestone/:milestoneId/toggle", goalController.toggleMilestone);
router.delete("/:goalId/milestone/:milestoneId", goalController.deleteMilestone);

module.exports = router;
