import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: '***REMOVED***',
  authDomain: 'predictifynumbers-d199d.firebaseapp.com',
  databaseURL: 'https://predictifynumbers-d199d-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'predictifynumbers-d199d',
  storageBucket: 'predictifynumbers-d199d.firebasestorage.app',
  messagingSenderId: '21074375254',
  appId: '1:21074375254:web:27011e4bc595e22ea881f7',
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Auth — use AsyncStorage persistence on native, default on web
// getReactNativePersistence is exported from the RN entry point (Metro resolves it)
// but TypeScript's type checker sees the default entry. We use require() to bypass.
let _auth: Auth;
if (Platform.OS === 'web') {
  _auth = getAuth(app);
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require('firebase/auth');
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
export const auth = _auth;

export const functions = getFunctions(app, 'europe-west1');
