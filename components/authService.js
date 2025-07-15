import React, { useState } from 'react';
import { auth, db } from './firebaseConfig';
import { firebase } from '@react-native-firebase/firestore';

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const signUp = async () => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log(`User account created & signed in! User ID: ${user.uid}`);

      // Ajouter des données utilisateur à Firestore
      await db.collection('Users').doc(user.uid).set({
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      setError(error.message);
      console.error('Error during sign up:', error.message);
    }
  };

  const signIn = async () => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      console.log(`User signed in! User ID: ${userCredential.user.uid}`);
    } catch (error) {
      setError(error.message);
      console.error('Error during sign in:', error.message);
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
      <button onClick={signIn}>Sign In</button>
      <button onClick={signUp}>Sign Up</button>
    </div>
  );
};
