import { addUser, getUser, updateWalletBalance } from './firebaseService';
import { signUp, signIn } from './authService';

// Constantes pour les informations d'utilisateur par défaut
const DEFAULT_EMAIL = 'user@example.com';
const DEFAULT_PASSWORD = 'password123';
const DEFAULT_USERNAME = 'defaultUser';
const INITIAL_BALANCE = 500;

// Fonction pour gérer l'authentification
export const manageAuth = async () => {
  try {
    const userCredential = await signUp(DEFAULT_EMAIL, DEFAULT_PASSWORD);
    const userId = userCredential.uid;
    console.log('Signed up user with ID:', userId);

    const signedInUserCredential = await signIn(DEFAULT_EMAIL, DEFAULT_PASSWORD);
    console.log('Signed in user with ID:', signedInUserCredential.uid);
  } catch (error) {
    console.error('An error occurred during authentication:', error.message);
    throw error;
  }
};

// Fonction pour gérer les opérations utilisateur
export const manageUser = async (userId, email = DEFAULT_EMAIL, username = DEFAULT_USERNAME, newBalance) => {
  if (!userId || !newBalance) {
    throw new Error('User ID and new balance are required.');
  }

  try {
    await addUser(userId, email, username, INITIAL_BALANCE);
    const user = await getUser(userId);

    if (user) {
      console.log('User retrieved:', user);
      await updateWalletBalance(userId, newBalance);
      console.log('User balance updated successfully to:', newBalance);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('An error occurred while managing the user:', error.message);
    throw error;
  }
};
