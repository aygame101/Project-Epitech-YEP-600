// components/DailyBonusComponent.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, Alert, TouchableOpacity } from 'react-native'
import { auth, listenDailyBonusStatus, claimDailyBonusClient } from '../config/firebaseConfig'

const DailyBonusComponent = () => {
  const [bonusStatus, setBonusStatus] = useState({ canClaim: false, hoursRemaining: 0 })
  const promptedRef = useRef(false)

  const claimDailyBonus = useCallback(async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      const res = await claimDailyBonusClient(user.uid)
      Alert.alert('Bonus quotidien', res.message)
      // On réinitialise le flag pour autoriser une nouvelle alerte le lendemain
      promptedRef.current = false
    } catch (error) {
      console.error('Erreur lors de la réclamation du bonus:', error)
      Alert.alert('Erreur', "Impossible de réclamer le bonus.")
    }
  }, [])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const unsubscribe = listenDailyBonusStatus(user.uid, setBonusStatus)
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (bonusStatus.canClaim && !promptedRef.current) {
      promptedRef.current = true
      Alert.alert(
        'Bonus quotidien',
        'Vous pouvez réclamer votre bonus quotidien !',
        [
          { text: 'Réclamer', onPress: claimDailyBonus },
          { text: 'Plus tard', style: 'cancel' }
        ]
      )
    }
  }, [bonusStatus.canClaim, claimDailyBonus])

  return (
    <View style={{ alignItems: 'center', marginBottom: 16 }}>
      {bonusStatus.canClaim ? (
        <>
          <Text style={{ color: '#fff', marginBottom: 8 }}>
            Vous pouvez réclamer votre bonus quotidien !
          </Text>
          <TouchableOpacity
            onPress={claimDailyBonus}
            style={{
              backgroundColor: '#e94560',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 20
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Réclamer maintenant</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={{ color: '#ccc' }}>
          Temps restant avant de pouvoir réclamer le bonus : {bonusStatus.hoursRemaining} heures
        </Text>
      )}
    </View>
  )
}

export default DailyBonusComponent
