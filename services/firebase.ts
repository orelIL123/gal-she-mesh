import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { generateTimeSlots, isValidDuration, SLOT_SIZE_MINUTES } from '../app/constants/scheduling';
import { auth, db, storage } from '../config/firebase';
import { AuthStorageService } from './authStorage';
import { CacheUtils } from './cache';
// Removed ImageOptimizer import - using simple upload only

// Export db for use in other components
export { db };

// Create admin user function for development/first setup
export const createAdminUser = async (email: string, password: string, displayName: string, phone: string): Promise<boolean> => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create admin profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: email,
      displayName: displayName,
      phone: phone,
      isAdmin: true, // Make this user an admin
      createdAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // Save auth data for persistence
    await saveAuthDataAfterLogin(user);

    console.log('Admin user created successfully:', email);
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
};

// Make current logged-in user an admin (for development)
// Check if current user is admin and has push token
export const checkCurrentUserAdminStatus = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log('❌ No current user');
      return false;
    }
    
    const profile = await getUserProfile(currentUser.uid);
    if (!profile) {
      console.log('❌ No user profile found');
      return false;
    }
    
    console.log(`👤 Current user: ${profile.displayName}`);
    console.log(`👨‍💼 Is admin: ${profile.isAdmin || false}`);
    console.log(`📱 Has push token: ${!!profile.pushToken}`);
    
    return {
      isAdmin: profile.isAdmin || false,
      hasPushToken: !!profile.pushToken,
      profile: profile
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const makeCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('לא מחובר משתמש');
    }

    // Check if user profile exists, if not create it
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create user profile if it doesn't exist
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || 'Admin User',
        phone: currentUser.phoneNumber || '',
        isAdmin: true,
        createdAt: Timestamp.now(),
      };
      await setDoc(userDocRef, newProfile);
      console.log('Created new admin profile for:', currentUser.uid);
    } else {
      // Update existing user profile to be admin
      await updateDoc(userDocRef, {
        isAdmin: true
      });
      console.log('Updated existing user to admin:', currentUser.uid);
    }

    return true;
  } catch (error) {
    console.error('Error making current user admin:', error);
    return false;
  }
};


export interface UserProfile {
  uid: string;
  email?: string; // Make email optional for phone auth
  displayName: string;
  phone: string;
  profileImage?: string;
  isAdmin?: boolean;
  hasPassword?: boolean; // Added for phone auth with password
  createdAt: Timestamp;
  pushToken?: string; // Added for push notifications
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isActive: boolean;
  stock?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Barber {
  id: string;
  name: string;
  image: string;
  specialties: string[];
  experience: string;
  rating: number;
  available: boolean;
  pricing?: { [treatmentId: string]: number }; // Custom pricing per treatment
  phone?: string; // Phone number for contact
  photoUrl?: string; // Photo URL for profile image
  bio?: string; // Biography description
}

export interface Treatment {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  image: string;
}

export interface Appointment {
  id: string;
  userId: string;
  barberId: string;
  treatmentId: string;
  date: Timestamp;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Timestamp;
  duration: number; // משך טיפול בדקות
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  type: 'gallery' | 'background' | 'splash' | 'aboutus';
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface BarberAvailability {
  id: string;
  barberId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  isAvailable: boolean;
  createdAt: Timestamp;
}

export interface AppSettings {
  id: string;
  key: string;
  value: any;
  updatedAt: Timestamp;
}

// Auth functions
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Save auth data for persistence
    await saveAuthDataAfterLogin(userCredential.user);

    // Register for push notifications after successful login
    await registerForPushNotifications(userCredential.user.uid);

    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (email: string, password: string, displayName: string, phone: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Check if this is the admin email
    const isAdminEmail = email === 'orel895@gmail.com';
    
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: displayName,
      phone: phone,
      isAdmin: isAdminEmail, // Automatically set admin for specific email
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);

    // Save auth data for persistence
    await saveAuthDataAfterLogin(user);

    // Register for push notifications after successful registration
    await registerForPushNotifications(user.uid);
    
    // Send welcome notification
    await sendWelcomeNotification(user.uid);
    
