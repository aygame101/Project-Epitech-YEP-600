// components/routes/auth.js

import React, { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
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
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'

const { width, height } = Dimensions.get('window')

const normalizeUsername = (s) => s.trim().toLowerCase()
const isValidUsername = (s) => /^[a-z0-9_]{3,20}$/.test(s)

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

  const handleLogin = async () => {
    try {
      let loginEmail = identifier.trim()
      // Login par pseudo -> on retrouve l'email via Usernames/{usernameLower}
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
      // (Rattrapage) créer le mapping si absent pour anciens comptes
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
      } catch { }
      router.replace('/')
    } catch (err) {
      Alert.alert('Erreur', err.message)
    }
  }

  const handleSignup = async () => {
    try {
      const usernameLower = normalizeUsername(userName)
      if (!isValidUsername(usernameLower)) {
        return Alert.alert(
          'Erreur',
          "Le nom d'utilisateur doit faire 3–20 caractères (a-z, 0-9, _)."
        )
      }
      // Création compte Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        signPassword
      )
      // Transaction : réserver le pseudo + créer Users/{uid} + créer player_stats/{uid}
      await runTransaction(db, async (tx) => {
        const unameRef = doc(db, 'Usernames', usernameLower)
        const unameSnap = await tx.get(unameRef)
        if (unameSnap.exists()) {
          throw new Error('username-taken')
        }
        // Mapping public
        tx.set(unameRef, {
          uid: user.uid,
          email: email.trim(),
          usernameLower,
          displayName: userName.trim()
        })
        // Profil privé
        const userRef = doc(db, 'Users', user.uid)
        tx.set(userRef, {
          email: email.trim(),
          userId: user.uid,
          userName: userName.trim(),
          userNameLower: usernameLower,
          walletBalance: 1000,
          lastDailyBonusClaimedAt: null
        })
        // >>> NEW: Doc d'agrégats pour le scoreboard
        const statsRef = doc(db, 'player_stats', user.uid)
        tx.set(statsRef, {
          uid: user.uid,
          userName: userName.trim(),
          userNameLower: usernameLower,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          pushes: 0,
          totalWagered: 0,
          totalPayout: 0,
          net: 0,
          lastUpdated: serverTimestamp()
        })
      })
      setIsSignup(false)
    } catch (err) {
      if (err.message === 'username-taken') {
        return Alert.alert('Erreur', "Ce nom d'utilisateur est déjà pris.")
      }
      Alert.alert('Erreur', err.message)
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🎰</Text>
          <Text style={styles.appName}>CASINO ROYALE</Text>
        </View>

        {isSignup ? (
          <View style={styles.formContainer}>
            <Text style={styles.title}>Créer un compte</Text>
            <TextInput
              style={styles.input}
              placeholder="Adresse e-mail"
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur (a-z, 0-9, _)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              autoCapitalize="none"
              value={userName}
              onChangeText={setUserName}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="rgba(255,255,255,0.6)"
              secureTextEntry
              value={signPassword}
              onChangeText={setSignPassword}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
              <Text style={styles.primaryButtonText}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsSignup(false)}
            >
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.title}>Bienvenue</Text>
            <TextInput
              style={styles.input}
              placeholder="Email ou nom d'utilisateur"
              placeholderTextColor="rgba(255,255,255,0.6)"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="rgba(255,255,255,0.6)"
              secureTextEntry
              value={loginPassword}
              onChangeText={setLoginPassword}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsSignup(true)}
            >
              <Text style={styles.secondaryButtonText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Le jeu responsable est notre priorité</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#0f1123' 
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    minHeight: height,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  title: { 
    fontSize: 26, 
    marginBottom: 30, 
    color: '#ff3e80', 
    fontWeight: 'bold', 
    textAlign: 'center',
    textShadowColor: 'rgba(255, 62, 128, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    width: '100%',
  },
  input: {
    width: '100%', 
    height: 55, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', 
    marginBottom: 20, 
    paddingHorizontal: 20, 
    color: '#fff', 
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: { 
    width: '100%', 
    height: 55, 
    borderRadius: 12, 
    backgroundColor: '#ff3e80', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15,
    shadowColor: '#ff3e80',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButton: { 
    width: '100%', 
    height: 55, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#ff3e80', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: { 
    color: '#ff3e80', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  footer: {
    marginTop: 40,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  }
})

export default Auth