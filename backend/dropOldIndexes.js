// dropOldIndexes.js - Run this once to clean up old MongoDB indexes
const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndexes() {
  try {
    // Create a new connection instance
    const conn = await mongoose.createConnection(process.env.MONGODB_URI).asPromise();
    console.log('✅ Connected to MongoDB');

    const usersCollection = conn.collection('users');

    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log('📋 Current indexes:', indexes.map(i => i.name));

    // Drop the problematic auth0Sub index if it exists
    try {
      await usersCollection.dropIndex('auth0Sub_1');
      console.log('✅ Successfully dropped auth0Sub_1 index');
    } catch (err) {
      if (err.code === 27 || err.codeName === 'IndexNotFound') {
        console.log('ℹ️  auth0Sub_1 index does not exist (already removed)');
      } else {
        console.error('❌ Error dropping index:', err.message);
      }
    }

    // List indexes after dropping
    const newIndexes = await usersCollection.indexes();
    console.log('📋 Remaining indexes:', newIndexes.map(i => i.name));

    console.log('✅ Index cleanup complete!');
    await conn.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropOldIndexes();
