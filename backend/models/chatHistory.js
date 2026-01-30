const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // Changed from ObjectId to String for simple auth
    prompt: { type: String, required: true },
    response: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