    // Send notification to admin about new user
    try {
      await sendNewUserNotificationToAdmin(displayName, email);
    } catch (adminNotificationError) {
      console.log('Failed to send new user notification to admin:', adminNotificationError);
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    // Clear stored auth data - מסונן לפי prefix
    await AuthStorageService.clearAuthData(); // מסונן לפי prefix
    await signOut(auth);
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('❌ Error during logout:', error);
    throw error;
  }
};

// Helper function to save auth data after successful login
const saveAuthDataAfterLogin = async (user: User) => {
  try {
    console.log('🔄 Starting to save auth data for user:', user.uid);
    const userProfile = await getUserProfile(user.uid);
    if (userProfile) {
      const authData = {
        uid: user.uid,
        email: user.email || undefined,
        phoneNumber: user.phoneNumber || userProfile.phone,
        displayName: user.displayName || userProfile.displayName,
        isAdmin: userProfile.isAdmin || false,
        lastLoginAt: new Date().toISOString(),
        savedCredentials: {
          email: user.email || undefined,
          phoneNumber: user.phoneNumber || userProfile.phone,
          hasPassword: true
          // Note: We don't save password here for security reasons
          // Password should be saved separately when user explicitly chooses to
        }
      };
      
      console.log('💾 Saving auth data:', {
        uid: authData.uid,
        email: authData.email,
        phoneNumber: authData.phoneNumber,
        displayName: authData.displayName,
        isAdmin: authData.isAdmin,
        savedCredentials: authData.savedCredentials
      });
      
      await AuthStorageService.saveAuthData(authData);
      console.log('✅ Auth data saved successfully');
    } else {
      console.log('❌ No user profile found for user:', user.uid);
    }
  } catch (error) {
    console.error('❌ Error saving auth data:', error);
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Get saved login credentials
export const getSavedLoginCredentials = async () => {
  try {
    return await AuthStorageService.getSavedCredentials();
  } catch (error) {
    console.error('Error getting saved credentials:', error);
    return null;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Phone authentication functions
export const sendSMSVerification = async (phoneNumber: string) => {
  try {
    // Format phone number for SMS service
    let formattedPhone = phoneNumber;
    
    // Add +972 prefix if not present
    if (!phoneNumber.startsWith('+')) {
      if (phoneNumber.startsWith('0')) {
        formattedPhone = '+972' + phoneNumber.substring(1);
      } else {
        formattedPhone = '+972' + phoneNumber;
      }
    }
    
    console.log('📱 Sending SMS to:', formattedPhone);
    
    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = `sms4free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use SMS4Free service
    const { MessagingService } = await import('../app/services/messaging/service');
    const { messagingConfig } = await import('../app/config/messaging');

    const messagingService = new MessagingService(messagingConfig);

    const smsMessage = `קוד האימות שלך: ${verificationCode}\nתוקף 10 דקות\n- רון תורגמן מספרה`;

    const result = await messagingService.sendMessage({
      to: formattedPhone,
      message: smsMessage
    });

    if (result.success) {
      console.log('✅ SMS sent successfully via SMS4Free');

      // Store verification code in AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const verificationData = {
        code: verificationCode,
        phone: formattedPhone,
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(`verification_${verificationId}`, JSON.stringify(verificationData));
      console.log('💾 Verification data stored for ID:', verificationId);
      console.log('💾 Stored data:', verificationData);

      return { verificationId };
    } else {
      console.error('❌ SMS4Free error:', result.error);
      throw new Error(`Failed to send SMS: ${result.error}`);
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

export const verifySMSCode = async (verificationId: string, verificationCode: string) => {
  try {
    // Handle SMS4Free verification
    if (verificationId.startsWith('sms4free_')) {
      console.log('🔧 Verifying SMS4Free code for ID:', verificationId);

      // Get stored verification data from AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      // Debug: List all keys in AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔍 All AsyncStorage keys:', allKeys);
      console.log('🔍 Looking for key:', `verification_${verificationId}`);

      const storedData = await AsyncStorage.getItem(`verification_${verificationId}`);

      if (!storedData) {
        console.error('❌ Verification ID not found in storage:', verificationId);
        console.error('❌ Available keys:', allKeys);
        throw new Error('Verification ID not found or expired');
      }

      const verificationData = JSON.parse(storedData);
      console.log('📱 Retrieved verification data:', {
        storedCode: verificationData.code,
        enteredCode: verificationCode,
        phone: verificationData.phone
      });

      // Check if verification code matches
      if (verificationData.code !== verificationCode) {
        console.error('❌ Code mismatch:', { stored: verificationData.code, entered: verificationCode });
        throw new Error('Invalid verification code');
      }

      // Check if verification is not expired (10 minutes)
      const now = Date.now();
      const verificationAge = now - verificationData.timestamp;
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

      if (verificationAge > tenMinutes) {
        // Clean up expired verification
        await AsyncStorage.removeItem(`verification_${verificationId}`);
        console.error('❌ Verification expired:', { age: verificationAge, limit: tenMinutes });
        throw new Error('Verification code expired');
      }

      console.log('✅ SMS4Free verification successful');

      // For login purposes, try to find and log in the existing user
      try {
        const existingUser = await findUserByPhoneNumber(verificationData.phone);
        if (existingUser) {
          console.log('📞 Found existing user for phone:', verificationData.phone);

          // Sign in with the existing user's email and temp password
          if (existingUser.email) {
            // For temp email users, we need to handle login differently
            // Just clean up and return success - the login screen will handle navigation
            await AsyncStorage.removeItem(`verification_${verificationId}`);
            return {
              sms4freeVerified: true,
              phone: verificationData.phone,
              existingUser: existingUser
            };
          }
        }
      } catch (error) {
        console.log('🔍 No existing user found, this is for registration');
      }

      // Don't clean up verification yet - let registerUserWithPhone handle it
      // This allows for retry in case of registration failure

      // Return verification success indicator
      return {
        sms4freeVerified: true,
        phone: verificationData.phone,
        verificationData: verificationData  // Pass the data for later cleanup
      };
    }

    // Handle legacy mock verification
    if (verificationId.startsWith('mock_verification_')) {
      console.log('🔧 Using mock SMS verification');

      if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
        console.log('✅ Mock SMS verification successful');
        return { mockUser: true };
      } else {
        throw new Error('Invalid verification code format');
      }
    }

    // Real Firebase verification (for when you set up proper Firebase phone auth)
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const result = await signInWithCredential(auth, credential);

    // Save auth data for persistence
    await saveAuthDataAfterLogin(result.user);

    return result.user;
  } catch (error) {
    console.error('Error verifying SMS code:', error);
    throw error;
  }
};

export const registerUserWithPhone = async (phoneNumber: string, displayName: string, verificationId: string, verificationCode: string, password: string) => {
  try {
    // Verify the SMS code first
    const verificationResult = await verifySMSCode(verificationId, verificationCode);
    if (!verificationResult) {
      throw new Error('SMS verification failed');
    }

    // Handle SMS4Free registration
    if (verificationId.startsWith('sms4free_')) {
      console.log('🔧 Using SMS4Free phone registration');

      // Create a temporary email for Firebase Auth (since Anonymous is not enabled)
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      // Use consistent format: 972523985505@ronbarber.app
      const tempEmail = `972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}@ronbarber.app`;
      // Use the password chosen by the user, not a temporary one
      const userPassword = password;

      console.log('📧 Creating user with temporary email:', tempEmail);

      // Create Firebase Auth user with the user's chosen password
      const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, userPassword);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, {
        displayName: displayName
      });

      // Check if this is the admin phone number
      const isAdminPhone = phoneNumber === '+972523985505' || phoneNumber === '+972542280222';

      const userProfile: UserProfile = {
        uid: user.uid,  // Use Firebase Auth UID
        email: tempEmail, // Store the temporary email
        displayName: displayName,
        phone: phoneNumber,
        isAdmin: isAdminPhone,
        hasPassword: true, // Has a temporary password
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Save auth data for persistence
      await saveAuthDataAfterLogin(user);

      console.log('✅ SMS4Free user registered successfully with temp email auth');

      // Clean up verification data after successful registration
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(`verification_${verificationId}`);
      console.log('🧹 Verification data cleaned up after successful registration');

      // Send notification to admins about new user registration
      try {
        await sendNotificationToAdmin(
          'משתמש חדש נרשם! 🎉',
          `${displayName} נרשם לאפליקציה עם מספר ${phoneNumber}`
        );
        console.log('✅ Admin notification sent for new user registration');
      } catch (error) {
        console.error('❌ Error sending admin notification:', error);
        // Don't fail registration if notification fails
      }

      // Return the Firebase Auth user object
      return user;
    }

    // Handle legacy mock verification
    if (verificationId.startsWith('mock_verification_')) {
      console.log('🔧 Using mock phone registration');

      const mockUserId = `mock_user_${Date.now()}`;
      const isAdminPhone = phoneNumber === '+972542280222';

      const userProfile: UserProfile = {
        uid: mockUserId,
        displayName: displayName,
        phone: phoneNumber,
        isAdmin: isAdminPhone,
        hasPassword: false,
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'users', mockUserId), userProfile);
      console.log('✅ Mock user registered successfully');

      // Send notification to admins about new user registration
      try {
        await sendNotificationToAdmin(
          'משתמש חדש נרשם! 🎉',
          `${displayName} נרשם לאפליקציה עם מספר ${phoneNumber}`
        );
        console.log('✅ Admin notification sent for new mock user registration');
      } catch (error) {
        console.error('❌ Error sending admin notification:', error);
        // Don't fail registration if notification fails
      }

      return {
        uid: mockUserId,
        displayName: displayName,
        phoneNumber: phoneNumber
      };
    }

    // Real Firebase registration
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;
    
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Check if this is the admin phone number
    const isAdminPhone = phoneNumber === '+972523985505' || phoneNumber === '+972542280222';
    
    const userProfile: UserProfile = {
      uid: user.uid,
      displayName: displayName,
      phone: phoneNumber,
      isAdmin: isAdminPhone,
      hasPassword: false,
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);

    // Save auth data for persistence
    await saveAuthDataAfterLogin(user);

    // Send notification to admins about new user registration
    try {
      await sendNotificationToAdmin(
        'משתמש חדש נרשם! 🎉',
        `${displayName} נרשם לאפליקציה עם מספר ${phoneNumber}`
      );
      console.log('✅ Admin notification sent for new Firebase user registration');
    } catch (error) {
      console.error('❌ Error sending admin notification:', error);
      // Don't fail registration if notification fails
    }
    
    return user;
  } catch (error) {
    console.error('Error registering user with phone:', error);
    throw error;
  }
};

// Find user by phone number
export const findUserByPhoneNumber = async (phoneNumber: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phoneNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as UserProfile;

    return userData;
  } catch (error) {
    console.error('Error finding user by phone:', error);
    return null;
  }
};

// New function to check if phone user exists and has password
export const checkPhoneUserExists = async (phoneNumber: string): Promise<{ exists: boolean; hasPassword: boolean; uid?: string }> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`📞 No user found with phone: ${phoneNumber}`);
      return { exists: false, hasPassword: false };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`📞 User found - Phone: ${phoneNumber}, hasPassword: ${userData.hasPassword || false}, UID: ${userDoc.id}`);
    
    return {
      exists: true,
      hasPassword: userData.hasPassword || false,
      uid: userDoc.id
    };
  } catch (error) {
    console.error('Error checking phone user:', error);
    return { exists: false, hasPassword: false };
  }
};

// New function to set password for existing SMS users
export const setPasswordForSMSUser = async (phoneNumber: string, password: string) => {
  try {
    const userCheck = await checkPhoneUserExists(phoneNumber);
    if (!userCheck.exists) {
      throw new Error('משתמש לא נמצא');
    }

    // Create email from phone number for Firebase Auth
    const tempEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.turgi.com`;
    
    try {
      // Try to create user with temp email and password
      const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, password);
      
      // Update user profile to link to existing user data
      const userDocRef = doc(db, 'users', userCheck.uid!);
      await updateDoc(userDocRef, {
        hasPassword: true,
        email: tempEmail,
        authUid: userCredential.user.uid
      });
      
      // Save auth data for persistence
      await saveAuthDataAfterLogin(userCredential.user);

      console.log(`✅ Password set for SMS user: ${phoneNumber}`);
      return userCredential.user;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // Email already exists, just update the user profile
        await updateDoc(doc(db, 'users', userCheck.uid!), {
          hasPassword: true
        });
        
        // Try to sign in with existing credentials
        const userCredential = await signInWithEmailAndPassword(auth, tempEmail, password);

        // Save auth data for persistence
        await saveAuthDataAfterLogin(userCredential.user);

        return userCredential.user;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error setting password for SMS user:', error);
    throw error;
  }
};

// Simple function to login with phone + password
export const loginWithPhoneAndPassword = async (phoneNumber: string, password: string) => {
  try {
    console.log(`🔐 Attempting login with phone: ${phoneNumber}`);
    
    // Skip phone check due to permissions - try direct login with email formats
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const possibleEmails = [
      `972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}@ronbarber.app`, // Most common format
      `${cleanPhone}@ronbarber.app`,
      `${cleanPhone}@sms.barbershop.local`, // New SMS format
      `972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}@sms.barbershop.local`
    ];
    
    console.log(`🔍 Trying email formats for login:`, possibleEmails);
    
    // Try each possible email format
    for (const email of possibleEmails) {
      try {
        console.log(`🔐 Trying email format: ${email}`);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(`✅ Login successful with email: ${email}`);

        // Save auth data for persistence
        await saveAuthDataAfterLogin(userCredential.user);

        return userCredential.user;
      } catch (error: any) {
        console.log(`❌ Failed with email: ${email}`, error.code);
        continue;
      }
    }
    
    throw new Error('פרטי הכניסה שגויים או המשתמש לא נמצא');
    
  } catch (error: any) {
    console.error('Error login with phone and password:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('משתמש לא נמצא במערכת ההזדהות');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('סיסמה שגויה');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('פרטי הכניסה שגויים');
    }
    
    throw error;
  }
};

// New function to set password for phone user
export const setPasswordForPhoneUser = async (phoneNumber: string, password: string) => {
  try {
    const userCheck = await checkPhoneUserExists(phoneNumber);
    if (!userCheck.exists) {
      throw new Error('משתמש לא נמצא');
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('משתמש לא מחובר');
    }

    // Create email from phone number for Firebase Auth
    const email = `${phoneNumber.replace(/[^0-9]/g, '')}@phonesign.local`;
    
    // Link email/password credential to existing phone user
    const emailCredential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(currentUser, emailCredential);
    
    // Update user profile
    const userProfile = await getUserProfile(userCheck.uid!);
    if (userProfile) {
      await updateUserProfile(userCheck.uid!, {
        ...userProfile,
        email: email,
        hasPassword: true
      });
    }

    return true;
  } catch (error) {
    console.error('Error setting password for phone user:', error);
    throw error;
  }
};

export const loginWithPhone = async (phoneNumber: string, verificationId: string, verificationCode: string) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const userCredential = await signInWithCredential(auth, credential);

    // Save auth data for persistence
    await saveAuthDataAfterLogin(userCredential.user);

    return userCredential.user;
  } catch (error) {
    console.error('Error logging in with phone:', error);
    throw error;
  }
};

// User profile functions
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, updates);
  } catch (error) {
    throw error;
  }
};

// Get all users for admin
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        uid: doc.id,
        ...doc.data()
      } as UserProfile);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Barbers functions
export const getBarbers = async (useCache: boolean = false): Promise<Barber[]> => {
  try {
    // DISABLE cache for barbers to ensure fresh data
    console.log('🔄 Loading fresh barber data (no cache)');

    const querySnapshot = await getDocs(collection(db, 'barbers'));
    const barbers: Barber[] = [];
    
    querySnapshot.forEach((doc) => {
      const barberData = { id: doc.id, ...doc.data() } as Barber;
      // ONLY show Ron Turgeman - be very strict
      const name = barberData.name?.toLowerCase() || '';
      if (name.includes('רון') || 
          name.includes('ron') || 
          name.includes('תורג') || 
          name.includes('turg') ||
          barberData.id === 'ron-turgeman' ||
          barberData.name === 'רון תורג׳מן' ||
          barberData.name === 'Ron Turgeman') {
        barbers.push(barberData);
      }
    });

    // If no Ron found, create a default one
    if (barbers.length === 0) {
      console.log('🔧 No Ron found, creating default barber');
      const defaultRon: Barber = {
        id: 'ron-turgeman-default',
        name: 'רון תורג׳מן',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
        specialties: ['תספורת גברים', 'עיצוב זקן', 'תספורת ילדים'],
        experience: '10+ שנות ניסיון',
        rating: 5,
        available: true,
        pricing: {},
        phone: '+972542280222',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'
      };
      barbers.push(defaultRon);
    }
    
    console.log('✅ Returning', barbers.length, 'barber(s): Ron Turgeman only');
    
    return barbers;
  } catch (error) {
    console.error('Error getting barbers:', error);
    return [];
  }
};

