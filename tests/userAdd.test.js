// jest-environment node
const { describe, it, expect, beforeEach } = require('@jest/globals');
const { signup, login } = require('../components/services/auth');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { runTransaction, getDoc } = require('firebase/firestore');

jest.mock('../config/firebaseConfig', () => ({
  auth: {}, // mock simple
  db: {}
}))
jest.mock('firebase/auth')
jest.mock('firebase/firestore')

describe('signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('crée un compte avec username valide', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } })

    // Simule un username encore libre
    runTransaction.mockImplementation(async (db, fn) =>
      fn({
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn()
      })
    )

    await signup('test@example.com', 'PlayerOne', 'password123')

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(), // auth mock
      'test@example.com',
      'password123'
    )
    expect(runTransaction).toHaveBeenCalled()
  })

  it('rejette si username invalide', async () => {
    await expect(signup('test@example.com', '!!', 'password123'))
      .rejects
      .toThrow('invalid-username')
  })

  it('rejette si username déjà pris', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } })

    // Simule un username déjà existant
    runTransaction.mockImplementation(async (db, fn) =>
      fn({
        get: jest.fn().mockResolvedValue({ exists: () => true }),
        set: jest.fn()
      })
    )

    await expect(signup('test@example.com', 'PlayerOne', 'password123'))
      .rejects
      .toThrow('username-taken')
  })
})

// Ajout de tests unitaires pour la connexion
describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('connecte un utilisateur avec email et mot de passe valides', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } })
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ email: 'test@example.com', userName: 'PlayerOne' })
    })

    const result = await login('test@example.com', 'password123')
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    )
    expect(result).toEqual({ uid: '123' })
  })

  it('connecte un utilisateur avec username', async () => {
    // Simule la récupération de l'email via le username
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ email: 'test@example.com' })
    })
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } })

    const result = await login('PlayerOne', 'password123')
    expect(getDoc).toHaveBeenCalled()
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    )
    expect(result).toEqual({ uid: '123' })
  })

  it('rejette si utilisateur introuvable', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false })
    await expect(login('UnknownUser', 'password123')).rejects.toThrow('Utilisateur introuvable')
  })
})
