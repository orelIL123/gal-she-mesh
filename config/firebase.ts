import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCdwwaXzbb-BvME7dd1OICgvkVr6ee_0tU",
  authDomain: "gal-shemesh.firebaseapp.com",
  projectId: "gal-shemesh",
  storageBucket: "gal-shemesh.firebasestorage.app",
  messagingSenderId: "1007787228112",
  appId: "1:1007787228112:android:43b4cce0387c46fdffd7d5"
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
    // Initialize with AsyncStorage persistence using getReactNativePersistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
    console.log('✅ Firebase Auth: Initialized with AsyncStorage persistence');
  } catch (error: any) {
    // If auth already initialized, get the existing instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
      console.log('✅ Firebase Auth: Using existing auth instance');
    } else {
      console.warn('⚠️ Firebase Auth: InitializeAuth failed, falling back to getAuth:', error);
      auth = getAuth(app);
    }
  }
} else {
  // For web - use default persistence
  auth = getAuth(app);
  console.log('✅ Firebase Auth: Initialized for web');
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export default app;