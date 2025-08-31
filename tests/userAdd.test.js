/* auth.test.ts */
import React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native';
import { Auth } from '../components/login/auth'
import { signup, login } from '../components/login/auth'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { runTransaction, getDoc } from 'firebase/firestore'
import { cleanup } from '@testing-library/react-native'

// -----------------
// Mock Firebase
// -----------------
jest.mock('../config/firebaseConfig', () => ({ auth: {}, db: {} }))
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(),
}))
jest.mock('firebase/firestore')

// Mock Alert
jest.spyOn(Alert, 'alert')

// -----------------
// Auth Service Tests
// -----------------
describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  // -----------------------
  // SIGNUP
  // -----------------------
  describe('signup', () => {
    it('crée un compte avec un username valide', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({ user: { uid: '123' } })
      ;(runTransaction as jest.Mock).mockImplementationOnce(async (db: unknown, fn: (transaction: unknown) => Promise<void>) => {
        await fn({
          get: jest.fn().mockResolvedValue({ exists: () => false }),
          set: jest.fn(),
        })
      })

      await signup('test@example.com', 'PlayerOne', 'password123')

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123')
      expect(runTransaction).toHaveBeenCalled()
    })

    it('rejette si username invalide', async () => {
      await expect(signup('test@example.com', '!!', 'password123')).rejects.toThrow('invalid-username')
    })

    it("rejette si username déjà pris", async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({ user: { uid: '123' } })
      ;(runTransaction as jest.Mock).mockImplementationOnce(async (db: unknown, fn: (transaction: unknown) => Promise<void>) => {
        await fn({
          get: jest.fn().mockResolvedValue({ exists: () => true }),
          set: jest.fn(),
        })
      })

      await expect(signup('test@example.com', 'PlayerOne', 'password123')).rejects.toThrow('username-taken')
    })
  })

  // -----------------------
  // LOGIN
  // -----------------------
  describe('login', () => {
    it('connecte un utilisateur avec email valide', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({ user: { uid: '123' } })
      ;(getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ email: 'test@example.com', userName: 'PlayerOne' }) })

      const result = await login('test@example.com', 'password123')

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123')
      expect(result).toEqual({ uid: '123' })
    })

    it('rejette si utilisateur introuvable', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false })

      await expect(login('UnknownUser', 'password123')).rejects.toThrow('Utilisateur introuvable')
    })
  })
})

// -----------------
// Auth Component Tests
// -----------------
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
    expect(screen.getByPlaceholderText(/Email/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/Username/i)).toBeTruthy()
  })

  it('affiche une alerte si login échoue', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({ code: 'user-not-found' })
    render(<Auth />)

    const identifierInput = screen.getByPlaceholderText(/Email ou username/i)
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
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(signup as jest.Mock).mockRejectedValueOnce({ code: 'invalid-username' })
    render(<Auth />)

    const switchBtn = screen.getByText(/Créer un compte/i)
    fireEvent.press(switchBtn)

    const emailInput = screen.getByPlaceholderText(/Email/i)
    const usernameInput = screen.getByPlaceholderText(/Username/i)
    const passwordInput = screen.getByPlaceholderText(/Mot de passe/i)
    const submitBtn = screen.getByText(/S’inscrire/i)

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
