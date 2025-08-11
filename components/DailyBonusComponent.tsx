import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../config/firebaseConfig';
import { listenDailyBonusStatus } from '../functions/daily_bonus';

const functions = getFunctions();

const DailyBonusComponent = () => {
  const [bonusStatus, setBonusStatus] = useState({ canClaim: false, hoursRemaining: 0 });

  const claimDailyBonus = useCallback(async () => {
    try {
      const claimBonus = httpsCallable(functions, 'claimDailyBonus');
      const result = await claimBonus({});
      Alert.alert("Bonus quotidien", result.data.message);
    } catch (error) {
      console.error("Erreur lors de la réclamation du bonus:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la réclamation du bonus.");
    }
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = listenDailyBonusStatus(user.uid, setBonusStatus);
      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    if (bonusStatus.canClaim) {
      Alert.alert(
        "Bonus quotidien",
        "Vous pouvez réclamer votre bonus quotidien !",
        [
          {
            text: "Réclamer",
            onPress: claimDailyBonus,
          },
          { text: "Plus tard", style: "cancel" },
        ]
      );
    }
  }, [bonusStatus.canClaim, claimDailyBonus]);

  return (
    <View>
      {bonusStatus.canClaim ? (
        <Text>Vous pouvez réclamer votre bonus quotidien !</Text>
      ) : (
        <Text>Temps restant avant de pouvoir réclamer le bonus : {bonusStatus.hoursRemaining} heures</Text>
      )}
    </View>
  );
};

export default DailyBonusComponent;
