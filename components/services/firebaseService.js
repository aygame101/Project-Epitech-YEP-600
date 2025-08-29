// components/service/firebaseService.js
import { db } from '../../config/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'

export async function getUser(uid) {
    const snap = await getDoc(doc(db, 'Users', uid))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