export const getBarber = async (barberId: string): Promise<Barber | null> => {
  try {
    const docRef = doc(db, 'barbers', barberId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Barber;
    }
    return null;
  } catch (error) {
    console.error('Error getting barber:', error);
    return null;
  }
};

// Treatments functions
export const getTreatments = async (useCache: boolean = true): Promise<Treatment[]> => {
  try {
    // Try cache first if enabled
    if (useCache) {
      const cached = await CacheUtils.getTreatments();
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('📦 Treatments loaded from cache');
        return cached;
      }
    }

    const querySnapshot = await getDocs(collection(db, 'treatments'));
    const treatments: Treatment[] = [];
    
    querySnapshot.forEach((doc) => {
      treatments.push({
        id: doc.id,
        ...doc.data()
      } as Treatment);
    });
    
    // Cache the results for 60 minutes
    if (useCache) {
      await CacheUtils.setTreatments(treatments, 60);
      console.log('💾 Treatments cached for 60 minutes');
    }
    
    return treatments;
  } catch (error) {
    console.error('Error getting treatments:', error);
    return [];
  }
};

// Appointments functions
export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
  try {
    // Validate duration is a multiple of 25 minutes
    if (appointmentData.duration && !isValidDuration(appointmentData.duration)) {
      throw new Error(`Duration must be a multiple of ${SLOT_SIZE_MINUTES} minutes. Got: ${appointmentData.duration} minutes`);
    }
    
    const appointment = {
      ...appointmentData,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'appointments'), appointment);
    console.log('Appointment created with ID:', docRef.id);
    
    // Send notification to user about new appointment
    try {
      const dateVal: any = appointmentData.date as any;
      const asDate = typeof dateVal?.toDate === 'function' ? dateVal.toDate() : new Date(dateVal);
      const dateStr = asDate.toLocaleDateString('he-IL');
      await sendNotificationToUser(appointmentData.userId, 'תור חדש נוצר! 📅', `התור שלך נוצר בהצלחה. תאריך: ${dateStr}`, { appointmentId: docRef.id });
    } catch (notificationError) {
      console.log('Failed to send appointment notification:', notificationError);
    }
    
    // Send notification to admin about new appointment
    try {
      const dateVal: any = appointmentData.date as any;
      const asDate = typeof dateVal?.toDate === 'function' ? dateVal.toDate() : new Date(dateVal);
      const dateStr = asDate.toLocaleDateString('he-IL');
      await sendNotificationToAdmin('תור חדש! 📅', `תור חדש נוצר עבור ${dateStr}`, { appointmentId: docRef.id });
    } catch (adminNotificationError) {
      console.log('Failed to send admin notification:', adminNotificationError);
    }
    
    // Schedule reminder notifications for the appointment
    try {
      await scheduleAppointmentReminders(docRef.id, appointmentData);
    } catch (scheduleError) {
      console.log('Failed to schedule appointment reminders:', scheduleError);
    }
    
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    querySnapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    // Sort by date in JavaScript instead of Firestore
    appointments.sort((a, b) => {
      if (a.date && b.date) {
        const aTime = a.date.toMillis ? a.date.toMillis() : new Date(a.date as any).getTime();
        const bTime = b.date.toMillis ? b.date.toMillis() : new Date(b.date as any).getTime();
        return aTime - bTime;
      }
      return 0;
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting user appointments:', error);
    return [];
  }
};

export const updateAppointment = async (appointmentId: string, updates: Partial<Appointment>) => {
  try {
    const docRef = doc(db, 'appointments', appointmentId);
    await updateDoc(docRef, updates);
    
    // Send notification about appointment update
    try {
      const appointmentDoc = await getDoc(docRef);
      if (appointmentDoc.exists()) {
        const appointmentData = appointmentDoc.data() as Appointment;
        
        let notificationTitle = 'התור שלך עודכן! 📅';
        let notificationBody = 'התור שלך עודכן בהצלחה.';
        
        if (updates.status) {
          switch (updates.status) {
            case 'confirmed':
              notificationTitle = 'התור שלך אושר! ✅';
              notificationBody = 'התור שלך אושר בהצלחה.';
              // Send notification to admin about appointment confirmation
              try {
                await sendAppointmentConfirmationToAdmin(appointmentId);
              } catch (adminNotificationError) {
                console.log('Failed to send appointment confirmation to admin:', adminNotificationError);
              }
              break;
            case 'completed':
              notificationTitle = 'התור הושלם! 🎉';
              notificationBody = 'התור שלך הושלם בהצלחה.';
              // Send notification to admin about appointment completion
              try {
                await sendAppointmentCompletionToAdmin(appointmentId);
              } catch (adminNotificationError) {
                console.log('Failed to send appointment completion to admin:', adminNotificationError);
              }
              break;
            case 'cancelled':
              notificationTitle = 'התור בוטל! ❌';
              notificationBody = 'התור שלך בוטל.';
              break;
          }
        }
        
        await sendNotificationToUser(
          appointmentData.userId,
          notificationTitle,
          notificationBody,
          { appointmentId: appointmentId }
        );
      }
    } catch (notificationError) {
      console.log('Failed to send appointment update notification:', notificationError);
    }
  } catch (error) {
    throw error;
  }
};

// Cancel appointment for user (changes status to cancelled)
export const cancelAppointment = async (appointmentId: string) => {
  try {
    // Get appointment data before updating
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      throw new Error('התור לא נמצא');
    }
    
    const appointmentData = appointmentDoc.data() as Appointment;
    
    // Update appointment status to cancelled
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status: 'cancelled',
      cancelledAt: Timestamp.now()
    });
    
    // Send notification to admin about cancellation
    try {
      console.log('🔔 Sending cancellation notification to admin...');
      await sendNotificationToAdmin(
        'תור בוטל 🚫',
        `לקוח ביטל תור לתאריך ${appointmentData.date.toDate().toLocaleDateString('he-IL')}`,
        { appointmentId: appointmentId }
      );
      console.log('✅ Cancellation notification sent successfully');
    } catch (notificationError) {
      console.log('❌ Failed to send cancellation notification to admin:', notificationError);
    }
    
    console.log('Appointment cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
};

export const deleteAppointment = async (appointmentId: string) => {
  try {
    // Get appointment data before deleting
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (appointmentDoc.exists()) {
      const appointmentData = appointmentDoc.data() as Appointment;
      
      // Send notification to user about appointment cancellation
      try {
        await sendNotificationToUser(
          appointmentData.userId,
          'התור בוטל! ❌',
          'התור שלך בוטל בהצלחה.',
          { appointmentId: appointmentId }
        );
      } catch (notificationError) {
        console.log('Failed to send cancellation notification:', notificationError);
      }
      
      // Send notification to admin about appointment cancellation
      try {
        await sendNotificationToAdmin(
          'תור בוטל! ❌',
          `תור בוטל עבור ${appointmentData.date.toDate().toLocaleDateString('he-IL')}`,
          { appointmentId: appointmentId }
        );
      } catch (adminNotificationError) {
        console.log('Failed to send admin cancellation notification:', adminNotificationError);
      }
    }
    
    await deleteDoc(doc(db, 'appointments', appointmentId));
  } catch (error) {
    throw error;
  }
};

// Admin functions
export const checkIsAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      return userData.isAdmin || false;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Update existing user to admin
export const makeUserAdmin = async (email: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await updateDoc(userDoc.ref, { isAdmin: true });
      console.log(`User ${email} is now admin`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
};

// Create user profile in Firestore for existing Auth users
export const createUserProfileFromAuth = async (email: string): Promise<boolean> => {
  try {
    // Check if user already exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log('User already exists in Firestore');
      return true;
    }

    // Get current auth user
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.email !== email) {
      console.log('No matching auth user found');
      return false;
    }

    // Create user profile in Firestore
    const isAdminEmail = email === 'orel895@gmail.com';
    const userProfile: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: currentUser.displayName || 'משתמש',
      phone: currentUser.phoneNumber || '',
      isAdmin: isAdminEmail,
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, 'users', currentUser.uid), userProfile);
    console.log(`User profile created for ${email}`);
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
};

export const getAllAppointments = async (): Promise<Appointment[]> => {
  try {
    const q = query(collection(db, 'appointments'));
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    querySnapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    // Sort by date (most recent first)
    appointments.sort((a, b) => {
      if (a.date && b.date) {
        // Handle both Timestamp objects and regular Date objects
        const aTime = a.date.toMillis ? a.date.toMillis() : new Date(a.date as any).getTime();
        const bTime = b.date.toMillis ? b.date.toMillis() : new Date(b.date as any).getTime();
        return bTime - aTime;
      }
      return 0;
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting all appointments:', error);
    throw error;
  }
};

// Optimized appointment queries
export const getAppointmentsByDateRange = async (startDate: Date, endDate: Date): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    querySnapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting appointments by date range:', error);
    throw error;
  }
};

export const getCurrentMonthAppointments = async (): Promise<Appointment[]> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  return getAppointmentsByDateRange(startOfMonth, endOfMonth);
};

export const getRecentAppointments = async (days: number = 30): Promise<Appointment[]> => {
  const now = new Date();
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return getAppointmentsByDateRange(startDate, now);
};

export const getUpcomingAppointments = async (days: number = 30): Promise<Appointment[]> => {
  const now = new Date();
  const endDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return getAppointmentsByDateRange(now, endDate);
};

// Gallery functions
export const getGalleryImages = async (): Promise<GalleryImage[]> => {
  try {
    const q = query(collection(db, 'gallery'));
    const querySnapshot = await getDocs(q);
    const images: GalleryImage[] = [];
    
    querySnapshot.forEach((doc) => {
      images.push({
        id: doc.id,
        ...doc.data()
      } as GalleryImage);
    });
    
    return images.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error getting gallery images:', error);
    return [];
  }
};

