/**
 * Firebase Initialization Script
 * Run this once to set up initial users and menu items in Firestore
 * 
 * Usage:
 * 1. Open browser console on your app
 * 2. Copy/paste this entire file content
 * 3. Run: initializeFirebase()
 */

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, writeBatch, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { INITIAL_MENU, DEFAULT_FOOD_IMAGE } from "../constants";

/**
 * Initialize default staff users
 */
export const initializeStaffUsers = async () => {
  const users = [
    { email: 'admin@joe.com', password: 'admin123', name: 'JOE Admin', role: 'admin' },
    { email: 'cashier@joe.com', password: 'cashier123', name: 'Cashier Node', role: 'cashier' },
    { email: 'server@joe.com', password: 'server123', name: 'Server Node', role: 'server' }
  ];

  const results = [];

  for (const userData of users) {
    try {
      // Check if user already exists
      try {
        // Try to sign in first to check if exists
        const existingUser = await signInWithEmailAndPassword(auth, userData.email, userData.password);
        console.log(`✅ User ${userData.email} already exists`);
        
        // Update profile in Firestore
        await setDoc(doc(db, "users", existingUser.user.uid), {
          uid: existingUser.user.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          active: true,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        }, { merge: true });
        
        results.push({ email: userData.email, status: 'updated', uid: existingUser.user.uid });
      } catch (error: any) {
        // User doesn't exist, create new
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
          
          // Create user profile in Firestore
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            active: true,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp()
          });
          
          console.log(`✅ Created user: ${userData.email} (${userData.role})`);
          results.push({ email: userData.email, status: 'created', uid: userCredential.user.uid });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error(`❌ Failed to create user ${userData.email}:`, error.message);
      results.push({ email: userData.email, status: 'error', error: error.message });
    }
  }

  return results;
};

/**
 * Initialize menu items from constants
 */
export const initializeMenuItems = async () => {
  try {
    // Check if menu already exists
    const menuSnapshot = await getDocs(collection(db, "menu"));
    
    if (!menuSnapshot.empty) {
      console.log(`✅ Menu already initialized (${menuSnapshot.size} items)`);
      return { status: 'exists', count: menuSnapshot.size };
    }

    // Initialize menu with batch write
    const batch = writeBatch(db);
    
    INITIAL_MENU.forEach(item => {
      const menuRef = doc(db, "menu", item.id);
      batch.set(menuRef, {
        ...item,
        imageUrl: item.imageUrl || DEFAULT_FOOD_IMAGE
      });
    });

    await batch.commit();
    console.log(`✅ Initialized ${INITIAL_MENU.length} menu items`);
    
    // Initialize inventory for each menu item
    const inventoryBatch = writeBatch(db);
    INITIAL_MENU.forEach(item => {
      const invRef = doc(db, "inventory", item.id);
      inventoryBatch.set(invRef, {
        itemId: item.id,
        itemName: item.name,
        openingStock: 100,
        consumed: 0,
        category: item.category,
        lastUpdated: serverTimestamp()
      });
    });
    
    await inventoryBatch.commit();
    console.log(`✅ Initialized inventory for ${INITIAL_MENU.length} items`);
    
    return { status: 'created', count: INITIAL_MENU.length };
  } catch (error: any) {
    console.error('❌ Failed to initialize menu:', error.message);
    throw error;
  }
};

/**
 * Initialize system settings
 */
export const initializeSettings = async () => {
  try {
    const settingsRef = doc(db, "settings", "global");
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      console.log('✅ Settings already exist');
      return { status: 'exists' };
    }

    await setDoc(settingsRef, {
      isMaintenanceMode: false,
      acceptingOrders: true,
      announcement: "JOE: New Indian Breakfast Catalog is now LIVE!",
      taxRate: 5,
      minOrderValue: 20,
      peakHourThreshold: 50,
      autoSettlementEnabled: true,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Initialized system settings');
    return { status: 'created' };
  } catch (error: any) {
    console.error('❌ Failed to initialize settings:', error.message);
    throw error;
  }
};

/**
 * Run full initialization
 */
export const initializeFirebase = async () => {
  console.log('🚀 Starting Firebase initialization...');
  
  try {
    const [users, menu, settings] = await Promise.all([
      initializeStaffUsers(),
      initializeMenuItems(),
      initializeSettings()
    ]);

    console.log('✅ Firebase initialization complete!');
    console.log('Users:', users);
    console.log('Menu:', menu);
    console.log('Settings:', settings);

    return {
      success: true,
      users,
      menu,
      settings
    };
  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

