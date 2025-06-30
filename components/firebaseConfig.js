// Configuration de base pour Firebase
import { initializeApp } from '@react-native-firebase/app';
import { getDatabase } from '@react-native-firebase/database';
//import analytics from '@react-native-firebase/analytics';
import Config from 'react-native-config';

// Configuration Firebase
const firebaseConfig = {
  apiKey: Config.API_KEY,
  authDomain: Config.AUTH_DOMAIN,
  projectId: Config.PROJECT_ID,
  storageBucket: Config.STORAGE_BUCKET,
  messagingSenderId: Config.MESSAGING_SENDER_ID,
  appId: Config.APP_ID,
  measurementId: Config.MEASUREMENT_ID,
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Obtenir l'instance de Firestore
const database = getDatabase(app);

// Déjà setup si besoin d'utiliser les données de la bdd
// pour intégration IA

// const analyticsInstance = analytics();
// const analytics = analyticsInstance;