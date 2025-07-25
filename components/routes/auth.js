import React, { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native'
import { auth, db } from '../../config/firebaseConfig'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore'

export const Auth = () => {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Fonction partagée après auth (signup ou signin)
  const onAuthSuccess = async (user) => {
    const userRef = doc(db, 'Users', user.uid)
    const snap    = await getDoc(userRef)

    if (!snap.exists()) {
      // Crée le profil s’il n’existe pas
      await setDoc(userRef, {
        email,
        userId:        user.uid,
        userName:      '',
        walletBalance: 1000
      })
      Alert.alert('Profil créé', 'Solde initial : 500 coins')
    } else {
      const data = snap.data()
      Alert.alert(
        'Bienvenue',
        `Salut ${data.userName || 'joueur'} ! Solde : ${data.walletBalance}`
      )
    }

    // TODO : naviguer vers l’écran principal ici
  }

  // Fonction unifiée pour signup puis signin en fallback
  const handleAuth = async () => {
    try {
      // 1. Tentative de création de compte
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await onAuthSuccess(user)

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          // 2. Si existe déjà, tenter la connexion
          const { user } = await signInWithEmailAndPassword(auth, email, password)
          await onAuthSuccess(user)
        } catch (signErr) {
          Alert.alert('Erreur', signErr.message)
        }
      } else {
        Alert.alert('Erreur', err.message)
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎰 Bienvenue</Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse e-mail"
        placeholderTextColor="rgba(255,255,255,0.7)"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="rgba(255,255,255,0.7)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
        <Text style={styles.buttonText}>Valider</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems:  'center',
    padding:     30,
    backgroundColor: '#1a1a2e'
  },
  title: {
    fontSize:     28,
    marginBottom: 30,
    color:        '#e94560',
    fontWeight:   'bold'
  },
  input: {
    width:             '100%',
    height:            50,
    backgroundColor:   'rgba(255,255,255,0.1)',
    borderRadius:      25,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.3)',
    marginBottom:      20,
    paddingHorizontal: 20,
    color:             '#fff',
    fontSize:          16
  },
  primaryButton: {
    width:           '100%',
    height:          50,
    borderRadius:    25,
    backgroundColor: '#e94560',
    justifyContent:  'center',
    alignItems:      'center'
  },
  buttonText: {
    color:      '#fff',
    fontSize:   16,
    fontWeight: '600'
  }
})

export default Auth
