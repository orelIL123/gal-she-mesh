/**
 * Test Firebase Connection
 * Verifies that Firebase is properly configured and accessible
 * 
 * Usage:
 * 1. Ensure serviceAccountKey.json exists in scripts folder
 * 2. Run: node scripts/testConnection.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testConnection() {
  console.log('🔥 Testing Firebase connection for Naor Amar...\n');
  
  try {
    // Test 1: Read business settings
    console.log('Test 1: Reading business settings...');
    const businessDoc = await db.collection('businessSettings').doc('main').get();
    if (businessDoc.exists) {
      const data = businessDoc.data();
      console.log(`✅ Business settings found: ${data.businessName}`);
      console.log(`   Owner: ${data.ownerName}`);
      console.log(`   Phone: ${data.ownerPhone}`);
    } else {
      console.log('⚠️  Business settings not found - run initializeFirestore.js first');
    }
    
    // Test 2: Count barbers
    console.log('\nTest 2: Counting barbers...');
    const barbersSnapshot = await db.collection('barbers').get();
    console.log(`✅ Found ${barbersSnapshot.size} barber(s)`);
    barbersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.specialization})`);
    });
    
    // Test 3: Count treatments
    console.log('\nTest 3: Counting treatments...');
    const treatmentsSnapshot = await db.collection('treatments').get();
    console.log(`✅ Found ${treatmentsSnapshot.size} treatment(s)`);
    treatmentsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (₪${data.price}, ${data.duration} min)`);
    });
    
    // Test 4: Count appointments
    console.log('\nTest 4: Counting appointments...');
    const appointmentsSnapshot = await db.collection('appointments').get();
    console.log(`✅ Found ${appointmentsSnapshot.size} appointment(s)`);
    
    // Test 5: Count users
    console.log('\nTest 5: Counting users...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`✅ Found ${usersSnapshot.size} user(s)`);
    
    console.log('\n🎉 Firebase connection test completed successfully!');
    console.log('✅ All tests passed - your Firebase backend is ready!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Firebase connection test failed:', error);
    console.log('\n📝 Troubleshooting:');
    console.log('   1. Check that serviceAccountKey.json is in scripts folder');
    console.log('   2. Verify Firebase project ID matches');
    console.log('   3. Ensure Firestore database is created in Firebase Console');
    console.log('   4. Run initializeFirestore.js to create initial data');
    
    process.exit(1);
  }
}

testConnection();

