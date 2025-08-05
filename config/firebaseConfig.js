import Constants from 'expo-constants';
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Configuration Firebase pour l'application Expo
const expoExtra = Constants.manifest?.extra ?? Constants.expoConfig?.extra;
const firebaseConfig = {
  apiKey: expoExtra.API_KEY,
  authDomain: expoExtra.AUTH_DOMAIN,
  projectId: expoExtra.PROJECT_ID,
  storageBucket: expoExtra.STORAGE_BUCKET,
  messagingSenderId: expoExtra.MESSAGING_SENDER_ID,
  appId: expoExtra.APP_ID,
  measurementId: expoExtra.MEASUREMENT_ID,
};

// Initialiser Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// Initialiser les services Firebase
export const auth = initializeAuth(getApps()[0], {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore();
export const realtimeDb = getDatabase(getApps()[0]);
export const functions = getFunctions(getApps()[0]);

// Fonction pour vérifier le statut du bonus quotidien dans Realtime Database
export function listenDailyBonusStatus(userId, callback) {
  const userBonusRef = ref(realtimeDb, `users/${userId}/lastDailyBonusClaimedAt`);
  onValue(userBonusRef, (snapshot) => {
    const lastClaimedAt = snapshot.val() || 0;
    const currentTime = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (currentTime - lastClaimedAt >= ONE_DAY_MS) {
      callback({ canClaim: true, hoursRemaining: 0 });
    } else {
      const timeRemaining = (lastClaimedAt + ONE_DAY_MS) - currentTime;
      const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
      callback({ canClaim: false, hoursRemaining });
    }
  });
}

// Callable pour réclamer le bonus
export const claimBonusCallable = httpsCallable(functions, 'claimDailyBonus');

// Fonction utilitaire pour réclamer le bonus
export async function handleClaimButtonClick() {
  try {
    const result = await claimBonusCallable();
    return result.data; // { status, message }
  } catch (error) {
    console.error("Erreur lors de l'appel de la fonction de bonus:", error);
    throw error;
  }
}

// Fonction pour sauvegarder le profil utilisateur
export async function saveUserProfile(userId, profileData) {
  try {
    await setDoc(doc(db, "users", userId), profileData);
    console.log("Profil utilisateur sauvegardé avec succès !");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du profil utilisateur:", error);
    throw error;
  }
}

// Fonction pour récupérer le profil utilisateur
export async function getUserProfile(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Profil utilisateur récupéré:", docSnap.data());
      return docSnap.data();
    } else {
      console.log("Aucun profil utilisateur trouvé !");
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du profil utilisateur:", error);
    throw error;
  }
}
