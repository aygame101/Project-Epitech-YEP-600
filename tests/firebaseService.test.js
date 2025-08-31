// __tests__/firebaseService.test.js (ou tests/firebaseService.test.js)

// ⚠️ Le mock DOIT être déclaré avant l'import du service
jest.mock('../config/firebaseConfig', () => ({ db: {} }))

import { getUser } from '../components/services/firebaseService'
import { getDoc, doc } from 'firebase/firestore'

// Firestore mock
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  doc: jest.fn(),
}))

describe('Service Firebase - getUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retourne les données utilisateur si elles existent', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'abc123',
      data: () => ({ name: 'John', email: 'john@example.com' }),
    })
    doc.mockReturnValueOnce('fakeDocRef')

    const user = await getUser('abc123')

    expect(user).toEqual({
      id: 'abc123',
      name: 'John',
      email: 'john@example.com',
    })
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'Users', 'abc123')
    expect(getDoc).toHaveBeenCalledWith('fakeDocRef')
  })

  it("retourne null si l'utilisateur n'existe pas", async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false })
    doc.mockReturnValueOnce('fakeDocRef')

    const user = await getUser('notfound')

    expect(user).toBeNull()
    expect(getDoc).toHaveBeenCalledWith('fakeDocRef')
  })

  it('gère les erreurs Firestore correctement', async () => {
    getDoc.mockRejectedValueOnce(new Error('Firestore error'))
    doc.mockReturnValueOnce('fakeDocRef')

    await expect(getUser('errorCase')).rejects.toThrow('Firestore error')
  })
})
