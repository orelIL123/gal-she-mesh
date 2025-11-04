/**
 * Create Test User for SMS Testing
 * Phone: 0523985505 (+972523985505)
 * 
 * Usage: node scripts/createTestUser.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createTestUser() {
  console.log('📱 Creating Test User for SMS Testing...\n');
  
  const testData = {
    phone: '+972523985505',
    displayName: 'Test User',
    email: 'test@naoramar.com',
    password: 'TestUser2025!',
  };
  
  try {
    // בדיקה אם המשתמש כבר קיים
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(testData.email);
      console.log('⚠️  Test user already exists');
      console.log(`   UID: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('Creating new test user...');
        userRecord = await auth.createUser({
          email: testData.email,
          password: testData.password,
          phoneNumber: testData.phone,
          displayName: testData.displayName,
          emailVerified: true,
        });
        console.log('✅ Test user created!');
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Email: ${testData.email}`);
        console.log(`   Password: ${testData.password}`);
        console.log(`   Phone: ${testData.phone}`);
      } else {
        throw error;
      }
    }
    
    // יצירת מסמך ב-Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: testData.displayName,
      email: testData.email,
      phone: testData.phone,
      phoneE164: testData.phone,
      type: 'client',
      isBarber: false,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('✅ Test user document created in Firestore');
    
    console.log('\n🎉 Test user setup complete!');
    console.log('\n📋 Test Login Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${testData.email}`);
    console.log(`Password: ${testData.password}`);
    console.log(`Phone:    ${testData.phone}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📱 You can now test Phone Authentication with this number!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();

