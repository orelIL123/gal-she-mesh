/**
 * Create Admin User: 0523985505
 * Password: 112233
 * 
 * Usage: node scripts/createUserAdmin.js
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

async function createUserAdmin() {
  console.log('🔐 Creating Admin User: 0523985505\n');
  
  const adminData = {
    phone: '+972523985505',
    phoneLocal: '0523985505',
    displayName: 'מנהל מערכת',
    email: '972523985505@galshemesh.app', // Auto-generated email from phone
    password: '112233',
  };
  
  try {
    // Check if user already exists by email - if exists, delete first
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminData.email);
      console.log('⚠️  User already exists in Authentication');
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log('\n🗑️  Deleting existing user to create fresh...');
      
      // Delete from Authentication
      await auth.deleteUser(userRecord.uid);
      console.log('✅ User deleted from Authentication');
      
      // Delete from Firestore if exists
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
        await db.collection('users').doc(userRecord.uid).delete();
        console.log('✅ User deleted from Firestore');
      }
      
      // Wait a moment for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('✅ No existing user found, will create new one');
      } else {
        throw error;
      }
    }
    
    // Create new user
    console.log('\n📝 Creating new user in Firebase Auth...');
    userRecord = await auth.createUser({
      email: adminData.email,
      password: adminData.password,
      displayName: adminData.displayName,
      emailVerified: true,
    });
    console.log('✅ User created in Firebase Authentication!');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${adminData.email}`);
    
    const userId = userRecord.uid;
    
    // Check if user document exists in Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      console.log('\n⚠️  User document already exists in Firestore');
      console.log('   Updating to admin status...');
    } else {
      console.log('\n📝 Creating user document in Firestore...');
    }
    
    // Create/update user document in Firestore
    await db.collection('users').doc(userId).set({
      uid: userId,
      email: adminData.email,
      displayName: adminData.displayName,
      name: adminData.displayName,
      phone: adminData.phone,
      isAdmin: true,
      isBarber: false, // Set to true if user should also be a barber
      hasPassword: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ User document created/updated in Firestore');
    
    // Set custom claims for admin access (CRITICAL for Storage rules)
    console.log('\n🔑 Setting custom claims...');
    await auth.setCustomUserClaims(userId, {
      isAdmin: true,
      isBarber: false
    });
    console.log('✅ Custom claims set successfully');
    console.log('   Note: User will need to log out and back in for claims to take effect');
    
    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 פרטי התחברות:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`טלפון:    ${adminData.phoneLocal} (או ${adminData.phone})`);
    console.log(`סיסמה:    ${adminData.password}`);
    console.log(`Email:    ${adminData.email}`);
    console.log(`UID:      ${userId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ המשתמש הוא עכשיו אדמין ויכול להתחבר!');
    console.log('⚠️  חשוב: המשתמש צריך להתנתק ולהתחבר מחדש כדי שה-custom claims יעבדו!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`   Error message: ${error.message}`);
    }
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

createUserAdmin();

