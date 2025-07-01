// src/screens/GameScreen.js
import { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet
} from 'react-native';
import SlotMachineWebView from '../components/SlotMachineWebView';
import { useUser } from '../context/UserContext'; // Votre contexte utilisateur
import { updateUserBalance } from '../services/firebase'; // Vos services Firebase

const GameScreen = ({ navigation }) => {
  const { user, updateUser } = useUser();
  const [balance, setBalance] = useState(user?.balance || 1000);
  const [isLoading, setIsLoading] = useState(false);

  const handleBalanceChange = async (newBalance) => {
    try {
      setBalance(newBalance);
      
      // Mettre à jour Firebase
      await updateUserBalance(user.id, newBalance);
      
      // Mettre à jour le contexte local
      updateUser({ ...user, balance: newBalance });
      
    } catch (error) {
      console.error('Erreur mise à jour balance:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le solde');
    }
  };

  const handleWin = (winData) => {
    console.log('Gain!', winData);
    
    // Afficher notification de gain
    if (winData.amount > 100) {
      Alert.alert(
        'Gros gain! 🎉',
        `Vous avez gagné ${winData.amount}!`,
        [{ text: 'Super!' }]
      );
    }
    
    // Analytics
    // logWinEvent(winData);
  };

  const handleGameError = (error) => {
    console.error('Erreur jeu:', error);
    Alert.alert(
      'Erreur de jeu',
      'Une erreur est survenue pendant le jeu.',
      [
        { text: 'Retour', onPress: () => navigation.goBack() },
        { text: 'Réessayer', onPress: () => {} }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      <SlotMachineWebView
        balance={balance}
        onBalanceChange={handleBalanceChange}
        onWin={handleWin}
        onError={handleGameError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default GameScreen;