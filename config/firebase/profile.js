import { db } from './app'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export async function saveUserProfile(userId, profileData) {
    await setDoc(doc(db, 'Users', userId), profileData, { merge: true })
}

export async function getUserProfile(userId) {
    const snap = await getDoc(doc(db, 'Users', userId))
    return snap.exists() ? snap.data() : null
}
