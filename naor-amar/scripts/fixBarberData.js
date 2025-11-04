/**
 * Fix Barber Data - Update Ron Turgeman to Naor Amar
 * This script finds and updates any Ron Turgeman entries to Naor Amar
 * 
 * Usage: node scripts/fixBarberData.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixBarberData() {
  console.log('🔧 Fixing Barber Data - Ron Turgeman → Naor Amar\n');
  
  try {
    // Get all barbers
    const barbersSnapshot = await db.collection('barbers').get();
    
    console.log(`📊 Found ${barbersSnapshot.size} barber(s) in database\n`);
    
    let fixedCount = 0;
    
    for (const doc of barbersSnapshot.docs) {
      const data = doc.data();
      const barberId = doc.id;
      
      console.log(`Checking barber: ${barberId}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Phone: ${data.phone || 'N/A'}`);
      
      // Check if this is Ron Turgeman
      const needsFix = 
        data.name?.includes('רון') ||
        data.name?.includes('תורג') ||
        data.name?.toLowerCase().includes('ron') ||
        data.name?.toLowerCase().includes('turg') ||
        data.phone === '054-228-0222' ||
        data.phone === '+972542280222' ||
        data.phoneE164 === '+972542280222';
      
      if (needsFix) {
        console.log(`  ⚠️  Needs fixing! Updating to Naor Amar...`);
        
        await db.collection('barbers').doc(barberId).update({
          name: 'Naor Amar',
          phone: '+9720532706369',
          phoneE164: '+9720532706369',
          specialization: 'תספורת גברים',
          experience: 10,
          bio: 'ספר מקצועי עם 10 שנות ניסיון',
          updatedAt: new Date()
        });
        
        console.log(`  ✅ Updated successfully!`);
        fixedCount++;
      } else if (data.name === 'Naor Amar') {
        console.log(`  ✅ Already correct - Naor Amar`);
      } else {
        console.log(`  ℹ️  Other barber - no changes needed`);
      }
      console.log('');
    }
    
    console.log(`\n🎉 Fix complete!`);
    console.log(`   Fixed: ${fixedCount} barber(s)`);
    console.log(`   Total barbers: ${barbersSnapshot.size}`);
    
    // Show final state
    console.log('\n📋 Current barbers in database:');
    const finalSnapshot = await db.collection('barbers').get();
    finalSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.phone || 'no phone'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing barber data:', error);
    process.exit(1);
  }
}

fixBarberData();

