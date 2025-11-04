/**
 * Create empty placeholder documents in remaining collections
 * This is optional - collections will be created automatically when first used
 * 
 * Usage: node scripts/createEmptyCollections.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createEmptyCollections() {
  console.log('🔥 Creating remaining collections with placeholder documents...\n');
  
  try {
    // Appointments placeholder
    await db.collection('appointments').doc('_placeholder').set({
      _note: 'This is a placeholder. Delete when first real appointment is created.',
      createdAt: new Date()
    });
    console.log('✅ Created appointments collection');

    // Waitlist placeholder
    await db.collection('waitlist').doc('_placeholder').set({
      _note: 'This is a placeholder. Delete when first real waitlist entry is created.',
      createdAt: new Date()
    });
    console.log('✅ Created waitlist collection');

    // Reviews placeholder
    await db.collection('reviews').doc('_placeholder').set({
      _note: 'This is a placeholder. Delete when first real review is created.',
      createdAt: new Date()
    });
    console.log('✅ Created reviews collection');

    // Gallery placeholder
    await db.collection('gallery').doc('_placeholder').set({
      _note: 'This is a placeholder. Delete when first real image is uploaded.',
      createdAt: new Date()
    });
    console.log('✅ Created gallery collection');

    // Notifications placeholder
    await db.collection('notifications').doc('_placeholder').set({
      _note: 'This is a placeholder. Delete when first real notification is sent.',
      createdAt: new Date()
    });
    console.log('✅ Created notifications collection');

    // Statistics placeholder
    await db.collection('statistics').doc('_placeholder').set({
      _note: 'This is a placeholder. Delete when first real stats are collected.',
      createdAt: new Date()
    });
    console.log('✅ Created statistics collection');

    console.log('\n🎉 All collections created successfully!');
    console.log('\n📝 Note: These are placeholder documents.');
    console.log('   They will be automatically replaced when real data is added.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating collections:', error);
    process.exit(1);
  }
}

createEmptyCollections();

