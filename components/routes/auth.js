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
  collection,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore'

import { Dimensions } from 'react-native'

export const Auth = () => {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)

  // Connexion
  const [identifier, setIdentifier]     = useState('') // email ou username
  const [loginPassword, setLoginPassword] = useState('')

  // Création
  const [email, setEmail]         = useState('')
  const [userName, setUserName]   = useState('')
  const [signPassword, setSignPassword] = useState('')

  const handleLogin = async () => {
    try {
      let loginEmail = identifier.trim()

      // Si c'est un username, on récupère l'email associé
      if (!loginEmail.includes('@')) {
        const q     = query(
          collection(db, 'Users'),
          where('userName', '==', loginEmail)
        )
        const snaps = await getDocs(q)
        if (snaps.empty) {
          return Alert.alert('Erreur', "Utilisateur introuvable")
        }
        loginEmail = snaps.docs[0].data().email
      }

      // Auth Firebase
      const { user } = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      )

      // Profil Firestore
      const snap = await getDoc(doc(db, 'Users', user.uid))
      if (!snap.exists()) {
        return Alert.alert('Erreur', 'Profil non trouvé')
      }

      // Navigation directe vers l'écran principal
      router.replace('/')

    } catch (err) {
      Alert.alert('Erreur', err.message)
    }
  }

  const handleSignup = async () => {
    try {
      // Création compte Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        signPassword
      )

      // Création doc Firestore
      await setDoc(doc(db, 'Users', user.uid), {
        email:         email.trim(),
        userId:        user.uid,
        userName:      userName.trim(),
        walletBalance: 1000
      })

      // Après création, on revient au formulaire de login
      setIsSignup(false)

    } catch (err) {
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
            placeholder="Nom d’utilisateur"
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

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSignup}
          >
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

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
          >
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
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
    paddingHorizontal: 30,
    backgroundColor:'#1a1a2e',
    width: screenWidth,
    height: screenHeight
  },
  title: {
    fontSize:     28,
    marginBottom: 30,
    color:        '#e94560',
    fontWeight:   'bold',
    textAlign:    'center'
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
    alignItems:      'center',
    marginBottom:    15
  },
  secondaryButton: {
    width:           '100%',
    height:          50,
    borderRadius:    25,
    borderWidth:     1,
    borderColor:     '#e94560',
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
