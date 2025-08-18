// app/(tabs)/index.tsx
import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native'
import { auth, db } from '../../config/firebaseConfig'
import { doc, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import DailyBonusComponent from '../../components/DailyBonusComponent' // vérifie bien le nom du fichier

const games = [
  { label: '🤑 Slots',    screen: 'defslot' },
  // { label: '🎡 Roulette', screen: 'Roulette' },
  { label: '🃏 Blackjack',screen: 'blackjack' },
]

export default function GameSelection() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)

  // Abonnement en temps réel au doc Users/{uid} pendant que l'écran est focus
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser
      if (!user) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'loginScreen' }],
          })
        )
        return
      }

      setLoading(true)
      const ref = doc(db, 'Users', user.uid)
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as any
            setUserName(data.userName || '')
            setWalletBalance(data.walletBalance ?? 0)
          } else {
            // Doc supprimé / introuvable
            setUserName('')
            setWalletBalance(0)
          }
          setLoading(false)
        },
        (err) => {
          console.error('Erreur onSnapshot profil', err)
          setLoading(false)
        }
      )

      // Cleanup quand on quitte l'écran
      return () => unsubscribe()
    }, [navigation])
  )

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'loginScreen' }],
        })
      )
    } catch (e) {
      console.error('Erreur de déconnexion', e)
    }
  }, [navigation])

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Bonjour <Text style={styles.highlight}>{userName || 'Joueur'}</Text> !
      </Text>
      <Text style={styles.balance}>
        Solde : <Text style={styles.highlight}>{walletBalance} jets</Text>
      </Text>

      <DailyBonusComponent />

      <Text style={styles.title}>Choisis ton jeu</Text>
      {games.map((g) => (
        <TouchableOpacity
          key={g.screen}
          style={styles.button}
          onPress={() => navigation.navigate(g.screen as never)}
        >
          <Text style={styles.buttonText}>{g.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 4,
  },
  balance: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 20,
  },
  highlight: {
    color: '#e94560',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    marginBottom: 30,
    color: '#e94560',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    marginVertical: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(233, 69, 96, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#e94560',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  logoutText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
})
