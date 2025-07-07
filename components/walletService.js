import { db, firebase } from './firebaseConfig';

// Fonction pour initialiser un portefeuille pour un utilisateur
export const initializeWallet = async (userId, initialBalance = 0) => {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    await db.collection('wallets').doc(userId).set({
      balance: initialBalance,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Wallet initialized for user ${userId}!`);
  } catch (error) {
    console.error('Error initializing wallet:', error);
    throw error;
  }
};

// Fonction pour mettre à jour le solde du portefeuille
export const updateWalletBalance = async (userId, newBalance) => {
  if (!userId || newBalance === undefined) {
    throw new Error('User ID and new balance are required.');
  }

  try {
    await db.collection('wallets').doc(userId).update({
      balance: newBalance,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Wallet balance updated for user ${userId}!`);
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

// Fonction pour ajouter une transaction
export const addTransaction = async (userId, amount, type, description) => {
  if (!userId || amount === undefined || !type) {
    throw new Error('User ID, amount, and type are required.');
  }

  try {
    const transactionRef = db.collection('wallets').doc(userId).collection('transactions').doc();
    await transactionRef.set({
      amount: amount,
      type: type,
      description: description || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Transaction added for user ${userId}!`);
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Fonction pour obtenir l'historique des transactions
export const getTransactionHistory = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    const snapshot = await db.collection('wallets').doc(userId).collection('transactions').get();
    const transactions = snapshot.docs.map(doc => doc.data());
    console.log(`Transaction history retrieved for user ${userId}`);
    return transactions;
  } catch (error) {
    console.error('Error getting transaction history:', error);
    throw error;
  }
};
