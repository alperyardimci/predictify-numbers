import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';
// @ts-ignore — RN type declarations don't include browserLocalPersistence
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage),
});
