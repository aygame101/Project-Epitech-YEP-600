// jest-environment node
import { describe, it, expect, beforeEach } from '@jest/globals';
import jest from 'jest-mock';
import { signup } from '../components/services/auth'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { runTransaction } from 'firebase/firestore'

jest.mock('../config/firebaseConfig', () => ({
  auth: {},
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
