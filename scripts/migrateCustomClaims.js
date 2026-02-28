/**
 * Migrate Custom Claims for all users
 * This script reads all users from Firestore and sets their custom claims
 * in Firebase Auth based on their isAdmin and isBarber fields.
 * 
 * Usage: node scripts/migrateCustomClaims.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account
const serviceAccount = require('../gal-shemesh-firebase-adminsdk-fbsvc-a1bc48ced4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function migrateCustomClaims() {
  console.log('🔄 Starting Custom Claims Migration\n');
  
  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users in Firestore\n`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      const claims = {
        isAdmin: userData?.isAdmin === true,
        isBarber: userData?.isBarber === true
      };
      
      try {
        // Check if user exists in Auth
        try {
          await auth.getUser(userId);
        } catch (authError) {
          if (authError.code === 'auth/user-not-found') {
            console.log(`⚠️  User ${userId} not found in Auth, skipping...`);
            results.push({ userId, email: userData?.email || 'N/A', success: false, error: 'User not found in Auth' });
            failCount++;
            continue;
          }
          throw authError;
        }
        
        // Set custom claims
        await auth.setCustomUserClaims(userId, claims);
        console.log(`✅ Updated claims for ${userId} (${userData?.email || userData?.displayName || 'N/A'}):`, claims);
        results.push({ userId, email: userData?.email || 'N/A', success: true, claims });
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update claims for ${userId}:`, error.message);
        results.push({ userId, email: userData?.email || 'N/A', success: false, error: error.message });
        failCount++;
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log(`   Total users: ${usersSnapshot.size}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (failCount > 0) {
      console.log('❌ Failed users:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.userId} (${r.email}): ${r.error}`);
      });
      console.log('');
    }
    
    console.log('🎉 Migration completed!');
    console.log('\n💡 Note: Users will need to refresh their auth token (sign out and sign in)');
    console.log('   for the new custom claims to take effect.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`   Error message: ${error.message}`);
    }
    process.exit(1);
  }
}

migrateCustomClaims();


