// routes/routineRoutes.js
const express = require("express");
const router = express.Router();
const routineController = require("../controllers/routineController");
const { extractUserId } = require("../middlewares/SimpleAuth");

// Simple auth applied to all routine routes
router.use(extractUserId);

router.post("/create-routine", routineController.createRoutine);
router.get("/get-routine", routineController.getRoutines);
router.patch("/toggle/:id", routineController.toggleCompletion);

router.patch("/reset-daily", routineController.resetRoutinesForNewDay);
router.delete("/delete/:routineId", routineController.deleteRoutine);
router.put("/update/:routineId", routineController.updateRoutine);

module.exports = router;
