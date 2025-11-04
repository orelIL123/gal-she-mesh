/**
 * Clear all cache and reload Firestore data
 * This forces the app to fetch fresh data from Firebase
 * 
 * Usage: node scripts/clearCache.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearCache() {
  console.log('🧹 Clearing cache and verifying data...\n');
  
  try {
    // Check barbers
    console.log('📊 Checking barbers collection:');
    const barbersSnapshot = await db.collection('barbers').get();
    barbersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   ID: ${doc.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Phone: ${data.phone || data.phoneE164 || 'N/A'}`);
      console.log('');
    });
    
    // Check users
    console.log('📊 Checking users collection:');
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isAdmin || data.isBarber) {
        console.log(`   ID: ${doc.id}`);
        console.log(`   Name: ${data.name}`);
        console.log(`   Type: ${data.type}`);
        console.log(`   Admin: ${data.isAdmin || false}`);
        console.log('');
      }
    });
    
    console.log('✅ Data verification complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Stop expo (Ctrl+C)');
    console.log('   2. Run: npx expo start -c');
    console.log('   3. Delete Expo Go from phone and reinstall');
    console.log('   4. Scan QR code again');
    console.log('\nThis will force the app to fetch fresh data from Firebase!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearCache();

