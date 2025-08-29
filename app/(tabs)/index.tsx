// app/(tabs)/index.tsx
import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native'
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { auth, db } from '../../config/firebaseConfig'
import { doc, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import DailyBonus from '../../components/services/DailyBonus'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'

const games = [
  { label: '🤑 Machines à Sous', screen: 'defslot' },
  { label: '🃏 Blackjack', screen: 'blackjack' },
  { label: '🎡 Roulette', screen: 'roulette' },
]

export default function GameSelection() {
  const navigation = useNavigation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

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
        <ActivityIndicator size="large" color="#ff3e80" />
      </View>
    )
  }

  // Hauteur de la barre + safe-area pour caler le ScrollView
  const BAR_HEIGHT = ICON_SIZE + 30
  const scrollExtraBottom = BAR_HEIGHT + insets.bottom + 20

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: scrollExtraBottom }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Informations utilisateur */}
        <View style={styles.userInfoContainer}>
          <View style={styles.headerGrid}>
            {/* 1fr – spacer gauche */}
            <View style={styles.colLeft} />

            {/* 4fr – div1 : Bonjour + Solde, centrés et empilés */}
            <View style={styles.div1}>
              <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
                Bonjour <Text style={styles.highlight}>{userName || 'Joueur'}</Text> !
              </Text>
              <Text style={styles.balance} numberOfLines={1}>
                Solde : <Text style={styles.highlight}>{walletBalance} jets</Text>
              </Text>
            </View>

            {/* 1fr – div2 : bouton bonus */}
            <View style={styles.div2}>
              <DailyBonus buttonStyle={styles.bonusButton} textStyle={styles.bonusButtonText} />
            </View>
          </View>
        </View>


        {/* Sélection de jeux */}
        <Text style={styles.title}>Choisis ton jeu</Text>

        <View style={styles.gamesContainer}>
          {games.map((g) => (
            <TouchableOpacity
              key={g.screen}
              style={styles.gameButton}
              onPress={() => navigation.navigate(g.screen as never)}
            >
              <Text style={styles.gameButtonText}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton de déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Barre d'actions en bas – OPAQUE JUSQU'AU BORD */}
      <View
        style={[
          styles.actionsBottom,
          {
            bottom: 0,                          // ancré tout en bas
            height: BAR_HEIGHT + insets.bottom, // inclut le safe-area
            paddingBottom: insets.bottom,       // espace pour le menton/gestures
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('dashboard' as never)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.iconButtonText}>📊</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('scoreboard' as never)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.iconButtonText}>🏆</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/chat')}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.iconButtonText}>💬</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const ICON_SIZE = 50
const MINI_ICON = 40

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1123',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f1123',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    // plus de paddingBottom ici : il est géré dynamiquement au-dessus
  },
  logo: {
    fontSize: 50,
    marginBottom: 20,
    textAlign: 'center',
  },

  // titre :
  userInfoContainer: {
    width: '100%',
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  headerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 60, // ajustable
  },
  colLeft: {
    flex: 1,
  },
  div1: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  div2: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greeting: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '500',
  },
  balance: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
  },

  // 🎁 bouton bonus (même style que les icônes du bas, en compact)
  bonusButton: {
    width: MINI_ICON,
    height: MINI_ICON,
    borderRadius: MINI_ICON / 2,
    backgroundColor: 'rgba(255, 62, 128, 0.15)',
    borderWidth: 1,
    borderColor: '#ff3e80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusButtonText: {
    fontSize: 20,
    color: '#ff3e80',
    fontWeight: '600',
  },

  highlight: {
    color: '#ff3e80',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    marginBottom: 25,
    color: '#ff3e80',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 62, 128, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // boutons jeux
  gamesContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 30,
  },
  gameButton: {
    width: '100%',
    paddingVertical: 18,
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ff3e80',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff3e80',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  gameButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoutButton: {
    marginTop: 30,
    borderWidth: 2,
    borderColor: '#ff3e80',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  logoutText: {
    color: '#ff3e80',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0f1123', // opaque
    borderTopWidth: 1,
    borderColor: 'rgba(255, 62, 128, 0.3)',
    paddingHorizontal: 20,
    elevation: 10, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconButton: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: 'rgba(255, 62, 128, 0.15)',
    borderWidth: 1,
    borderColor: '#ff3e80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 22,
    color: '#ff3e80',
  },
})
