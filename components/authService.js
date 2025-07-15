import { auth, db } from './firebaseConfig';
import { firebase } from '@react-native-firebase/firestore';
import React, { useState } from 'react';

// Fonction pour l'inscription
export const signUp = async (email, password) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log(`User account created & signed in! User ID: ${user.uid}`);

    // Ajouter des données utilisateur à Firestore
    await db.collection('Users').doc(user.uid).set({
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return user;
  } catch (error) {
    console.error('Error during sign up:', error.message);
    throw new Error(error.message);
  }
};

// Fonction pour la connexion
export const signIn = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    console.log(`User signed in! User ID: ${userCredential.user.uid}`);
    return userCredential.user;
  } catch (error) {
    console.error('Error during sign in:', error.message);
    throw new Error(error.message);
  }
};

// Composant Auth
export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignUp = async () => {
    try {
      await signUp(email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        placeholder="Email..."
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password..."
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignIn}>Sign In</button>
      <button onClick={handleSignUp}>Sign Up</button>
    </div>
  );
};
