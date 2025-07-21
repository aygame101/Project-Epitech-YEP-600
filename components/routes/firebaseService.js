import { db, firebase } from './firebaseConfig';

// Constante pour le solde initial
const INITIAL_WALLET_BALANCE = 500;

// Fonction pour ajouter un utilisateur à la collection 'users'
export const addUser = async (userId, email, username) => {
  if (!userId || !email || !username) {
    throw new Error('User ID, email, and username are required.');
  }

  try {
    await db.collection('users').doc(userId).set({
      email: email,
      username: username,
      walletBalance: INITIAL_WALLET_BALANCE,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`User ${userId} added successfully!`);
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

// Fonction pour récupérer un utilisateur de la collection 'users'
export const getUser = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    const documentSnapshot = await db.collection('users').doc(userId).get();
    if (documentSnapshot.exists) {
      console.log(`User data retrieved for user ${userId}`);
      return documentSnapshot.data();
    } else {
      console.log(`User ${userId} does not exist!`);
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Fonction pour mettre à jour le profil utilisateur
export const updateUserProfile = async (userId, updates) => {
  if (!userId || !updates) {
    throw new Error('User ID and updates are required.');
  }

  try {
    await db.collection('users').doc(userId).update({
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`User profile updated for user ${userId}!`);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
