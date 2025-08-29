import React, { useState } from 'react'
import {
  View, StyleSheet, Text, TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { COLORS } from '../../constants/layout'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import { useAuthLogin } from '../../hooks/login/useAuthLogin'
import { useAuthSignup } from '../../hooks/login/useAuthSignup'

const { width, height } = Dimensions.get('window')

const Auth = () => {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)

  // Connexion
  const [identifier, setIdentifier] = useState('') // email ou username
  const [loginPassword, setLoginPassword] = useState('')

  // Création
  const [email, setEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [signPassword, setSignPassword] = useState('')

  const { login } = useAuthLogin()
  const { signup } = useAuthSignup()

  const handleLogin = async () => {
    try {
      await login(identifier, loginPassword)
      router.replace('/')
    } catch (err) {
      const code = err?.code || err?.message
      if (code === 'user-not-found') {
        return Alert.alert('Erreur', 'Utilisateur introuvable')
      }
      Alert.alert('Erreur', err?.message || 'Connexion impossible.')
    }
  }

  const handleSignup = async () => {
    try {
      await signup(email, userName, signPassword)
      setIsSignup(false)
    } catch (err) {
      const code = err?.code || err?.message
      if (code === 'invalid-username') {
        return Alert.alert(
          'Erreur',
          "Le nom d'utilisateur doit faire 3–20 caractères (a-z, 0-9, _)."
        )
      }
      if (code === 'username-taken') {
        return Alert.alert('Erreur', "Ce nom d'utilisateur est déjà pris.")
      }
      Alert.alert('Erreur', err?.message || 'Création impossible.')
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
          <SignupForm
            email={email}
            setEmail={setEmail}
            userName={userName}
            setUserName={setUserName}
            password={signPassword}
            setPassword={setSignPassword}
            onSubmit={handleSignup}
            onSwitchLogin={() => setIsSignup(false)}
          />
        ) : (
          <LoginForm
            identifier={identifier}
            setIdentifier={setIdentifier}
            password={loginPassword}
            setPassword={setLoginPassword}
            onSubmit={handleLogin}
            onSwitchSignup={() => setIsSignup(true)}
          />
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
    flex: 1, width: width, height: height, backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    flexGrow: 1, width: '100%', justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: height,
  },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 60, marginBottom: 10 },
  appName: {
    fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 2, textAlign: 'center',
  },
  footer: {
    marginTop: 40, padding: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', width: '100%', alignItems: 'center',
  },
  footerText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
})

export { Auth }
export default Auth
