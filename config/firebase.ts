import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBKq7PdSIhnBfAwBo1kHZNTwp_TqRIZKe4",
  authDomain: "naor-amar.firebaseapp.com",
  projectId: "naor-amar",
  storageBucket: "naor-amar.firebasestorage.app",
  messagingSenderId: "9527955029",
  appId: "1:9527955029:ios:86a2878d06221e119d4edc"
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
export const functions = getFunctions(app);
export default app;