/**
 * Initialize Firestore Collections for Naor Amar Barbershop
 * Run this script to create the initial database structure
 * 
 * Usage:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Download service account key from Firebase Console
 * 3. Save it as serviceAccountKey.json in the scripts folder
 * 4. Run: node scripts/initializeFirestore.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeFirestoreStructure() {
  console.log('🔥 Creating Firestore structure for Naor Amar...');
  
  try {
    // 1. Business Settings
    await db.collection('businessSettings').doc('main').set({
      businessName: "Naor Amar",
      ownerName: "Naor Amar",
      ownerPhone: "+9720532706369",
      ownerEmail: "info@naoramar.com",
      address: "כתובת העסק של נאור עמר",
      addressEn: "Naor Amar Business Address",
      workingHours: {
        sunday: { open: "09:00", close: "20:00", closed: false },
        monday: { open: "09:00", close: "20:00", closed: false },
        tuesday: { open: "09:00", close: "20:00", closed: false },
        wednesday: { open: "09:00", close: "20:00", closed: false },
        thursday: { open: "09:00", close: "20:00", closed: false },
        friday: { open: "08:00", close: "14:00", closed: false },
        saturday: { open: "00:00", close: "00:00", closed: true }
      },
      slotDuration: 25,
      advanceBookingDays: 30,
      cancellationPolicy: "ניתן לבטל עד 24 שעות לפני התור",
      welcomeMessage: "ברוכים הבאים למספרת נאור עמר!",
      primaryColor: "#8b4513",
      language: "he",
      currency: "ILS",
      updatedAt: new Date()
    });
    console.log('✅ Created businessSettings');

    // 2. Sample Treatments
    const treatments = [
      {
        treatmentId: "treatment_haircut",
        name: "תספורת גברים",
        nameEn: "Men's Haircut",
        description: "תספורת מקצועית לגברים",
        price: 80,
        duration: 25,
        category: "haircut",
        active: true,
        popularityScore: 100,
        createdAt: new Date()
      },
      {
        treatmentId: "treatment_haircut_beard",
        name: "תספורת + זקן",
        nameEn: "Haircut + Beard",
        description: "תספורת וגילוח זקן",
        price: 120,
        duration: 50,
        category: "haircut",
        active: true,
        popularityScore: 90,
        createdAt: new Date()
      },
      {
        treatmentId: "treatment_beard_only",
        name: "זקן בלבד",
        nameEn: "Beard Only",
        description: "גילוח וטיפול בזקן",
        price: 50,
        duration: 25,
        category: "beard",
        active: true,
        popularityScore: 70,
        createdAt: new Date()
      }
    ];

    for (const treatment of treatments) {
      await db.collection('treatments').doc(treatment.treatmentId).set(treatment);
      console.log(`✅ Created treatment: ${treatment.name}`);
    }

    console.log('\n🎉 Firestore structure initialized successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Run seedData.js to add employee data');
    console.log('   2. Deploy Firebase rules: firebase deploy --only firestore:rules');
    console.log('   3. Deploy Storage rules: firebase deploy --only storage:rules');
    console.log('   4. Deploy Indexes: firebase deploy --only firestore:indexes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    process.exit(1);
  }
}

// Run initialization
initializeFirestoreStructure();

