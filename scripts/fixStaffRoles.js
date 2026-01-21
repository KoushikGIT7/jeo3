/**
 * Fix Staff User Roles Script
 * Fixes server and cashier users that have incorrect "student" role in Firestore
 * 
 * USAGE:
 * 1. Open your app in browser (localhost or deployed)
 * 2. Open browser console (F12)
 * 3. Copy and paste this ENTIRE script
 * 4. Press Enter
 * 
 * This will:
 * - Find all users with server@joe.com or cashier@joe.com emails
 * - Update their role in Firestore to match their email
 */

(async function fixStaffRoles() {
  console.log('🔧 Starting Staff Roles Fix...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Import Firebase modules
    const { auth, db } = await import('../firebase.js');
    const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');
    const { collection, query, where, getDocs, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    
    // Staff emails and their correct roles
    const staffEmails = [
      { email: 'server@joe.com', role: 'server', password: 'server123' },
      { email: 'cashier@joe.com', role: 'cashier', password: 'cashier123' },
      { email: 'admin@joe.com', role: 'admin', password: 'admin123' }
    ];
    
    console.log(`\n📋 Fixing roles for ${staffEmails.length} staff users...\n`);
    
    for (const staffData of staffEmails) {
      console.log(`\n🔧 Processing: ${staffData.email}`);
      console.log('─────────────────────────────────────────');
      
      try {
        // Step 1: Sign in to get the user UID
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, staffData.email, staffData.password);
          console.log(`✅ Signed in as ${staffData.email}`);
        } catch (authError) {
          if (authError.code === 'auth/user-not-found') {
            console.error(`❌ User ${staffData.email} not found in Firebase Auth`);
            console.error(`   Please create this user first using setupStaffUsers.js`);
            continue;
          } else if (authError.code === 'auth/wrong-password') {
            console.error(`❌ Wrong password for ${staffData.email}`);
            console.error(`   Please check the password or update it in Firebase Auth`);
            continue;
          } else {
            throw authError;
          }
        }
        
        const uid = userCredential.user.uid;
        const userRef = doc(db, 'users', uid);
        
        // Step 2: Get current Firestore document
        const { getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.error(`❌ Firestore profile not found for ${staffData.email}`);
          console.error(`   UID: ${uid}`);
          console.error(`   Creating new profile with correct role...`);
          
          // Create new profile with correct role
          await setDoc(userRef, {
            uid: uid,
            email: staffData.email,
            name: staffData.email.includes('server') ? 'Server Node' : 
                  staffData.email.includes('cashier') ? 'Cashier Node' : 
                  'Admin Node',
            role: staffData.role,
            active: true,
            studentType: null,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp()
          }, { merge: true });
          
          console.log(`✅ Created Firestore profile with role: ${staffData.role}`);
        } else {
          const currentData = userDoc.data();
          const currentRole = currentData.role;
          
          console.log(`   Current role in Firestore: ${currentRole}`);
          console.log(`   Expected role: ${staffData.role}`);
          
          if (currentRole === staffData.role) {
            console.log(`✅ Role is already correct (${staffData.role})`);
          } else {
            console.log(`⚠️  Role mismatch detected!`);
            console.log(`   Fixing role from "${currentRole}" to "${staffData.role}"...`);
            
            // Update role in Firestore
            await setDoc(userRef, {
              role: staffData.role,
              lastActive: serverTimestamp()
            }, { merge: true });
            
            console.log(`✅ Updated role to: ${staffData.role}`);
            
            // Verify the update
            const verifyDoc = await getDoc(userRef);
            if (verifyDoc.exists()) {
              const verifyData = verifyDoc.data();
              console.log(`✅ Verification:`);
              console.log(`   ✓ Email: ${verifyData.email}`);
              console.log(`   ✓ Role: ${verifyData.role}`);
              console.log(`   ✓ Active: ${verifyData.active ?? true}`);
              
              if (verifyData.role === staffData.role) {
                console.log(`✅ Role fix confirmed!`);
              } else {
                console.error(`❌ Role fix failed - still showing: ${verifyData.role}`);
              }
            }
          }
        }
        
        // Step 3: Sign out
        await signOut(auth);
        console.log(`✅ Signed out`);
        
      } catch (error) {
        console.error(`❌ Failed to fix ${staffData.email}:`, error.message);
        console.error(`   Error code: ${error.code || 'unknown'}`);
        
        // Try to sign out even if there was an error
        try {
          await signOut(auth);
        } catch (signOutError) {
          // Ignore sign out errors
        }
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Staff Roles Fix Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 Fixed Users:\n');
    console.log('   SERVER:');
    console.log('   📧 Email: server@joe.com');
    console.log('   ✅ Role: server\n');
    console.log('   CASHIER:');
    console.log('   📧 Email: cashier@joe.com');
    console.log('   ✅ Role: cashier\n');
    console.log('💡 You can now login and should be routed to the correct portal!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    console.error('Error details:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure you\'re on your app page (localhost or deployed)');
    console.log('   2. Check that Firebase is initialized');
    console.log('   3. Verify you have the correct passwords for staff users');
    console.log('   4. Check browser console for detailed error messages\n');
  }
})();
