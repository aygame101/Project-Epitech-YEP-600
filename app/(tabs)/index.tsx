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
import { useRouter } from 'expo-router'
import { auth, db } from '../../config/firebaseConfig'
import { doc, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import DailyBonusComponent from '../../components/services/DailyBonus'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'

const games = [
  { label: '🤑 Slots',    screen: 'defslot' },
  // { label: '🎡 Roulette', screen: 'Roulette' },
  { label: '🃏 Blackjack',screen: 'blackjack' },
]

export default function GameSelection() {
  const navigation = useNavigation()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)

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
    <SafeAreaView style={styles.container}>
      {/* --- Boutons flottants (absolus) : positionne-les plus bas avec ACTIONS_TOP_OFFSET --- */}
      <View style={styles.actionsOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('scoreboard' as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.iconButtonText}>🏆</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/chat')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.iconButtonText}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* Titre centré */}
      <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
        Bonjour <Text style={styles.highlight}>{userName || 'Joueur'}</Text> !
      </Text>

      {/* Sous-titre centré */}
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
    </SafeAreaView>
  )
}

const ICON_SIZE = 50
// ➜ Ajuste cette valeur pour monter/descendre les deux boutons sans bouger le texte
const ACTIONS_TOP_OFFSET = 68

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
    paddingTop: 20,
  },

  // --- Overlay absolu pour les deux boutons (gauche/droite) ---
  actionsOverlay: {
    position: 'absolute',
    top: ACTIONS_TOP_OFFSET,
    left: 20,
    right: 20,
    height: ICON_SIZE,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  iconButton: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    borderWidth: 1,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 18,
    color: '#e94560',
  },

  greeting: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  balance: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
    alignSelf: 'stretch',
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
