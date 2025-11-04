import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    Auth,
    getAuth,
    initializeAuth,
    getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration for Naor Amar
const firebaseConfig = {
  apiKey: "AIzaSyATvhrRnzKXrww0ZuvrwcSei9C8Ik1zeAM",
  authDomain: "naor-amar.firebaseapp.com",
  projectId: "naor-amar",
  storageBucket: "naor-amar.firebasestorage.app",
  messagingSenderId: "9527955029",
  appId: "1:9527955029:web:0fbd50fa162ca0f39d4edc",
  measurementId: "G-HPT245ZPBZ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with AsyncStorage persistence for React Native
export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Firebase Collections
export const collections = {
  users: 'users',
  appointments: 'appointments',
  barbers: 'barbers',
  treatments: 'treatments',
  gallery: 'gallery',
  waitlist: 'waitlist',
  businessSettings: 'businessSettings',
  reviews: 'reviews',
  notifications: 'notifications',
  statistics: 'statistics',
} as const;

// Type definitions for Firebase data
export interface User {
  uid: string;
  name: string;
  phone: string;
  phoneE164?: string;
  photoURL?: string;
  createdAt: any;
  type: 'client' | 'barber' | 'admin';
  isBarber?: boolean;
  isAdmin?: boolean;
  barberId?: string;
}

export interface Appointment {
  appointmentId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  barberId: string;
  barberName: string;
  treatmentId: string;
  treatmentName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'scheduled' | 'cancelled' | 'completed' | 'no-show';
  createdAt: any;
  updatedAt?: any;
  notes?: string;
}

export interface Barber {
  barberId: string;
  name: string;
  phone: string;
  phoneE164?: string;
  photo?: string;
  specialization: string;
  experience: number;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  isMainBarber?: boolean;
  available: boolean;
  createdAt: any;
}

export interface Treatment {
  treatmentId: string;
  name: string;
  nameEn?: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  active: boolean;
  popularityScore?: number;
  image?: string;
  createdAt: any;
}

export interface GalleryImage {
  imageId: string;
  url: string;
  uploadedBy: string;
  uploadedByName?: string;
  timestamp: any;
  description?: string;
}

export interface WaitlistEntry {
  waitlistId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  requestedDate: string;
  requestedTime?: string;
  treatmentId: string;
  treatmentName: string;
  barberId?: string;
  status: 'waiting' | 'notified' | 'removed' | 'converted';
  createdAt: any;
  notifiedAt?: any;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  address: string;
  addressEn?: string;
  workingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  slotDuration: number;
  advanceBookingDays: number;
  cancellationPolicy?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  language: string;
  currency: string;
  updatedAt: any;
}

export interface Review {
  reviewId: string;
  barberId: string;
  barberName: string;
  clientId: string;
  clientName: string;
  appointmentId: string;
  rating: number;
  comment?: string;
  createdAt: any;
}

export interface Notification {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: 'appointment' | 'reminder' | 'cancellation' | 'system';
  data?: any;
  read: boolean;
  createdAt: any;
}

export default app;

