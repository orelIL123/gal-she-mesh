import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBiDFQNbnExTE03YS_6xoNE6_RrX4HBN4Q",
  authDomain: "barber-app-template.firebaseapp.com",
  projectId: "barber-app-template",
  storageBucket: "barber-app-template.firebasestorage.app",
  messagingSenderId: "246646930767",
  appId: "1:246646930767:web:d1bdd3b156eda443f2193a",
  measurementId: "G-S6VSPNP5LH"
};

// Initialize Firebase App
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase: App initialized');
} else {
  app = getApp();
  console.log('🔥 Firebase: Using existing app');
}

// Initialize Firebase Auth with proper React Native persistence
let auth: Auth;

if (Platform.OS !== 'web') {
  // For React Native - use persistence with AsyncStorage
  try {
    // Try to initialize with AsyncStorage persistence
    auth = initializeAuth(app, {
      // Use AsyncStorage directly - this should work with Firebase v11
      persistence: [
        // @ts-ignore - Firebase may not have full TypeScript support for this
        {
          type: 'asyncStorage',
          storage: ReactNativeAsyncStorage
        }
      ] as any
    });
    console.log('✅ Firebase Auth: Initialized with AsyncStorage persistence');
  } catch (error) {
    console.warn('⚠️ Firebase Auth: InitializeAuth failed, falling back to getAuth:', error);
    auth = getAuth(app);
  }
} else {
  // For web - use default persistence
  auth = getAuth(app);
  console.log('✅ Firebase Auth: Initialized for web');
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;