const { getUser } = require('../components/services/firebaseService');
const { getDoc, doc } = require('firebase/firestore');

jest.mock('firebase/firestore', () => ({
    getDoc: jest.fn(),
    doc: jest.fn()
}));

describe('getUser', () => {
    beforeEach(() => jest.clearAllMocks());

    it('retourne les données utilisateur si existe', async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: 'abc123',
            data: () => ({ name: 'John', email: 'john@example.com' })
        });
        doc.mockReturnValue('fakeDocRef');
        const user = await getUser('abc123');
        expect(user).toEqual({ id: 'abc123', name: 'John', email: 'john@example.com' });
        expect(getDoc).toHaveBeenCalledWith('fakeDocRef');
    });

    it('retourne null si utilisateur non trouvé', async () => {
        getDoc.mockResolvedValue({
            exists: () => false
        });
        doc.mockReturnValue('fakeDocRef');
        const user = await getUser('notfound');
        expect(user).toBeNull();
    });
});
