const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log('🔄 Attempting MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@'));
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB connected to DB: ${conn.connection.name}`);
    console.log(`✅ Host: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;