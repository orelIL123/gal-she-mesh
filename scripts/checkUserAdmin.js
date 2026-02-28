/**
 * Check if user exists: 0523985505
 * 
 * Usage: node scripts/checkUserAdmin.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../gal-shemesh-firebase-adminsdk-fbsvc-a1bc48ced4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function checkUser() {
  console.log('🔍 Checking for user: 0523985505\n');
  
  const email = '972523985505@galshemesh.app';
  const phone = '+972523985505';
  
  try {
    // Check in Authentication
    console.log('📧 Checking Authentication by email...');
    try {
      const userRecord = await auth.getUserByEmail(email);
      console.log('✅ User found in Authentication!');
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Display Name: ${userRecord.displayName || 'N/A'}`);
      console.log(`   Email Verified: ${userRecord.emailVerified}`);
      console.log(`   Created: ${userRecord.metadata.creationTime}`);
      
      // Get custom claims
      const user = await auth.getUser(userRecord.uid);
      console.log(`   Custom Claims:`, user.customClaims || 'None');
      
      // Check in Firestore
      console.log('\n📄 Checking Firestore...');
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        console.log('✅ User found in Firestore!');
        console.log(`   Display Name: ${data.displayName || 'N/A'}`);
        console.log(`   Phone: ${data.phone || 'N/A'}`);
        console.log(`   Is Admin: ${data.isAdmin || false}`);
        console.log(`   Is Barber: ${data.isBarber || false}`);
        console.log(`   Has Password: ${data.hasPassword || false}`);
        console.log(`   Created At: ${data.createdAt ? data.createdAt.toDate() : 'N/A'}`);
      } else {
        console.log('❌ User NOT found in Firestore!');
      }
      
      // Also search by phone in Firestore
      console.log('\n📱 Searching Firestore by phone...');
      const phoneQuery = await db.collection('users').where('phone', '==', phone).get();
      if (!phoneQuery.empty) {
        console.log(`✅ Found ${phoneQuery.size} user(s) with phone ${phone}:`);
        phoneQuery.forEach(doc => {
          const data = doc.data();
          console.log(`   UID: ${doc.id}`);
          console.log(`   Email: ${data.email || 'N/A'}`);
          console.log(`   Is Admin: ${data.isAdmin || false}`);
        });
      } else {
        console.log(`❌ No users found with phone ${phone}`);
      }
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ User NOT found in Authentication!');
      } else {
        throw error;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`   Error message: ${error.message}`);
    }
    process.exit(1);
  }
}

checkUser();

