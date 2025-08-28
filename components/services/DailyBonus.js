// components/services/DailyBonus.js
import React, { useEffect, useState, useCallback } from 'react'
import { TouchableOpacity, Text, Alert } from 'react-native'
import { auth, listenDailyBonusStatus, claimDailyBonusClient } from '../../config/firebaseConfig'

export default function DailyBonus({ buttonStyle, textStyle }) {
  const [canClaim, setCanClaim] = useState(false)
  const [justClaimed, setJustClaimed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    const unsub = listenDailyBonusStatus(user.uid, (s) => {
      setCanClaim(!!(s && s.canClaim))
      if (!(s && s.canClaim)) setJustClaimed(false)
    })
    return () => unsub()
  }, [])

  const onPress = useCallback(async () => {
    if (loading) return
    const user = auth.currentUser
    if (!user) return
    try {
      setLoading(true)
      const res = await claimDailyBonusClient(user.uid)
      Alert.alert('Bonus quotidien', (res && res.message) || 'Opération effectuée.')
      if (res && res.status === 'success') {
        setJustClaimed(true) // masque immédiatement le bouton
      }
    } catch (e) {
      console.error(e)
      Alert.alert('Erreur', "Impossible de réclamer le bonus.")
    } finally {
      setLoading(false)
    }
  }, [loading])

  // N'affiche le bouton 🎁 que si claimable et pas déjà réclamé localement
  if (!canClaim || justClaimed) return null

  return (
    <TouchableOpacity
      accessibilityLabel="Réclamer le bonus quotidien"
      onPress={onPress}
      disabled={loading}
      style={buttonStyle}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Text style={textStyle}>🎁</Text>
    </TouchableOpacity>
  )
}
