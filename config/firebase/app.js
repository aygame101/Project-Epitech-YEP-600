import Constants from 'expo-constants'
import { initializeApp, getApps } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore, setLogLevel } from 'firebase/firestore'

// Récupération des secrets Expo
const expoExtra = Constants.manifest?.extra ?? Constants.expoConfig?.extra
const firebaseConfig = {
    apiKey: expoExtra.API_KEY,
    authDomain: expoExtra.AUTH_DOMAIN,
    projectId: expoExtra.PROJECT_ID,
    storageBucket: expoExtra.STORAGE_BUCKET,
    messagingSenderId: expoExtra.MESSAGING_SENDER_ID,
    appId: expoExtra.APP_ID,
    measurementId: expoExtra.MEASUREMENT_ID,
}

// Init (idempotent)
if (!getApps().length) initializeApp(firebaseConfig)
setLogLevel('error')

export const auth = initializeAuth(getApps()[0], {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
})

export const db = getFirestore()
