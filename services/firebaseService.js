import { db } from '../components/firebaseConfig.js';
import { collection, addDoc } from 'firebase/firestore';

// Exemple de fonction pour enregistrer un résultat dans Firestore
export const saveSpinResult = async (result) => {
  try {
    const docRef = await addDoc(collection(db, "spinResults"), {
      result: result,
      timestamp: new Date()
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};
