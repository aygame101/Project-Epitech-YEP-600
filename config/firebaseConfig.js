// config/firebaseConfig.js
import Constants from 'expo-constants'
import { initializeApp, getApps } from 'firebase/app'
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth'
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore'

// --- Chargement de la config Expo ---
const expoExtra = Constants.manifest?.extra ?? Constants.expoConfig?.extra

const firebaseConfig = {
  apiKey: expoExtra.API_KEY,
  authDomain: expoExtra.AUTH_DOMAIN,
  projectId: expoExtra.PROJECT_ID,
  storageBucket: expoExtra.STORAGE_BUCKET,
  messagingSenderId: expoExtra.MESSAGING_SENDER_ID,
  appId: expoExtra.APP_ID,
  measurementId: expoExtra.MEASUREMENT_ID
}

// --- Init App ---
if (!getApps().length) {
  initializeApp(firebaseConfig)
}

// --- Services ---
export const auth = initializeAuth(getApps()[0], {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
})
export const db = getFirestore()

/**
 * Ecoute l'état du bonus depuis le doc Firestore Users/{uid}
 * -> calcule canClaim + hoursRemaining
 */
export function listenDailyBonusStatus(userId, callback) {
  if (!userId) return () => {}

  const userDocRef = doc(db, 'Users', userId)
  const unsubscribe = onSnapshot(userDocRef, (snap) => {
    const data = snap.data() || {}

    const lastField = data.lastDailyBonusClaimedAt
    const last =
      lastField instanceof Timestamp
        ? lastField.toMillis()
        : typeof lastField === 'number'
        ? lastField
        : 0

    const now = Date.now()
    const ONE_DAY_MS = 24 * 60 * 60 * 1000

    const canClaim = now - last >= ONE_DAY_MS
    const timeRemaining = canClaim ? 0 : (last + ONE_DAY_MS) - now
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60))

    callback({ canClaim, hoursRemaining })
  })

  return unsubscribe
}

/**
 * Réclamation du bonus côté client, transaction Firestore
 * - +100 sur walletBalance
 * - lastDailyBonusClaimedAt = serverTimestamp()
 * - Refus si < 24h depuis le dernier claim
 */
export async function claimDailyBonusClient(uid) {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  const BONUS_AMOUNT = 100
  const ref = doc(db, 'Users', uid)

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) {
      throw new Error('profil-not-found')
    }
    const data = snap.data() || {}
    const lastField = data.lastDailyBonusClaimedAt
    const last =
      lastField instanceof Timestamp
        ? lastField.toMillis()
        : typeof lastField === 'number'
        ? lastField
        : 0

    const now = Date.now()
    if (now - last < ONE_DAY_MS) {
      const hrs = Math.ceil(((last + ONE_DAY_MS) - now) / (1000 * 60 * 60))
      return {
        status: 'failure',
        message: `Revenez dans ${hrs} heure(s) pour votre prochain bonus.`
      }
    }

    tx.update(ref, {
      walletBalance: increment(BONUS_AMOUNT),
      lastDailyBonusClaimedAt: serverTimestamp()
    })

    return { status: 'success', message: `Bonus de ${BONUS_AMOUNT} réclamé !` }
  })
}

// --- Utilitaires profil ---
export async function saveUserProfile(userId, profileData) {
  try {
    await setDoc(doc(db, 'Users', userId), profileData, { merge: true })
    console.log('Profil utilisateur sauvegardé avec succès !')
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du profil utilisateur:', error)
    throw error
  }
}

export async function getUserProfile(userId) {
  try {
    const snap = await getDoc(doc(db, 'Users', userId))
    if (snap.exists()) {
      return snap.data()
    }
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error)
    throw error
  }
}
