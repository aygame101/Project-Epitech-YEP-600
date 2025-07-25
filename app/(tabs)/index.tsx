import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { auth, db } from '../../config/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'

const games = [
  { label: '🤑 Slots',    screen: 'defslot' },
  // { label: '🎡 Roulette', screen: 'Roulette' },
  // { label: '🃏 Blackjack',screen: 'Blackjack' },
]

export default function GameSelection() {
  const navigation = useNavigation()
  const [loading, setLoading]             = useState(true)
  const [userName, setUserName]           = useState('')
  const [walletBalance, setWalletBalance] = useState(0)

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const user = auth.currentUser
      if (!user) {
        // redirection propre vers LoginScreen
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'loginScreen' }],
          })
        )
        return
      }

      // si connecté, on charge le profil
      try {
        const snap = await getDoc(doc(db, 'Users', user.uid))
        if (snap.exists()) {
          const data = snap.data()
          setUserName(data.userName || '')
          setWalletBalance(data.walletBalance || 0)
        } else {
          console.warn('Profil introuvable pour', user.uid)
        }
      } catch (e) {
        console.error('Erreur lecture profil', e)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoad()
  }, [navigation])

  const handleLogout = async () => {
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
  }

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

      <Text style={styles.title}>Choisis ton jeu</Text>
      {games.map((g) => (
        <TouchableOpacity
          key={g.screen}
          style={styles.button}
          onPress={() =>
            navigation.navigate(g.screen as never)
          }
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
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
    backgroundColor:'#1a1a2e'
  },
  container: {
    flex:           1,
    justifyContent: 'flex-start',
    alignItems:     'center',
    backgroundColor:'#1a1a2e',
    padding:        20,
    paddingTop:     60,
  },
  greeting: {
    fontSize:     24,
    color:        '#fff',
    marginBottom: 4,
  },
  balance: {
    fontSize:     18,
    color:        '#ccc',
    marginBottom: 20,
  },
  highlight: {
    color:      '#e94560',
    fontWeight: 'bold',
  },
  title: {
    fontSize:     32,
    marginBottom: 30,
    color:        '#e94560',
    fontWeight:   'bold',
    textAlign:    'center',
  },
  button: {
    width:           '80%',
    paddingVertical: 15,
    marginVertical: 10,
    borderRadius:    30,
    backgroundColor: 'rgba(233, 69, 96, 0.9)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  buttonText: {
    color:      '#fff',
    fontSize:   18,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop:        40,
    borderWidth:      1,
    borderColor:      '#e94560',
    paddingVertical:  12,
    paddingHorizontal:30,
    borderRadius:     25,
  },
  logoutText: {
    color:      '#e94560',
    fontSize:   16,
    fontWeight: '600',
  },
})
