// cleanIndexes.js - Drop auth0Sub_1 index using existing config
require('dotenv').config();
const connectDB = require('./config/db');
const mongoose = require('mongoose');

async function cleanIndexes() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB via config');

    const usersCollection = mongoose.connection.collection('users');

    // Get all indexes
    console.log('\n📋 Fetching current indexes...');
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop the problematic auth0Sub index
    console.log('\n🔧 Attempting to drop auth0Sub_1 index...');
    try {
      await usersCollection.dropIndex('auth0Sub_1');
      console.log('✅ Successfully dropped auth0Sub_1 index!');
    } catch (err) {
      if (err.code === 27 || err.codeName === 'IndexNotFound') {
        console.log('ℹ️  auth0Sub_1 index does not exist (already removed)');
      } else {
        console.error('❌ Error dropping index:', err.message);
        throw err;
      }
    }

    // Verify indexes after dropping
    console.log('\n📋 Fetching indexes after cleanup...');
    const newIndexes = await usersCollection.indexes();
    console.log('Remaining indexes:');
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Index cleanup complete!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

cleanIndexes();
