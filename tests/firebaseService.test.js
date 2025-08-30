/* eslint-env jest */
// __tests__/firebaseService.test.js
// @ts-nocheck

import { getUser } from '../components/services/firebaseService';
import { getDoc, doc } from 'firebase/firestore';

// On mock les fonctions Firestore
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  doc: jest.fn(),
}));

describe('Service Firebase - getUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retourne les données utilisateur si elles existent', async () => {
    // Mock Firestore renvoyant un document existant
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'abc123',
      data: () => ({ name: 'John', email: 'john@example.com' }),
    });

    doc.mockReturnValueOnce('fakeDocRef');

    const user = await getUser('abc123');

    expect(user).toEqual({
      id: 'abc123',
      name: 'John',
      email: 'john@example.com',
    });

    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'abc123');
    expect(getDoc).toHaveBeenCalledWith('fakeDocRef');
  });

  it('retourne null si l’utilisateur n’existe pas', async () => {
    // Mock Firestore renvoyant un document inexistant
    getDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    doc.mockReturnValueOnce('fakeDocRef');

    const user = await getUser('notfound');

    expect(user).toBeNull();
    expect(getDoc).toHaveBeenCalledWith('fakeDocRef');
  });

  it('gère les erreurs Firestore correctement', async () => {
    // Mock Firestore qui lance une erreur
    getDoc.mockRejectedValueOnce(new Error('Firestore error'));

    doc.mockReturnValueOnce('fakeDocRef');

    await expect(getUser('errorCase')).rejects.toThrow('Firestore error');
  });
});