export const addGalleryImage = async (imageData: Omit<GalleryImage, 'id' | 'createdAt'>) => {
  try {
    const newImage = {
      ...imageData,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'gallery'), newImage);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const deleteGalleryImage = async (imageId: string) => {
  try {
    await deleteDoc(doc(db, 'gallery', imageId));
  } catch (error) {
    throw error;
  }
};

// Treatment management functions
export const addTreatment = async (treatmentData: Omit<Treatment, 'id'>) => {
  try {
    // Validate duration is a multiple of 25 minutes
    if (treatmentData.duration && !isValidDuration(treatmentData.duration)) {
      throw new Error(`Treatment duration must be a multiple of ${SLOT_SIZE_MINUTES} minutes. Got: ${treatmentData.duration} minutes`);
    }
    
    const docRef = await addDoc(collection(db, 'treatments'), treatmentData);
    
    // Send notification about new treatment
    try {
      await sendNewTreatmentNotification(treatmentData.name);
    } catch (notificationError) {
      console.log('Failed to send new treatment notification:', notificationError);
    }
    
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateTreatment = async (treatmentId: string, updates: Partial<Treatment>) => {
  try {
    // Validate duration is a multiple of 25 minutes if being updated
    if (updates.duration && !isValidDuration(updates.duration)) {
      throw new Error(`Treatment duration must be a multiple of ${SLOT_SIZE_MINUTES} minutes. Got: ${updates.duration} minutes`);
    }
    
    const docRef = doc(db, 'treatments', treatmentId);
    await updateDoc(docRef, updates);
  } catch (error) {
    throw error;
  }
};

export const deleteTreatment = async (treatmentId: string) => {
  try {
    await deleteDoc(doc(db, 'treatments', treatmentId));
  } catch (error) {
    throw error;
  }
};

// Barber management functions
export const addBarberProfile = async (barberData: Omit<Barber, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'barbers'), barberData);
    
    // Send notification about new barber
    try {
      await sendNewBarberNotification(barberData.name);
    } catch (notificationError) {
      console.log('Failed to send new barber notification:', notificationError);
    }
    
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateBarberProfile = async (barberId: string, updates: Partial<Barber>) => {
  try {
    const docRef = doc(db, 'barbers', barberId);
    await updateDoc(docRef, updates);
  } catch (error) {
    throw error;
  }
};

export const deleteBarberProfile = async (barberId: string) => {
  try {
    await deleteDoc(doc(db, 'barbers', barberId));
  } catch (error) {
    throw error;
  }
};

// Firebase Storage helper functions
export const getStorageImages = async (folderPath: string): Promise<string[]> => {
  try {
    const imagesRef = ref(storage, folderPath);
    const result = await listAll(imagesRef);
    
    const urls = await Promise.all(
      result.items.map(async (imageRef) => {
        return await getDownloadURL(imageRef);
      })
    );
    
    return urls;
  } catch (error) {
    console.error(`Error getting images from ${folderPath}:`, error);
    return [];
  }
};

export const getImageUrl = async (imagePath: string): Promise<string | null> => {
  try {
    const imageRef = ref(storage, imagePath);
    const url = await getDownloadURL(imageRef);
    return url;
  } catch (error) {
    console.error(`Error getting image from ${imagePath}:`, error);
    return null;
  }
};

export const getAllStorageImages = async () => {
  try {
    const [galleryImages, backgroundImages, splashImages, workersImages, aboutusImages, shopImages] = await Promise.all([
      getStorageImages('gallery'),
      getStorageImages('backgrounds'), 
      getStorageImages('splash'),
      getStorageImages('workers'),
      getStorageImages('aboutus'),
      getStorageImages('shop')
    ]);
    
    return {
      gallery: galleryImages,
      backgrounds: backgroundImages,
      splash: splashImages,
      workers: workersImages,
      aboutus: aboutusImages,
      shop: shopImages
    };
  } catch (error) {
    console.error('Error getting all storage images:', error);
    return {
      gallery: [],
      backgrounds: [],
      splash: [],
      workers: [],
      aboutus: [],
      shop: []
    };
  }
};

// Simple image upload - React Native compatible
export const uploadImageToStorage = async (
  imageUri: string, 
  folderPath: string, 
  fileName: string
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }

    console.log('📤 Starting image upload:', imageUri);
    
    // Create reference
    const imageRef = ref(storage, `${folderPath}/${fileName}`);
    
    // Simple approach - just try to upload the URI directly
    // This should work for most React Native setups
    console.log('📤 Uploading image to storage...');
    
    // For React Native, we need to convert the URI to a blob
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    await uploadBytes(imageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(imageRef);
    console.log('✅ Image uploaded successfully:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload image: ${errorMessage}`);
  }
};

// Removed uploadOptimizedImage - using simple upload only

// Get available time slots for a barber on a specific date
export const getBarberAvailableSlots = async (barberId: string, date: string): Promise<string[]> => {
  try {
    console.log('🔍 Getting available slots for barber:', barberId, 'date:', date);

    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    console.log('📅 Day of week:', dayOfWeek);

    // Query the availability collection
    const q = query(
      collection(db, 'availability'),
      where('barberId', '==', barberId),
      where('dayOfWeek', '==', dayOfWeek),
      where('isAvailable', '==', true)
    );

    const snap = await getDocs(q);
    console.log('📊 Found availability documents:', snap.docs.length);

    if (snap.empty) {
      console.log('❌ No availability found for this day');
      return [];
    }

    // Get all time slots for this day
    const allSlots: string[] = [];

    snap.docs.forEach(doc => {
      const data = doc.data();
      console.log('📄 Availability doc:', doc.id, data);

      if (data.isAvailable) {
        let slots = [];

        // Prefer exact slots if available (new format)
        if (data.availableSlots && Array.isArray(data.availableSlots)) {
          slots = data.availableSlots;
          console.log('✅ Using exact availableSlots:', slots);

          // Use slots exactly as they are - perfect sync
        } else if (data.startTime && data.endTime) {
          // DO NOT USE FALLBACK - This causes sync issues!
          console.error('❌ CRITICAL SYNC ISSUE: availableSlots missing in getBarberAvailableSlots');
          console.error('❌ Document data:', data);
          console.error('❌ Admin slots will not match customer view - using empty slots');
          slots = []; // Force empty to prevent wrong slots
        }

        allSlots.push(...slots);
      }
    });

    // Remove duplicates and sort
    const uniqueSlots = [...new Set(allSlots)].sort();
    console.log('✅ Available slots:', uniqueSlots);

    return uniqueSlots;
  } catch (error) {
    console.error('Error getting barber available slots:', error);
    return [];
  }
};

// Real-time listener for availability changes
export const subscribeToAvailabilityChanges = (barberId: string, callback: (weeklySlots: {[key: number]: string[]}) => void) => {
  console.log('🔔 Subscribing to availability changes for barber:', barberId);
  
  const q = query(
    collection(db, 'availability'), 
    where('barberId', '==', barberId),
    where('isAvailable', '==', true)
  );
  
  return onSnapshot(q, (snapshot) => {
    console.log('📡 Availability changed, updating slots...');
    
    // Group slots by day of week
    const weeklySlots: {[key: number]: string[]} = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const dayOfWeek = data.dayOfWeek;

      if (data.isAvailable) {
        let slots: string[] = [];

        // Use exact availableSlots if available (matches admin's exact selections)
        if (data.availableSlots && Array.isArray(data.availableSlots)) {
          slots = data.availableSlots;
        } else if (data.startTime && data.endTime) {
          // DO NOT USE FALLBACK - This causes sync issues!
          console.error('❌ CRITICAL SYNC ISSUE: availableSlots missing in subscribeToAvailabilityChanges');
          console.error('❌ Document data:', data);
          console.error('❌ Admin slots will not match customer view - using empty slots');
          slots = []; // Force empty to prevent wrong slots
        }

        if (slots.length > 0) {
          if (!weeklySlots[dayOfWeek]) {
            weeklySlots[dayOfWeek] = [];
          }
          weeklySlots[dayOfWeek].push(...slots);
        }
      }
    });
    
    // Remove duplicates and sort for each day
    Object.keys(weeklySlots).forEach(day => {
      weeklySlots[parseInt(day)] = [...new Set(weeklySlots[parseInt(day)])].sort();
    });
    
    console.log('✅ Updated weekly availability:', weeklySlots);
    callback(weeklySlots);
  }, (error) => {
    console.error('❌ Error listening to availability changes:', error);
  });
};

// New function for daily availability changes
export const subscribeToDailyAvailabilityChanges = (barberId: string, callback: (dailySlots: {[key: string]: string[]}) => void) => {
  console.log('🔔 Subscribing to daily availability changes for barber:', barberId);

  const q = query(
    collection(db, 'dailyAvailability'),
    where('barberId', '==', barberId),
    where('isAvailable', '==', true)
  );

  return onSnapshot(q, (snapshot) => {
    console.log('📡 Daily availability changed, updating slots...');

    // Group slots by specific date
    const dailySlots: {[key: string]: string[]} = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.isAvailable && data.availableSlots && Array.isArray(data.availableSlots)) {
        dailySlots[data.date] = data.availableSlots;
      }
    });

    console.log('✅ Updated daily availability:', dailySlots);
    callback(dailySlots);
  }, (error) => {
    console.error('❌ Error listening to daily availability changes:', error);
  });
};

// Real-time listener for treatments changes
export const subscribeToTreatmentsChanges = (callback: (treatments: Treatment[]) => void) => {
  console.log('🔔 Subscribing to treatments changes');
  
  const q = query(collection(db, 'treatments'), orderBy('name'));
  
  return onSnapshot(q, (snapshot) => {
    console.log('📡 Treatments changed, updating list...');
    
    const treatments: Treatment[] = [];
    snapshot.docs.forEach(doc => {
      treatments.push({
        id: doc.id,
        ...doc.data()
      } as Treatment);
    });
    
    console.log('✅ Updated treatments list:', treatments.length, 'treatments');
    callback(treatments);
  }, (error) => {
    console.error('❌ Error listening to treatments changes:', error);
  });
};

// Check if a specific time slot is available for booking
export const isTimeSlotAvailable = async (barberId: string, date: string, time: string): Promise<boolean> => {
  try {
    // First check if barber has this time slot available
    const availableSlots = await getBarberAvailableSlots(barberId, date);
    if (!availableSlots.includes(time)) {
      return false; // Barber not available at this time
    }
    
    // Then check if there's already an appointment at this time
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('barberId', '==', barberId),
      where('date', '==', date),
      where('time', '==', time),
      where('status', '!=', 'cancelled')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.empty; // Available if no conflicting appointments
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return false;
  }
};

// Check what's in Firebase Storage
export const listAllStorageImages = async () => {
  try {
    console.log('📂 Checking Firebase Storage contents...');
    
    const storageImages = await getAllStorageImages();
    
    console.log('🗂️ Firebase Storage contents:');
    console.log('Gallery folder:', storageImages.gallery);
    console.log('Backgrounds folder:', storageImages.backgrounds);
    console.log('Splash folder:', storageImages.splash);
    console.log('Workers folder:', storageImages.workers);
    console.log('About us folder:', storageImages.aboutus);
    console.log('Shop folder:', storageImages.shop);
    
    return storageImages;
  } catch (error) {
    console.error('❌ Error listing storage images:', error);
    throw error;
  }
};

