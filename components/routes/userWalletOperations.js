import {
  initializeWallet,
  updateWalletBalance,
  addTransaction,
  getTransactionHistory
} from './walletService';

// Constantes pour les montants
const INITIAL_BALANCE = 500;
const UPDATED_BALANCE = 600;
const TRANSACTION_AMOUNT = 100;

// Fonction pour gérer le portefeuille d'un utilisateur
export const manageWallet = async (userId) => {
  try {
    // Initialiser le portefeuille
    await initializeWallet(userId, INITIAL_BALANCE);
    console.log(`Wallet initialized with balance ${INITIAL_BALANCE}`);

    // Mettre à jour le solde du portefeuille
    await updateWalletBalance(userId, UPDATED_BALANCE);
    console.log(`Wallet balance updated to ${UPDATED_BALANCE}`);

    // Ajouter une transaction
    await addTransaction(userId, TRANSACTION_AMOUNT, 'deposit', 'Initial deposit');
    console.log('Transaction added');

    // Obtenir l'historique des transactions
    const transactions = await getTransactionHistory(userId);
    console.log('Transactions:', transactions);
  } catch (error) {
    console.error('An error occurred while managing the wallet:', error.message);
    throw error; // Rejeter l'erreur pour une gestion supplémentaire si nécessaire
  }
};

// Exemple d'utilisation pour un utilisateur spécifique
const userId = 'some-user-id';
manageWallet(userId);
