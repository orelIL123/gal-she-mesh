/**
 * Seed Employee Data to Firestore
 * Reads from data/employeeSeedData.json and adds to Firebase
 * 
 * Usage:
 * 1. Ensure serviceAccountKey.json exists in scripts folder
 * 2. Run: node scripts/seedData.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const employeeData = require('../data/employeeSeedData.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedEmployees() {
  console.log(`🌱 Seeding ${employeeData.totalEmployees} employees for ${employeeData.businessName}...`);
  
  try {
    for (const employee of employeeData.employees) {
      // Add to barbers collection
      await db.collection('barbers').doc(employee.barberId).set({
        barberId: employee.barberId,
        name: employee.name,
        phone: employee.phone,
        phoneE164: employee.phoneE164,
        specialization: employee.specialization,
        experience: parseInt(employee.experience),
        isMainBarber: employee.isMainBarber,
        available: employee.available,
        bio: `ספר מקצועי עם ${employee.experience} שנות ניסיון`,
        rating: 5.0,
        totalReviews: 0,
        createdAt: new Date()
      });
      
      // Add to users collection
      await db.collection('users').doc(employee.userId).set({
        uid: employee.userId,
        name: employee.name,
        phone: employee.phone,
        phoneE164: employee.phoneE164,
        type: 'barber',
        isBarber: true,
        isAdmin: employee.isMainBarber,
        barberId: employee.barberId,
        createdAt: new Date()
      });
      
      console.log(`✅ Seeded: ${employee.name}`);
    }
    
    console.log('\n🎉 Employee seeding complete!');
    console.log('📝 Next steps:');
    console.log('   1. Verify data in Firebase Console');
    console.log('   2. Set up Firebase Authentication for employees');
    console.log('   3. Test the app with seeded data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding employees:', error);
    process.exit(1);
  }
}

seedEmployees();