// Restore gallery from Firebase Storage images
export const restoreGalleryFromStorage = async () => {
  try {
    console.log('🔄 Restoring gallery from Firebase Storage...');
    
    // Get images from Firebase Storage
    const storageImages = await getAllStorageImages();
    
    // Clear existing gallery
    const existingImages = await getGalleryImages();
    for (const image of existingImages) {
      console.log('🗑️ Deleting existing image:', image.id);
      await deleteGalleryImage(image.id);
    }
    
    // Add images from storage to gallery collection
    let addedCount = 0;
    
    // Add gallery images
    for (let i = 0; i < storageImages.gallery.length; i++) {
      const imageUrl = storageImages.gallery[i];
      await addGalleryImage({
        imageUrl,
        type: 'gallery',
        order: i,
        isActive: true
      });
      console.log('➕ Added gallery image:', imageUrl);
      addedCount++;
    }
    
    // Add background images
    for (let i = 0; i < storageImages.backgrounds.length; i++) {
      const imageUrl = storageImages.backgrounds[i];
      await addGalleryImage({
        imageUrl,
        type: 'background',
        order: i,
        isActive: true
      });
      console.log('➕ Added background image:', imageUrl);
      addedCount++;
    }
    
    // Add about us images
    for (let i = 0; i < storageImages.aboutus.length; i++) {
      const imageUrl = storageImages.aboutus[i];
      await addGalleryImage({
        imageUrl,
        type: 'gallery',
        order: storageImages.gallery.length + storageImages.backgrounds.length + i,
        isActive: true
      });
      console.log('➕ Added about us image:', imageUrl);
      addedCount++;
    }
    
    // Add shop images
    for (let i = 0; i < storageImages.shop.length; i++) {
      const imageUrl = storageImages.shop[i];
      await addGalleryImage({
        imageUrl,
        type: 'gallery', // Shop items go to gallery for now
        order: storageImages.gallery.length + storageImages.backgrounds.length + storageImages.aboutus.length + i,
        isActive: true
      });
      console.log('➕ Added shop image:', imageUrl);
      addedCount++;
    }
    
    console.log('✅ Gallery restored with', addedCount, 'images from Firebase Storage');
    return addedCount;
  } catch (error) {
    console.error('❌ Error restoring gallery from storage:', error);
    throw error;
  }
};

// Shop Items Management
export const addShopItem = async (shopItem: Omit<ShopItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = doc(collection(db, 'shopItems'));
    const newShopItem: ShopItem = {
      ...shopItem,
      id: docRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await setDoc(docRef, newShopItem);
    console.log('✅ Shop item added successfully:', newShopItem.name);
    return newShopItem;
  } catch (error) {
    console.error('❌ Error adding shop item:', error);
    throw error;
  }
};

export const getShopItems = async (): Promise<ShopItem[]> => {
  try {
    const q = query(
      collection(db, 'shopItems'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => doc.data() as ShopItem);
    console.log('📦 Loaded', items.length, 'shop items');
    return items;
  } catch (error) {
    console.error('❌ Error loading shop items:', error);
    return [];
  }
};

export const getActiveShopItems = async (): Promise<ShopItem[]> => {
  try {
    console.log('🛍️ Loading shop items...');
    
    // First try with just the isActive filter
    let q = query(
      collection(db, 'shopItems'),
      where('isActive', '==', true)
    );
    
    let snapshot = await getDocs(q);
    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShopItem));
    
    // Sort manually by createdAt if available
    items.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      }
      return 0;
    });
    
    console.log('🛍️ Loaded', items.length, 'active shop items');
    
    // If no items found, try loading all items
    if (items.length === 0) {
      console.log('🔍 No active items found, loading all shop items...');
      const allSnapshot = await getDocs(collection(db, 'shopItems'));
      const allItems = allSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShopItem));
      console.log('📋 Found', allItems.length, 'total shop items');
      return allItems;
    }
    
    return items;
  } catch (error) {
    console.error('❌ Error loading shop items:', error);
    console.log('🔄 Fallback: Loading all shop items...');
    
    // Fallback - load all items without filters
    try {
      const allSnapshot = await getDocs(collection(db, 'shopItems'));
      const allItems = allSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShopItem));
      console.log('✅ Fallback loaded', allItems.length, 'shop items');
      return allItems;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return [];
    }
  }
};

export const updateShopItem = async (id: string, updates: Partial<ShopItem>) => {
  try {
    const docRef = doc(db, 'shopItems', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    console.log('✅ Shop item updated successfully:', id);
  } catch (error) {
    console.error('❌ Error updating shop item:', error);
    throw error;
  }
};

export const deleteShopItem = async (id: string) => {
  try {
    const docRef = doc(db, 'shopItems', id);
    await deleteDoc(docRef);
    console.log('🗑️ Shop item deleted successfully:', id);
  } catch (error) {
    console.error('❌ Error deleting shop item:', error);
    throw error;
  }
};

// Clear all gallery images and add fresh ones
export const resetGalleryWithRealImages = async () => {
  try {
    console.log('🧹 Clearing all gallery images and adding fresh ones...');
    
    // Get all existing gallery images
    const existingImages = await getGalleryImages();
    console.log('Found', existingImages.length, 'existing images to delete');
    
    // Delete ALL existing gallery images
    for (const image of existingImages) {
      console.log('🗑️ Deleting image:', image.id);
      await deleteGalleryImage(image.id);
    }
    
    // Add fresh real images
    const realGalleryImages = [
      {
        imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 0,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 1,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 2,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 3,
        isActive: true
      }
    ];

    for (const imageData of realGalleryImages) {
      console.log('➕ Adding fresh image:', imageData.imageUrl);
      await addGalleryImage(imageData);
    }
    
    console.log('✅ Gallery reset with', realGalleryImages.length, 'fresh real images');
    return realGalleryImages.length;
  } catch (error) {
    console.error('❌ Error resetting gallery:', error);
    throw error;
  }
};

// Replace existing placeholder images with real images
export const replaceGalleryPlaceholders = async () => {
  try {
    console.log('🔄 Replacing placeholder images with real images...');
    
    // Get all existing gallery images
    const existingImages = await getGalleryImages();
    console.log('Found', existingImages.length, 'existing images');
    
    // Debug: show what we have
    existingImages.forEach((img, index) => {
      console.log(`Image ${index}:`, {
        id: img.id,
        imageUrl: img.imageUrl || 'MISSING URL',
        type: img.type,
        isActive: img.isActive
      });
    });
    
    // Delete old placeholder images
    for (const image of existingImages) {
      if (image.imageUrl && (image.imageUrl.includes('placeholder') || image.imageUrl.includes('via.placeholder'))) {
        console.log('🗑️ Deleting placeholder image:', image.id);
        await deleteGalleryImage(image.id);
      } else if (!image.imageUrl) {
        console.log('🗑️ Deleting image with missing URL:', image.id);
        await deleteGalleryImage(image.id);
      }
    }
    
    // Add new real images
    const realGalleryImages = [
      {
        imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 0,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 1,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 2,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 3,
        isActive: true
      }
    ];

    for (const imageData of realGalleryImages) {
      console.log('➕ Adding real image:', imageData.imageUrl);
      await addGalleryImage(imageData);
    }
    
    console.log('✅ Gallery updated with', realGalleryImages.length, 'real images');
    return realGalleryImages.length;
  } catch (error) {
    console.error('❌ Error replacing gallery placeholders:', error);
    throw error;
  }
};

// Initialize gallery with default images
export const initializeGalleryImages = async () => {
  try {
    // Check if gallery already has images
    const existingImages = await getGalleryImages();
    
    // If we have placeholder images, replace them
    const hasPlaceholders = existingImages.some(img => 
      img.imageUrl && (img.imageUrl.includes('placeholder') || img.imageUrl.includes('via.placeholder'))
    );
    
    if (hasPlaceholders) {
      console.log('🔄 Found placeholder images, replacing with real images...');
      await replaceGalleryPlaceholders();
      return;
    }
    
    if (existingImages.length > 0) {
      console.log('Gallery already has real images, skipping initialization');
      return;
    }

    console.log('Initializing gallery with default images...');
    
    // Add some real gallery images
    const defaultGalleryImages = [
      {
        imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 0,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 1,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 2,
        isActive: true
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&h=300&fit=crop&auto=format',
        type: 'gallery' as const,
        order: 3,
        isActive: true
      }
    ];

    for (const imageData of defaultGalleryImages) {
      await addGalleryImage(imageData);
    }
    
    console.log('Gallery initialized with', defaultGalleryImages.length, 'images');
  } catch (error) {
    console.error('Error initializing gallery images:', error);
    throw error;
  }
};

// Initialize empty collections (run once)
export const initializeCollections = async () => {
  try {
    // Initialize gallery images
    await initializeGalleryImages();
    
    // Create availability collection sample
    await addDoc(collection(db, 'availability'), {
      barberId: 'sample-barber-id',
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '18:00',
      isAvailable: true,
      createdAt: Timestamp.now()
    });
    
    // Create settings collection sample
    await addDoc(collection(db, 'settings'), {
      key: 'business_hours',
      value: { start: '09:00', end: '18:00' },
      updatedAt: Timestamp.now()
    });
    
    console.log('Collections initialized successfully');
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
};


// Barber availability functions
export const getBarberAvailability = async (barberId: string): Promise<BarberAvailability[]> => {
  try {
    const q = query(
      collection(db, 'availability'),
      where('barberId', '==', barberId)
    );
    const querySnapshot = await getDocs(q);
    const availability: BarberAvailability[] = [];
    
    querySnapshot.forEach((doc) => {
      availability.push({
        id: doc.id,
        ...doc.data()
      } as BarberAvailability);
    });
    
    return availability.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  } catch (error) {
    console.error('Error getting barber availability:', error);
    return [];
  }
};

export const getAllAvailability = async (): Promise<BarberAvailability[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'availability'));
    const availability: BarberAvailability[] = [];
    
    querySnapshot.forEach((doc) => {
      availability.push({
        id: doc.id,
        ...doc.data()
      } as BarberAvailability);
    });
    
    return availability;
  } catch (error) {
    console.error('Error getting all availability:', error);
    return [];
  }
};

