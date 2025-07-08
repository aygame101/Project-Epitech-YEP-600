const { addUser } = require('../components/firebaseService');
const { db } = require('../components/firebaseConfig');

// Mock Firebase Firestore
jest.mock('../components/firebaseConfig', () => {
  const mockSet = jest.fn().mockResolvedValue(true);
  const mockDoc = jest.fn(() => ({ set: mockSet }));
  const mockCollection = jest.fn(() => ({ doc: mockDoc }));

  return {
    db: {
      collection: mockCollection,
    },
    firebase: {
      firestore: {
        FieldValue: {
          serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
        },
      },
    },
  };
});

describe('addUser', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  it('should successfully add a user to Firestore', async () => {
    const userId = 'test-user-id';
    const email = 'test@example.com';
    const username = 'testUser';

    await addUser(userId, email, username);

    // Verify the Firestore methods were called correctly
    expect(db.collection).toHaveBeenCalledWith('users');
    const usersCollection = db.collection('users');
    expect(usersCollection.doc).toHaveBeenCalledWith(userId);
    const userDoc = usersCollection.doc(userId);
    expect(userDoc.set).toHaveBeenCalledWith({
      email: email,
      username: username,
      walletBalance: 500,
      createdAt: 'MOCK_TIMESTAMP',
    });
  });

  it('should throw an error when required fields are missing', async () => {
    await expect(addUser('', 'test@example.com', 'testUser'))
      .rejects.toThrow('User ID, email, and username are required.');
    await expect(addUser('test-user-id', '', 'testUser'))
      .rejects.toThrow('User ID, email, and username are required.');
    await expect(addUser('test-user-id', 'test@example.com', ''))
      .rejects.toThrow('User ID, email, and username are required.');
  });

  it('should handle Firestore errors', async () => {
    // Configure the mock to reject
    const mockSetRejected = jest.fn().mockRejectedValue(new Error('Firestore error'));
    db.collection('users').doc = jest.fn(() => ({
      set: mockSetRejected,
    }));

    // Expect the addUser function to throw an error
    await expect(addUser('error-id', 'test@example.com', 'testUser'))
      .rejects.toThrow('Firestore error');
  });
});