import Constants from 'expo-constants';
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Récupère extra depuis manifest ou expoConfig selon le contexte
const expoExtra = Constants.manifest?.extra ?? Constants.expoConfig?.extra;

const firebaseConfig = {
  apiKey:              expoExtra.API_KEY,
  authDomain:          expoExtra.AUTH_DOMAIN,
  projectId:           expoExtra.PROJECT_ID,
  storageBucket:       expoExtra.STORAGE_BUCKET,
  messagingSenderId:   expoExtra.MESSAGING_SENDER_ID,
  appId:               expoExtra.APP_ID,
  measurementId:       expoExtra.MEASUREMENT_ID,
};

// Initialisation de l'app Firebase si nécessaire
if (!getApps().length) {
  console.log(expoExtra.API_KEY)
  initializeApp(firebaseConfig);
}

// Initialisation de l'auth avec persistance AsyncStorage
export const auth = initializeAuth(getApps()[0], {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Service Firestore
export const db = getFirestore();