export const addAvailability = async (availabilityData: Omit<BarberAvailability, 'id' | 'createdAt'>) => {
  try {
    const newAvailability = {
      ...availabilityData,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'availability'), newAvailability);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateAvailability = async (availabilityId: string, updates: Partial<BarberAvailability>) => {
  try {
    const docRef = doc(db, 'availability', availabilityId);
    await updateDoc(docRef, updates);
  } catch (error) {
    throw error;
  }
};

export const deleteAvailability = async (availabilityId: string) => {
  try {
    await deleteDoc(doc(db, 'availability', availabilityId));
  } catch (error) {
    throw error;
  }
};

// Batch update availability for a barber
export const updateBarberWeeklyAvailability = async (barberId: string, weeklySchedule: Omit<BarberAvailability, 'id' | 'barberId' | 'createdAt'>[]) => {
  try {
    // Delete existing availability for this barber
    const existingAvailability = await getBarberAvailability(barberId);
    await Promise.all(
      existingAvailability.map(availability => 
        deleteAvailability(availability.id)
      )
    );
    
    // Add new availability
    await Promise.all(
      weeklySchedule.map(schedule => 
        addAvailability({
          ...schedule,
          barberId
        })
      )
    );
  } catch (error) {
    throw error;
  }
};

// Migrate old barber data to new format
export const migrateBarberData = async (barberId: string, barberData: any) => {
  try {
    const standardizedData: Partial<Barber> = {
      name: barberData.name || '',
      experience: barberData.experience || barberData.bio || '',
      rating: barberData.rating || 5,
      specialties: barberData.specialties || [],
      image: barberData.image || barberData.photoUrl || '',
      available: barberData.available !== false,
      phone: barberData.phone || ''
    };

    await updateBarberProfile(barberId, standardizedData);
    return standardizedData;
  } catch (error) {
    console.error('Error migrating barber data:', error);
    throw error;
  }
};

// Add a new barber with availability
export const addBarber = async ({ name, image, availableSlots, availabilityWindow }: {
  name: string;
  image: string;
  availableSlots: string[];
  availabilityWindow: { start: string; end: string };
}) => {
  try {
    const barber = {
      name,
      image,
      specialties: [],
      experience: '',
      rating: 5,
      available: true,
      availableSlots,
      availabilityWindow,
    };
    const docRef = await addDoc(collection(db, 'barbers'), barber);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// Initialize default availability for a barber if none exists
export const initializeBarberAvailability = async (barberId: string): Promise<void> => {
  try {
    const existing = await getBarberAvailability(barberId);
    if (existing.length > 0) {
      return; // Already has availability
    }
    
    // Create default availability (Monday-Thursday 9:00-18:00)
    const defaultSchedule = [
      { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isAvailable: false }, // Sunday
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isAvailable: true },  // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isAvailable: true },  // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isAvailable: true },  // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isAvailable: true },  // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isAvailable: false }, // Friday
      { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isAvailable: false }, // Saturday
    ];
    
    await updateBarberWeeklyAvailability(barberId, defaultSchedule);
    console.log(`Initialized default availability for barber ${barberId}`);
  } catch (error) {
    console.error('Error initializing barber availability:', error);
  }
};

// Get barber appointments for a specific day - helper function for BookingScreen
export const getBarberAppointmentsForDay = async (barberId: string, date: Date): Promise<any[]> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('Querying appointments for barber:', barberId);
    console.log('Date range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());
    
    // Simplified query to avoid Firebase index issues
    const q = query(
      collection(db, 'appointments'),
      where('barberId', '==', barberId)
    );
    
    const snapshot = await getDocs(q);
    const allAppointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter in JavaScript instead of Firestore
    const filteredAppointments = allAppointments.filter((appointment: any) => {
      // Only consider confirmed/pending appointments
      if (!['confirmed', 'pending'].includes(appointment.status)) {
        return false;
      }
      
      // Check if appointment is on the selected date
      let appointmentDate;
      if (appointment.date && typeof appointment.date.toDate === 'function') {
        appointmentDate = appointment.date.toDate();
      } else if (appointment.date) {
        appointmentDate = new Date(appointment.date);
      } else {
        return false;
      }
      
      return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
    });
    
    console.log('Found appointments:', filteredAppointments.length);
    console.log('Appointment details:', filteredAppointments);
    return filteredAppointments;
  } catch (error) {
    console.error('Error getting barber appointments for day:', error);
    return [];
  }
};

// Image Management Functions for Admin Panel

export interface AppImages {
  atmosphereImage?: string;
  aboutUsImage?: string;
  galleryImages?: string[];
}

// Get current app images from Firestore
export const getAppImages = async (): Promise<AppImages> => {
  try {
    const docRef = doc(db, 'settings', 'images');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        atmosphereImage: data.atmosphereImage || '',
        aboutUsImage: data.aboutUsImage || '',
        galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : []
      };
    }
    
    return {
      atmosphereImage: '',
      aboutUsImage: '',
      galleryImages: []
    };
  } catch (error) {
    console.error('Error getting app images:', error);
    throw error;
  }
};

// Upload image to Firebase Storage for app images
export const uploadAppImageToStorage = async (
  imageUri: string, 
  imagePath: string, 
  fileName: string
): Promise<string> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create storage reference
    const imageRef = ref(storage, `${imagePath}/${fileName}`);
    
    // Upload image
    await uploadBytes(imageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(imageRef);
    
    console.log('Image uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Firebase Storage (used when replacing)
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
      return; // Skip if not a Firebase Storage URL
    }
    
    // Extract storage path from URL
    const pathStart = imageUrl.indexOf('/o/') + 3;
    const pathEnd = imageUrl.indexOf('?');
    const path = decodeURIComponent(imageUrl.slice(pathStart, pathEnd));
    
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
    
    console.log('Image deleted successfully:', path);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error - deletion failure shouldn't prevent upload
  }
};

// Update atmosphere/background image
export const updateAtmosphereImage = async (imageUri: string): Promise<string> => {
  try {
    const fileName = `atmosphere_${Date.now()}.jpg`;
    
    // Get current image URL to delete old one
    const currentImages = await getAppImages();
    
    // Upload new image
    const newImageUrl = await uploadAppImageToStorage(imageUri, 'app-images', fileName);
    
    // Update Firestore
    const docRef = doc(db, 'settings', 'images');
    await setDoc(docRef, {
      ...currentImages,
      atmosphereImage: newImageUrl
    }, { merge: true });
    
    // Delete old image after successful update
    if (currentImages.atmosphereImage) {
      await deleteImageFromStorage(currentImages.atmosphereImage);
    }
    
    console.log('Atmosphere image updated successfully');
    return newImageUrl;
  } catch (error) {
    console.error('Error updating atmosphere image:', error);
    throw error;
  }
};

// Update about us image
export const updateAboutUsImage = async (imageUri: string): Promise<string> => {
  try {
    const fileName = `about_us_${Date.now()}.jpg`;
    
    // Get current image URL to delete old one
    const currentImages = await getAppImages();
    
    // Upload new image
    const newImageUrl = await uploadAppImageToStorage(imageUri, 'app-images', fileName);
    
    // Update Firestore
    const docRef = doc(db, 'settings', 'images');
    await setDoc(docRef, {
      ...currentImages,
      aboutUsImage: newImageUrl
    }, { merge: true });
    
    // Delete old image after successful update
    if (currentImages.aboutUsImage) {
      await deleteImageFromStorage(currentImages.aboutUsImage);
    }
    
    console.log('About us image updated successfully');
    return newImageUrl;
  } catch (error) {
    console.error('Error updating about us image:', error);
    throw error;
  }
};

// Add image to app gallery (different from gallery collection)
export const addAppGalleryImage = async (imageUri: string): Promise<string> => {
  try {
    const fileName = `gallery_${Date.now()}.jpg`;
    
    // Upload new image
    const newImageUrl = await uploadAppImageToStorage(imageUri, 'app-images/gallery', fileName);
    
    // Get current images
    const currentImages = await getAppImages();
    const updatedGallery = [...(currentImages.galleryImages || []), newImageUrl];
    
    // Update Firestore
    const docRef = doc(db, 'settings', 'images');
    await setDoc(docRef, {
      ...currentImages,
      galleryImages: updatedGallery
    }, { merge: true });
    
    console.log('App gallery image added successfully');
    return newImageUrl;
  } catch (error) {
    console.error('Error adding app gallery image:', error);
    throw error;
  }
};

// Remove image from app gallery
export const removeAppGalleryImage = async (imageUrl: string): Promise<void> => {
  try {
    // Get current images
    const currentImages = await getAppImages();
    const updatedGallery = (currentImages.galleryImages || []).filter(url => url !== imageUrl);
    
    // Update Firestore
    const docRef = doc(db, 'settings', 'images');
    await setDoc(docRef, {
      ...currentImages,
      galleryImages: updatedGallery
    }, { merge: true });
    
    // Delete from storage
    await deleteImageFromStorage(imageUrl);
    
    console.log('App gallery image removed successfully');
  } catch (error) {
    console.error('Error removing app gallery image:', error);
    throw error;
  }
};

// Replace app gallery image (remove old, add new)
export const replaceAppGalleryImage = async (oldImageUrl: string, newImageUri: string): Promise<string> => {
  try {
    const fileName = `gallery_${Date.now()}.jpg`;
    
    // Upload new image
    const newImageUrl = await uploadAppImageToStorage(newImageUri, 'app-images/gallery', fileName);
    
    // Get current images
    const currentImages = await getAppImages();
    const updatedGallery = (currentImages.galleryImages || []).map(url => 
      url === oldImageUrl ? newImageUrl : url
    );
    
    // Update Firestore
    const docRef = doc(db, 'settings', 'images');
    await setDoc(docRef, {
      ...currentImages,
      galleryImages: updatedGallery
    }, { merge: true });
    
    // Delete old image
    await deleteImageFromStorage(oldImageUrl);
    
    console.log('App gallery image replaced successfully');
    return newImageUrl;
  } catch (error) {
    console.error('Error replacing app gallery image:', error);
    throw error;
  }
};

