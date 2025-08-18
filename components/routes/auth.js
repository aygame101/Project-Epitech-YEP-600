// components/routes/auth.js
import React, { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { auth, db } from '../../config/firebaseConfig'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  runTransaction
} from 'firebase/firestore'


// Normalise le pseudo pour les IDs de doc
const normalizeUsername = (s) => s.trim().toLowerCase()
// Règle simple de validation: 3–20 chars a-z 0-9 _
const isValidUsername = (s) => /^[a-z0-9_]{3,20}$/.test(s)

import { Dimensions } from 'react-native'


export const Auth = () => {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)

  // Connexion
  const [identifier, setIdentifier] = useState('') // email ou username
  const [loginPassword, setLoginPassword] = useState('')

  // Création
  const [email, setEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [signPassword, setSignPassword] = useState('')

  // --- LOGIN ---
  const handleLogin = async () => {
    try {
      let loginEmail = identifier.trim()

      // Si ce n'est PAS un email -> on récupère l'email via le mapping Usernames/{usernameLower}
      if (!loginEmail.includes('@')) {
        const usernameLower = normalizeUsername(loginEmail)
        const mapSnap = await getDoc(doc(db, 'Usernames', usernameLower))
        if (!mapSnap.exists()) {
          return Alert.alert('Erreur', 'Utilisateur introuvable')
        }
        loginEmail = mapSnap.data().email
      }

      // Auth Firebase
      const { user } = await signInWithEmailAndPassword(auth, loginEmail, loginPassword)

      // (Rattrapage) S'assurer que le mapping existe pour les anciens comptes
      try {
        const userSnap = await getDoc(doc(db, 'Users', user.uid))
        if (userSnap.exists()) {
          const data = userSnap.data()
          const unameLower = normalizeUsername(data.userName || '')
          if (unameLower) {
            const mapRef = doc(db, 'Usernames', unameLower)
            const mapSnap = await getDoc(mapRef)
            if (!mapSnap.exists()) {
              await setDoc(mapRef, {
                uid: user.uid,
                email: data.email,
                usernameLower: unameLower
              })
            }
          }
        }
      } catch (_) {
        // best effort: ignorer les erreurs de rattrapage
      }

      router.replace('/')

    } catch (err) {
      Alert.alert('Erreur', err.message)
    }
  }

  // --- SIGNUP ---
  const handleSignup = async () => {
    try {
      const usernameLower = normalizeUsername(userName)
      if (!isValidUsername(usernameLower)) {
        return Alert.alert(
          'Erreur',
          "Le nom d’utilisateur doit faire 3–20 caractères (a-z, 0-9, _)."
        )
      }

      // Création compte Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        signPassword
      )

      // Transaction pour réserver le pseudo (anti-doublon) + créer le profil
      await runTransaction(db, async (tx) => {
        const unameRef = doc(db, 'Usernames', usernameLower)
        const unameSnap = await tx.get(unameRef)
        if (unameSnap.exists()) {
          throw new Error('username-taken')
        }

        // mapping public (doc-only get)
        tx.set(unameRef, {
          uid: user.uid,
          email: email.trim(),
          usernameLower
        })

        // profil propriétaire
        const userRef = doc(db, 'Users', user.uid)
        tx.set(userRef, {
          email: email.trim(),
          userId: user.uid,
          userName: userName.trim(),
          userNameLower: usernameLower,
          walletBalance: 1000,
          lastDailyBonusClaimedAt: null
        })
      })

      setIsSignup(false)

    } catch (err) {
      if (err.message === 'username-taken') {
        return Alert.alert('Erreur', 'Ce nom d’utilisateur est déjà pris.')
      }
      Alert.alert('Erreur', err.message)
    }
  }

  return (
    <View style={styles.container}>
      {isSignup ? (
        <>
          <Text style={styles.title}>Créer un compte</Text>

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
            placeholder="Nom d’utilisateur (a-z, 0-9, _)"
            placeholderTextColor="rgba(255,255,255,0.7)"
            autoCapitalize="none"
            value={userName}
            onChangeText={setUserName}
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="rgba(255,255,255,0.7)"
            secureTextEntry
            value={signPassword}
            onChangeText={setSignPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
            <Text style={styles.buttonText}>Valider</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setIsSignup(false)}
          >
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>🎰 Bienvenue</Text>

          <TextInput
            style={styles.input}
            placeholder="Email ou nom d’utilisateur"
            placeholderTextColor="rgba(255,255,255,0.7)"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="rgba(255,255,255,0.7)"
            secureTextEntry
            value={loginPassword}
            onChangeText={setLoginPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setIsSignup(true)}
          >
            <Text style={styles.buttonText}>Créer un compte</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',

    alignItems:     'center',
    paddingHorizontal: 30,
    backgroundColor:'#1a1a2e',
    width: screenWidth,
    height: screenHeight

  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    color: '#e94560',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 16
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
})

export default Auth
