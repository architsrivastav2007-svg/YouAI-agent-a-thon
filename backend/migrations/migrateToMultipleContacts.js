/**
 * Migration Script: Single to Multiple Emergency Contacts
 * 
 * Migrates existing users from trustedContactEmail (single) to emergencyContacts (array)
 * 
 * Usage:
 *   node backend/migrations/migrateToMultipleContacts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Migrate users from trustedContactEmail to emergencyContacts
 */
async function migrateToMultipleContacts() {
  console.log('========================================');
  console.log('MIGRATION: Single to Multiple Emergency Contacts');
  console.log('========================================\n');

  try {
    // Find all users with trustedContactEmail field
    const usersWithOldField = await User.find({ 
      trustedContactEmail: { $exists: true, $ne: null } 
    });

    console.log(`Found ${usersWithOldField.length} user(s) with trustedContactEmail\n`);

    if (usersWithOldField.length === 0) {
      console.log('No users to migrate. All users are already using emergencyContacts.');
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Migrate each user
    for (const user of usersWithOldField) {
      console.log(`Migrating user: ${user.email}`);
      console.log(`  Old: trustedContactEmail = "${user.trustedContactEmail}"`);

      try {
        // Check if user already has emergencyContacts
        if (user.emergencyContacts && user.emergencyContacts.length > 0) {
          console.log(`  ⚠️  User already has emergencyContacts, skipping`);
          skipped++;
          continue;
        }

        // Move trustedContactEmail to emergencyContacts array
        user.emergencyContacts = [user.trustedContactEmail];
        
        // Remove old field (optional - MongoDB will ignore it anyway)
        user.trustedContactEmail = undefined;
        
        // Save user
        await user.save();

        console.log(`  New: emergencyContacts = [${user.emergencyContacts.join(', ')}]`);
        console.log(`  ✅ Migrated successfully\n`);
        migrated++;

      } catch (error) {
        console.error(`  ❌ Error migrating user ${user.email}:`, error.message);
        console.error(`     ${error}\n`);
        errors++;
      }
    }

    console.log('========================================');
    console.log('MIGRATION SUMMARY');
    console.log('========================================');
    console.log(`Total users found:       ${usersWithOldField.length}`);
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`⚠️  Skipped:              ${skipped}`);
    console.log(`❌ Errors:               ${errors}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration was successful
 */
async function verifyMigration() {
  console.log('========================================');
  console.log('VERIFICATION');
  console.log('========================================\n');

  // Check for remaining users with trustedContactEmail
  const remainingOldUsers = await User.countDocuments({ 
    trustedContactEmail: { $exists: true, $ne: null } 
  });

  // Check users with emergencyContacts
  const usersWithNewField = await User.countDocuments({ 
    emergencyContacts: { $exists: true, $ne: [] } 
  });

  console.log(`Users with trustedContactEmail:  ${remainingOldUsers}`);
  console.log(`Users with emergencyContacts:    ${usersWithNewField}\n`);

  if (remainingOldUsers > 0) {
    console.log('⚠️  Warning: Some users still have trustedContactEmail field');
    console.log('   You may need to run the migration again or check for errors\n');
  } else {
    console.log('✅ Migration verified: All users migrated successfully\n');
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await connectDB();
    await migrateToMultipleContacts();
    await verifyMigigation();
    
    console.log('Migration completed. Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
main();
