/* import { auth, db } from './firebaseConfig';
import { firebase } from '@react-native-firebase/firestore';
import React, { useState } from 'react';

export const signUp = async (email, password) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log(`User account created & signed in! User ID: ${user.uid}`);

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
 */