require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function addEmergencyContacts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userEmail = 'architsrivastav2007@gmail.com';
    const contacts = [
      'ashwinnn.038@gmail.com',
      'ashmit8811ashu@gmail.com',
    ];

    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    user.emergencyContacts = contacts;
    await user.save();

    console.log('✅ Emergency contacts added successfully!');
    console.log('User:', userEmail);
    console.log('Contacts:', contacts);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addEmergencyContacts();