// Push Notification functions
export const registerForPushNotifications = async (userId: string) => {
  try {
    // Check if device supports notifications
    if (!Device.isDevice) {
      console.log('📱 Not a physical device, skipping push notification registration');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push notification permissions');
      return null;
    }

    // Get push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('📱 Push token:', token);

    // Save token to user profile
    await updateUserProfile(userId, { pushToken: token });

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const sendPushNotification = async (pushToken: string, title: string, body: string, data?: any) => {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    console.log('✅ Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

export const sendNotificationToUser = async (userId: string, title: string, body: string, data?: any) => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile || !userProfile.pushToken) {
      console.log('❌ User not found or no push token');
      return false;
    }

    await sendPushNotification(userProfile.pushToken, title, body, data);
    return true;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return false;
  }
};

export const sendNotificationToAllUsers = async (title: string, body: string, data?: any) => {
  try {
    const users = await getAllUsers();
    // Filter out admin users to avoid sending to admins
    const nonAdminUsers = users.filter(user => !user.isAdmin && user.pushToken);
    
    console.log(`📱 Sending notification to ${nonAdminUsers.length} non-admin users`);
    
    const results = await Promise.allSettled(
      nonAdminUsers.map(user => 
        sendPushNotification(user.pushToken!, title, body, data)
      )
    );
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    console.log(`✅ Successfully sent to ${successful}/${nonAdminUsers.length} users`);
    
    return successful;
  } catch (error) {
    console.error('Error sending notification to all users:', error);
    return 0;
  }
};

// Schedule appointment reminder notifications
export const scheduleAppointmentReminders = async (appointmentId: string, appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
  try {
    const appointmentDate = appointmentData.date.toDate();
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    
    // Only schedule if appointment is in the future
    if (timeDiff <= 0) {
      console.log('Appointment is in the past, not scheduling reminders');
      return;
    }
    
    const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
    
    // Schedule 24-hour reminder if appointment is more than 24 hours away
    if (hoursUntilAppointment > 24) {
      const reminder24hTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
      console.log(`📅 Scheduling 24h reminder for ${reminder24hTime.toLocaleString()}`);
      
      // Store scheduled reminder in Firestore
      await addDoc(collection(db, 'scheduledReminders'), {
        appointmentId: appointmentId,
        userId: appointmentData.userId,
        scheduledTime: Timestamp.fromDate(reminder24hTime),
        reminderType: '24h',
        status: 'pending'
      });
    }
    
    // Schedule 1-hour reminder if appointment is more than 1 hour away
    if (hoursUntilAppointment > 1) {
      const reminder1hTime = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
      console.log(`📅 Scheduling 1h reminder for ${reminder1hTime.toLocaleString()}`);
      
      await addDoc(collection(db, 'scheduledReminders'), {
        appointmentId: appointmentId,
        userId: appointmentData.userId,
        scheduledTime: Timestamp.fromDate(reminder1hTime),
        reminderType: '1h',
        status: 'pending'
      });
    }
    
    // Schedule 15-minute reminder if appointment is more than 15 minutes away
    if (timeDiff > 15 * 60 * 1000) {
      const reminder15mTime = new Date(appointmentDate.getTime() - 15 * 60 * 1000);
      console.log(`📅 Scheduling 15m reminder for ${reminder15mTime.toLocaleString()}`);
      
      await addDoc(collection(db, 'scheduledReminders'), {
        appointmentId: appointmentId,
        userId: appointmentData.userId,
        scheduledTime: Timestamp.fromDate(reminder15mTime),
        reminderType: '15m',
        status: 'pending'
      });
    }
    
    console.log(`✅ Scheduled reminders for appointment ${appointmentId}`);
  } catch (error) {
    console.error('Error scheduling appointment reminders:', error);
  }
};

// Send appointment reminder notification
export const sendAppointmentReminder = async (appointmentId: string) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      console.log('Appointment not found');
      return false;
    }
    
    const appointmentData = appointmentDoc.data() as Appointment;
    const appointmentDate = appointmentData.date.toDate();
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
    const minutesUntilAppointment = timeDiff / (1000 * 60);
    
    // Send different reminders based on time until appointment
    if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 24) {
      let title = '';
      let message = '';
      
      if (minutesUntilAppointment <= 15) {
        // 15 minutes before
        title = 'תזכורת לתור! ⏰';
        message = `התור שלך בעוד 15 דקות ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (hoursUntilAppointment <= 1) {
        // 1 hour before
        title = 'תזכורת לתור! ⏰';
        message = `יש לך תור ל-${appointmentData.treatmentId} בעוד שעה!`;
      } else {
        // 24 hours before
        title = 'תזכורת לתור! ⏰';
        message = `התור שלך מחר ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      await sendNotificationToUser(
        appointmentData.userId,
        title,
        message,
        { appointmentId: appointmentId }
      );
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return false;
  }
};

// Get admin notification settings
export const getAdminNotificationSettings = async (): Promise<{
  newUserRegistered: boolean;
  newAppointmentBooked: boolean;
  appointmentCancelled: boolean;
  appointmentReminders: boolean;
  reminderTimings: {
    oneHourBefore: boolean;
    thirtyMinutesBefore: boolean;
    tenMinutesBefore: boolean;
    whenStarting: boolean;
  };
}> => {
  try {
    const { doc, getDoc, getFirestore } = await import('firebase/firestore');
    const db = getFirestore();
    
    const settingsDoc = await getDoc(doc(db, 'adminSettings', 'notifications'));
    
    if (settingsDoc.exists()) {
      return settingsDoc.data() as any;
    }
    
    // Return default settings if none exist
    return {
      newUserRegistered: true,
      newAppointmentBooked: true,
      appointmentCancelled: true,
      appointmentReminders: true,
      reminderTimings: {
        oneHourBefore: true,
        thirtyMinutesBefore: true,
        tenMinutesBefore: false,
        whenStarting: false,
      },
    };
  } catch (error) {
    console.error('Error getting admin notification settings:', error);
    // Return default settings on error
    return {
      newUserRegistered: true,
      newAppointmentBooked: true,
      appointmentCancelled: true,
      appointmentReminders: true,
      reminderTimings: {
        oneHourBefore: true,
        thirtyMinutesBefore: true,
        tenMinutesBefore: false,
        whenStarting: false,
      },
    };
  }
};

// Send notification to admin about events
export const sendNotificationToAdmin = async (title: string, body: string, data?: any) => {
  try {
    console.log(`🔔 sendNotificationToAdmin called with title: "${title}"`);
    
    // Check if this type of notification is enabled
    const settings = await getAdminNotificationSettings();
    
    // Determine notification type based on title/content
    let shouldSend = false;
    if (title.includes('משתמש חדש') || title.includes('נרשם')) {
      shouldSend = settings.newUserRegistered;
    } else if (title.includes('תור חדש') || title.includes('תור נוצר')) {
      shouldSend = settings.newAppointmentBooked;
    } else if (title.includes('בוטל') || title.includes('תור בוטל')) {
      shouldSend = settings.appointmentCancelled;
    } else if (title.includes('תזכורת') || title.includes('תור קרוב')) {
      // Check specific reminder timings
      if (title.includes('שעה לפני') || title.includes('1 שעה')) {
        shouldSend = settings.appointmentReminders && settings.reminderTimings.oneHourBefore;
      } else if (title.includes('30 דקות') || title.includes('חצי שעה')) {
        shouldSend = settings.appointmentReminders && settings.reminderTimings.thirtyMinutesBefore;
      } else if (title.includes('10 דקות')) {
        shouldSend = settings.appointmentReminders && settings.reminderTimings.tenMinutesBefore;
      } else if (title.includes('מתחיל') || title.includes('התחיל')) {
        shouldSend = settings.appointmentReminders && settings.reminderTimings.whenStarting;
      } else {
        // General reminder - check if any timing is enabled
        shouldSend = settings.appointmentReminders && (
          settings.reminderTimings.oneHourBefore ||
          settings.reminderTimings.thirtyMinutesBefore ||
          settings.reminderTimings.tenMinutesBefore ||
          settings.reminderTimings.whenStarting
        );
      }
    } else {
      // Default to sending if we can't determine the type
      shouldSend = true;
    }
    
    if (!shouldSend) {
      console.log(`🔕 Notification disabled for this type: "${title}"`);
      return 0;
    }
    
    // Try to get current user's profile directly if they're admin
    const currentUser = getCurrentUser();
    let adminUsers: UserProfile[] = [];
    
    if (currentUser) {
      const currentUserProfile = await getUserProfile(currentUser.uid);
      if (currentUserProfile?.isAdmin && currentUserProfile?.pushToken) {
        adminUsers.push(currentUserProfile);
        console.log(`👨‍💼 Current user is admin with push token: ${currentUserProfile.displayName}`);
      }
    }
    
    // Also try to get all users (fallback)
    try {
      const users = await getAllUsers();
      console.log(`👥 Total users found: ${users.length}`);
      const allAdminUsers = users.filter(user => user.isAdmin && user.pushToken);
      // Merge without duplicates
      allAdminUsers.forEach(user => {
        if (!adminUsers.find(existing => existing.uid === user.uid)) {
          adminUsers.push(user);
        }
      });
    } catch (getAllUsersError: any) {
      console.log('⚠️ Could not get all users, using current user only:', getAllUsersError.message);
    }
    
    console.log(`👨‍💼 Admin users with push tokens: ${adminUsers.length}`);
    console.log(`📱 Sending notification to ${adminUsers.length} admin users`);
    
    const results = await Promise.allSettled(
      adminUsers.map(user => 
        sendPushNotification(user.pushToken!, title, body, data)
      )
    );
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    console.log(`✅ Successfully sent to ${successful}/${adminUsers.length} admin users`);
    
    return successful;
  } catch (error) {
    console.error('Error sending notification to admin:', error);
    return 0;
  }
};

// Process scheduled reminders (should be called periodically)
// Clean up old appointments to reduce Firebase load
export const cleanupOldAppointments = async (daysToKeep: number = 10): Promise<{
  deletedCount: number;
  errorCount: number;
  errors: string[];
}> => {
  try {
    console.log(`🧹 Starting cleanup of appointments older than ${daysToKeep} days`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Get all appointments
    const appointmentsRef = collection(db, 'appointments');
    const snapshot = await getDocs(appointmentsRef);
    
    const appointmentsToDelete: string[] = [];
    const errors: string[] = [];
    let errorCount = 0;
    
    snapshot.docs.forEach(doc => {
      const appointmentData = doc.data();
      const appointmentDate = appointmentData.date?.toDate();
      
      if (appointmentDate && appointmentDate < cutoffDate) {
        // Only delete if appointment is older than cutoff date
        // AND if it's not a future appointment (safety check)
        const now = new Date();
        if (appointmentDate < now) {
          appointmentsToDelete.push(doc.id);
        }
      }
    });
    
    console.log(`📋 Found ${appointmentsToDelete.length} old appointments to delete`);
    
    // Delete appointments in batches to avoid overwhelming Firebase
    const batchSize = 10;
    let deletedCount = 0;
    
    for (let i = 0; i < appointmentsToDelete.length; i += batchSize) {
      const batch = appointmentsToDelete.slice(i, i + batchSize);
      
      try {
        await Promise.all(
          batch.map(appointmentId => 
            deleteDoc(doc(db, 'appointments', appointmentId))
          )
        );
        
        deletedCount += batch.length;
        console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} appointments`);
        
        // Small delay between batches to be gentle on Firebase
        if (i + batchSize < appointmentsToDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, error);
        errorCount += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error}`);
      }
    }
    
    console.log(`🧹 Cleanup completed: ${deletedCount} deleted, ${errorCount} errors`);
    
    return {
      deletedCount,
      errorCount,
      errors
    };
    
  } catch (error) {
    console.error('Error during appointment cleanup:', error);
    return {
      deletedCount: 0,
      errorCount: 1,
      errors: [`General error: ${error}`]
    };
  }
};

