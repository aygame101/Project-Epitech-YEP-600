/**
 * @jest-environment jsdom
 * @typedef {import('jest')} jest
 */
// tests/userAdd.test.js
const { signup, login } = require('../components/services/auth');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { runTransaction, getDoc } = require('firebase/firestore');

// Mock des configs Firebase
jest.mock('../config/firebaseConfig', () => ({
  auth: {},
  db: {}
}));

jest.mock('firebase/auth');
jest.mock('firebase/firestore');

describe('signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('crée un compte avec username valide', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } });

    runTransaction.mockImplementation(async (db, fn) =>
      fn({
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn()
      })
    );

    await signup('test@example.com', 'PlayerOne', 'password123');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
    expect(runTransaction).toHaveBeenCalled();
  });

  it('rejette si username invalide', async () => {
    await expect(signup('test@example.com', '!!', 'password123'))
      .rejects
      .toThrow('invalid-username');
  });

  it('rejette si username déjà pris', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } });

    runTransaction.mockImplementation(async (db, fn) =>
      fn({
        get: jest.fn().mockResolvedValue({ exists: () => true }),
        set: jest.fn()
      })
    );

    await expect(signup('test@example.com', 'PlayerOne', 'password123'))
      .rejects
      .toThrow('username-taken');
  });

  it('rejette si mot de passe vide', async () => {
    await expect(signup('test@example.com', 'PlayerOne', ''))
      .rejects
      .toThrow();
  });
});

describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('connecte un utilisateur avec email et mot de passe valides', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } });
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ email: 'test@example.com', userName: 'PlayerOne' })
    });

    const result = await login('test@example.com', 'password123');
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
    expect(result).toEqual({ uid: '123' });
  });

  it('connecte un utilisateur avec username', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ email: 'test@example.com' })
    });
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '123' } });

    const result = await login('PlayerOne', 'password123');
    expect(getDoc).toHaveBeenCalled();
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
    expect(result).toEqual({ uid: '123' });
  });

  it('rejette si utilisateur introuvable', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(login('UnknownUser', 'password123')).rejects.toThrow('Utilisateur introuvable');
  });
});