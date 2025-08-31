// tests/userAdd.test.js
import React from 'react'
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react-native'
import { Alert } from 'react-native'

// ⚠️ On n’importe plus signup/login depuis le composant.
// On teste les "services" via les hooks:
import { useAuthSignup } from '../hooks/login/useAuthSignup'
import { useAuthLogin } from '../hooks/login/useAuthLogin'

// Et on importe le composant pour les tests UI
import Auth from '../components/login/auth'

// Firebase mocks
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { runTransaction, getDoc } from 'firebase/firestore'

// -----------------
// Mocks Firebase
// -----------------
jest.mock('../config/firebaseConfig', () => ({ auth: {}, db: {} }))

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(),
}))

// On explicite les fonctions Firestore utilisées (doc peut renvoyer n'importe quel objet)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => 'ts'),
}))

// Mock Alert
jest.spyOn(Alert, 'alert')

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  describe('signup', () => {
    it('crée un compte avec un username valide', async () => {
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } })
      runTransaction.mockImplementationOnce(async (db, fn) => {
        await fn({
          get: jest.fn().mockResolvedValue({ exists: () => false }),
          set: jest.fn(),
        })
      })

      const { signup: signupFn } = useAuthSignup()
      await signupFn('test@example.com', 'PlayerOne', 'password123')

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123')
      expect(runTransaction).toHaveBeenCalled()
    })

    it('rejette si username invalide', async () => {
      const { signup: signupFn } = useAuthSignup()
      await expect(signupFn('test@example.com', '!!', 'password123')).rejects.toThrow('invalid-username')
    })

    it("rejette si username déjà pris", async () => {
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } })
      runTransaction.mockImplementationOnce(async (db, fn) => {
        await fn({
          get: jest.fn().mockResolvedValue({ exists: () => true }),
          set: jest.fn(),
        })
      })

      const { signup: signupFn } = useAuthSignup()
      await expect(signupFn('test@example.com', 'PlayerOne', 'password123')).rejects.toThrow('username-taken')
    })
  })

  describe('login', () => {
    it('connecte un utilisateur avec email valide', async () => {
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } })
      // premier getDoc pour Users/{uid} → existe()
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ email: 'test@example.com', userName: 'PlayerOne' }) })
      // deuxième getDoc (mapping Usernames) n’est pas crucial: toute erreur est catchée dans le hook

      const { login: loginFn } = useAuthLogin()
      await loginFn('test@example.com', 'password123')

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123')
    })

    it('rejette si utilisateur introuvable (identifier=username)', async () => {
      // resolveEmailFromIdentifier → getDoc(Usernames/{lower}) → not exists
      getDoc.mockResolvedValueOnce({ exists: () => false })

      const { login: loginFn } = useAuthLogin()
      await expect(loginFn('UnknownUser', 'password123')).rejects.toThrow('user-not-found')
    })
  })
})

describe('Auth Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('affiche la page de login par défaut', () => {
    render(<Auth />)
    expect(screen.getByText('CASINO ROYALE')).toBeTruthy()
    expect(screen.getByText('Le jeu responsable est notre priorité')).toBeTruthy()
  })

  it('permet de basculer vers le formulaire de signup', () => {
    render(<Auth />)
    const switchBtn = screen.getByText(/Créer un compte/i)
    fireEvent.press(switchBtn)

    // ⚠️ Adapter aux placeholders réels de SignupForm
    expect(screen.getByPlaceholderText(/Adresse e-mail/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/Nom d'utilisateur/i)).toBeTruthy()
  })

  it('affiche une alerte si login échoue (user-not-found)', async () => {
    // Quand on tape un username sans "@", le hook va interroger Usernames/{lower}
    // On force getDoc à "not exists" pour déclencher l’erreur
    getDoc.mockResolvedValueOnce({ exists: () => false })

    render(<Auth />)

    // ⚠️ Adapter au placeholder réel de LoginForm
    const identifierInput = screen.getByPlaceholderText(/Email ou nom d'utilisateur/i)
    const passwordInput = screen.getByPlaceholderText(/Mot de passe/i)
    const submitBtn = screen.getByText(/Se connecter/i)

    fireEvent.changeText(identifierInput, 'UnknownUser')
    fireEvent.changeText(passwordInput, 'password123')
    fireEvent.press(submitBtn)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Utilisateur introuvable')
    })
  })

  it('affiche une alerte si signup échoue avec username invalide', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { })

    render(<Auth />)

    // Ouvre le formulaire de signup
    const switchBtn = screen.getByText(/Créer un compte/i)
    fireEvent.press(switchBtn)

    const emailInput = screen.getByPlaceholderText(/Adresse e-mail/i)
    const usernameInput = screen.getByPlaceholderText(/Nom d'utilisateur/i)
    const passwordInput = screen.getByPlaceholderText(/Mot de passe/i)
    // ⚠️ Bouton réel dans SignupForm
    const submitBtn = screen.getByText(/Valider/i)

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.changeText(usernameInput, '!!')
    fireEvent.changeText(passwordInput, 'password123')
    fireEvent.press(submitBtn)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        "Le nom d'utilisateur doit faire 3–20 caractères (a-z, 0-9, _)."
      )
    })
  })
})