export const processScheduledReminders = async () => {
  try {
    const now = new Date();
    const remindersQuery = query(
      collection(db, 'scheduledReminders'),
      where('status', '==', 'pending'),
      where('scheduledTime', '<=', Timestamp.fromDate(now))
    );
    
    const remindersSnapshot = await getDocs(remindersQuery);
    console.log(`📱 Processing ${remindersSnapshot.size} scheduled reminders`);
    
    const results = await Promise.allSettled(
      remindersSnapshot.docs.map(async (reminderDoc) => {
        const reminderData = reminderDoc.data();
        
        // Send the actual notification
        await sendAppointmentReminder(reminderData.appointmentId);
        
        // Mark as sent
        await updateDoc(doc(db, 'scheduledReminders', reminderDoc.id), {
          status: 'sent',
          sentAt: Timestamp.now()
        });
        
        console.log(`✅ Processed ${reminderData.reminderType} reminder for appointment ${reminderData.appointmentId}`);
      })
    );
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    console.log(`✅ Successfully processed ${successful} scheduled reminders`);
    
    return successful;
  } catch (error) {
    console.error('Error processing scheduled reminders:', error);
    return 0;
  }
};

// Send reminder to all users with upcoming appointments
export const sendRemindersToAllUsers = async () => {
  try {
    // First process any scheduled reminders that are due
    await processScheduledReminders();
    
    const appointments = await getAllAppointments();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const upcomingAppointments = appointments.filter(appointment => {
      const appointmentDate = appointment.date.toDate();
      return appointmentDate >= now && appointmentDate <= tomorrow && appointment.status === 'confirmed';
    });
    
    console.log(`📱 Sending reminders for ${upcomingAppointments.length} appointments`);
    
    const results = await Promise.allSettled(
      upcomingAppointments.map(appointment => 
        sendAppointmentReminder(appointment.id)
      )
    );
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    console.log(`✅ Successfully sent ${successful} reminders`);
    
    return successful;
  } catch (error) {
    console.error('Error sending reminders to all users:', error);
    return 0;
  }
};


// Send welcome notification to new user
export const sendWelcomeNotification = async (userId: string) => {
  try {
    await sendNotificationToUser(
      userId,
      'ברוכים הבאים! 🎉',
      'תודה שנרשמת לאפליקציה שלנו! אנחנו שמחים לראות אותך.',
      { type: 'welcome' }
    );
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
};

// Send promotional notification
export const sendPromotionalNotification = async (title: string, body: string, data?: any) => {
  try {
    const users = await getAllUsers();
    const usersWithTokens = users.filter(user => user.pushToken && !user.isAdmin); // Don't send to admins
    
    console.log(`📱 Sending promotional notification to ${usersWithTokens.length} users`);
    
    const results = await Promise.allSettled(
      usersWithTokens.map(user => 
        sendPushNotification(user.pushToken!, title, body, data)
      )
    );
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    console.log(`✅ Successfully sent promotional notification to ${successful}/${usersWithTokens.length} users`);
    
    return successful;
  } catch (error) {
    console.error('Error sending promotional notification:', error);
    return 0;
  }
};

// Send notification about new treatment
export const sendNewTreatmentNotification = async (treatmentName: string) => {
  try {
    await sendPromotionalNotification(
      'טיפול חדש! ✂️',
      `טיפול חדש נוסף: ${treatmentName}. בואו לנסות!`,
      { type: 'new_treatment', treatmentName: treatmentName }
    );
  } catch (error) {
    console.error('Error sending new treatment notification:', error);
  }
};

// Send notification about special offer
export const sendSpecialOfferNotification = async (offerTitle: string, offerDescription: string) => {
  try {
    await sendPromotionalNotification(
      `מבצע מיוחד! 🎁`,
      `${offerTitle}: ${offerDescription}`,
      { type: 'special_offer', offerTitle: offerTitle }
    );
  } catch (error) {
    console.error('Error sending special offer notification:', error);
  }
};

// Send notification about new barber
export const sendNewBarberNotification = async (barberName: string) => {
  try {
    await sendPromotionalNotification(
      'ספר חדש! ✂️',
      `ספר חדש הצטרף: ${barberName}. בואו להכיר!`,
      { type: 'new_barber', barberName: barberName }
    );
  } catch (error) {
    console.error('Error sending new barber notification:', error);
  }
};

// Send notification about maintenance
export const sendMaintenanceNotification = async (message: string) => {
  try {
    await sendNotificationToAllUsers(
      'תחזוקה מתוכננת! 🔧',
      message,
      { type: 'maintenance' }
    );
  } catch (error) {
    console.error('Error sending maintenance notification:', error);
  }
};

// Send notification about system update
export const sendSystemUpdateNotification = async (updateDetails: string) => {
  try {
    await sendNotificationToAllUsers(
      'עדכון מערכת! 📱',
      updateDetails,
      { type: 'system_update' }
    );
  } catch (error) {
    console.error('Error sending system update notification:', error);
  }
};

// Send notification about appointment reminder to admin
export const sendAppointmentReminderToAdmin = async (appointmentId: string) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      console.log('Appointment not found');
      return false;
    }
    
    const appointmentData = appointmentDoc.data() as Appointment;
    const appointmentDate = appointmentData.date.toDate();
    
    await sendNotificationToAdmin(
      'תזכורת לתור! ⏰',
      `תור מחר ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
      { appointmentId: appointmentId }
    );
    
    return true;
  } catch (error) {
    console.error('Error sending appointment reminder to admin:', error);
    return false;
  }
};

// Send notification about daily summary to admin
export const sendDailySummaryToAdmin = async () => {
  try {
    const appointments = await getAllAppointments();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayAppointments = appointments.filter(appointment => {
      const appointmentDate = appointment.date.toDate();
      return appointmentDate >= todayStart && appointmentDate < todayEnd;
    });
    
    const confirmedAppointments = todayAppointments.filter(app => app.status === 'confirmed');
    const completedAppointments = todayAppointments.filter(app => app.status === 'completed');
    const cancelledAppointments = todayAppointments.filter(app => app.status === 'cancelled');
    
    const summary = `סיכום יומי: ${confirmedAppointments.length} תורים מאושרים, ${completedAppointments.length} הושלמו, ${cancelledAppointments.length} בוטלו`;
    
    await sendNotificationToAdmin(
      'סיכום יומי 📊',
      summary,
      { type: 'daily_summary' }
    );
    
    return true;
  } catch (error) {
    console.error('Error sending daily summary to admin:', error);
    return false;
  }
};

// Send notification about new user registration to admin
export const sendNewUserNotificationToAdmin = async (userName: string, userEmail: string) => {
  try {
    await sendNotificationToAdmin(
      'משתמש חדש! 👤',
      `משתמש חדש נרשם: ${userName} (${userEmail})`,
      { type: 'new_user', userName: userName, userEmail: userEmail }
    );
  } catch (error) {
    console.error('Error sending new user notification to admin:', error);
  }
};

// Send notification about low appointment slots
export const sendLowSlotsNotificationToAdmin = async (barberName: string, availableSlots: number) => {
  try {
    await sendNotificationToAdmin(
      'פחות מקומות פנויים! ⚠️',
      `לספר ${barberName} נשארו רק ${availableSlots} מקומות פנויים`,
      { type: 'low_slots', barberName: barberName, availableSlots: availableSlots }
    );
  } catch (error) {
    console.error('Error sending low slots notification to admin:', error);
  }
};

// Send notification about appointment confirmation to admin
export const sendAppointmentConfirmationToAdmin = async (appointmentId: string) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      console.log('Appointment not found');
      return false;
    }
    
    const appointmentData = appointmentDoc.data() as Appointment;
    const appointmentDate = appointmentData.date.toDate();
    
    await sendNotificationToAdmin(
      'תור אושר! ✅',
      `תור אושר עבור ${appointmentDate.toLocaleDateString('he-IL')} ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
      { appointmentId: appointmentId }
    );
    
    return true;
  } catch (error) {
    console.error('Error sending appointment confirmation to admin:', error);
    return false;
  }
};

// Send notification about appointment completion to admin
export const sendAppointmentCompletionToAdmin = async (appointmentId: string) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      console.log('Appointment not found');
      return false;
    }
    
    const appointmentData = appointmentDoc.data() as Appointment;
    const appointmentDate = appointmentData.date.toDate();
    
    await sendNotificationToAdmin(
      'תור הושלם! 🎉',
      `תור הושלם עבור ${appointmentDate.toLocaleDateString('he-IL')} ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
      { appointmentId: appointmentId }
    );
    
    return true;
  } catch (error) {
    console.error('Error sending appointment completion to admin:', error);
    return false;
  }
};

// Send notification about appointment cancellation to admin
export const sendAppointmentCancellationToAdmin = async (appointmentId: string) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      console.log('Appointment not found');
      return false;
    }
    
    const appointmentData = appointmentDoc.data() as Appointment;
    const appointmentDate = appointmentData.date.toDate();
    
    await sendNotificationToAdmin(
      'תור בוטל! ❌',
      `תור בוטל עבור ${appointmentDate.toLocaleDateString('he-IL')} ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
      { appointmentId: appointmentId }
    );
    
    return true;
  } catch (error) {
    console.error('Error sending appointment cancellation to admin:', error);
    return false;
  }
};

// Get user notifications
export const getUserNotifications = async (userId: string): Promise<{
  id: string;
  type: 'appointment' | 'general' | 'reminder';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type || 'general',
        title: data.title || 'הודעה',
        message: data.message || '',
        time: data.createdAt?.toDate?.()?.toLocaleTimeString('he-IL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) || 'עכשיו',
        isRead: data.isRead || false
      };
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Clear all user notifications
export const clearAllUserNotifications = async (userId: string): Promise<boolean> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error clearing user notifications:', error);
    return false;
  }
};

// Create a notification for testing
export const createTestNotification = async (userId: string, type: 'appointment' | 'general' | 'reminder', title: string, message: string): Promise<boolean> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error creating test notification:', error);
    return false;
  }
};