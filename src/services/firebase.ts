import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

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
