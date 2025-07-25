// app/_layout.tsx
import React, { useState, useEffect } from 'react'
import { Slot, useRouter } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebaseConfig'

export default function RootLayout() {
  const [user,    setUser]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 1) On écoute Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // 2) Dès que loading est terminé, on redirige si besoin
  useEffect(() => {
    if (!loading && user === null) {
      // On remplace la route (pas d'historique)
      router.replace('/loginScreen')
    }
  }, [loading, user])

  // 3) Si on attend toujours la réponse d'Auth, on montre un loader
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // 4) Si on a un user, on rend tout le reste (les écrans sous (tabs))
  //    Si pas de user, on est déjà dans useEffect() allé rediriger.
  return <Slot />
}

const styles = StyleSheet.create({
  loader: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
  }
})
