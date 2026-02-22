import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, connectAuthEmulator, getReactNativePersistence } from '@firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD1U0wFe4Hv-t1PiLs2RQH_Bj7SKKGEqrw',
  authDomain: 'dating-app-551a5.firebaseapp.com',
  projectId: 'dating-app-551a5',
  storageBucket: 'dating-app-551a5.firebasestorage.app',
  messagingSenderId: '468683095447',
  appId: '1:468683095447:web:ad9deeafec425a48f218d2',
  measurementId: 'G-XRBPH7J5Y2',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Ensure auth uses device storage so sessions persist across app restarts.
export const auth = getApps().length === 0
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const useEmulator = __DEV__ && process.env.EXPO_USE_FIREBASE_EMULATOR === 'true';
const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

if (useEmulator) {
  connectFirestoreEmulator(db, host, 8080);
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectStorageEmulator(storage, host, 9199);
}
