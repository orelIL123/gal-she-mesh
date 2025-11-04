/**
 * Create Admin User in Firebase Authentication
 * This creates a user in Auth and links it to Firestore
 * 
 * Usage: node scripts/createAdminUser.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  console.log('🔐 Creating Admin User in Firebase Authentication...\n');
  
  // פרטי נאור עמר
  const adminData = {
    phone: '+9720532706369',
    displayName: 'Naor Amar',
    email: 'naor@naoramar.com', // אימייל זמני - תוכל לשנות
    password: 'NaorAmar2025!', // סיסמה זמנית - שנה אחרי כניסה ראשונה!
  };
  
  try {
    // בדיקה אם המשתמש כבר קיים
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminData.email);
      console.log('⚠️  User already exists in Authentication');
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Phone: ${userRecord.phoneNumber || 'Not set'}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // יצירת משתמש חדש
        console.log('Creating new user...');
        userRecord = await auth.createUser({
          email: adminData.email,
          password: adminData.password,
          phoneNumber: adminData.phone,
          displayName: adminData.displayName,
          emailVerified: true,
        });
        console.log('✅ User created in Firebase Authentication!');
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Email: ${adminData.email}`);
        console.log(`   Password: ${adminData.password}`);
        console.log(`   Phone: ${adminData.phone}`);
      } else {
        throw error;
      }
    }
    
    // עדכון/יצירת מסמך ב-Firestore
    const userId = userRecord.uid;
    
    // בדיקה אם כבר קיים ב-users
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      console.log('\n⚠️  User document already exists in Firestore');
      console.log('   Updating admin status...');
    } else {
      console.log('\n📝 Creating user document in Firestore...');
    }
    
    await db.collection('users').doc(userId).set({
      uid: userId,
      name: adminData.displayName,
      email: adminData.email,
      phone: adminData.phone,
      phoneE164: adminData.phone,
      type: 'barber',
      isBarber: true,
      isAdmin: true,
      barberId: 'barber_naor_amar_1',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('✅ User document updated in Firestore');
    
    // הגדרת Custom Claims
    console.log('\n🔑 Setting custom claims...');
    await auth.setCustomUserClaims(userId, {
      admin: true,
      barber: true,
      barberId: 'barber_naor_amar_1'
    });
    console.log('✅ Custom claims set successfully');
    
    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 Login Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log(`Phone:    ${adminData.phone}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('⚠️  Save these credentials in a secure place!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();

