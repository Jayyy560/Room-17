import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: 'AIzaSyD1U0wFe4Hv-t1PiLs2RQH_Bj7SKKGEqrw',
  authDomain: 'dating-app-551a5.firebaseapp.com',
  projectId: 'dating-app-551a5',
  storageBucket: 'dating-app-551a5.firebasestorage.app',
  messagingSenderId: '468683095447',
  appId: '1:468683095447:web:ad9deeafec425a48f218d2',
  measurementId: 'G-XRBPH7J5Y2',
};

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();

// initializeAuth MUST be called (not just getAuth) in React Native / Firebase v10.
// In Expo Go the native persistence module isn't available, so skip AsyncStorage there.
const isExpoGo = Constants.appOwnership === 'expo';

const persistence = isExpoGo
  ? undefined
  : require('@firebase/auth/dist/rn/index').getReactNativePersistence(AsyncStorage);

export const auth = isNewApp
  ? initializeAuth(app, persistence ? { persistence } : undefined)
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
