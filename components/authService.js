import { auth, db } from './firebaseConfig';
import { firebase } from '@react-native-firebase/firestore';

// Inscription avec email et mot de passe
const signUp = async (email, password) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log(`User account created & signed in! User ID: ${user.uid}`);

    // Ajouter des données utilisateur à Firestore
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return user;
  } catch (error) {
    console.error('Error during sign up:', error.message);
    throw new Error(`Sign up failed: ${error.message}`);
  }
};

// Connexion avec email et mot de passe
const signIn = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    console.log(`User signed in! User ID: ${userCredential.user.uid}`);
    return userCredential.user;
  } catch (error) {
    console.error('Error during sign in:', error.message);
    throw new Error(`Sign in failed: ${error.message}`);
  }
};

export { signUp, signIn };
