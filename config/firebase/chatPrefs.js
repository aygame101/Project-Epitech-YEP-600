import { auth } from './app'
import { db } from './app'
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'

export async function saveChatBgPreference(otherUid, bgCode) {
    const myUid = auth.currentUser?.uid
    if (!myUid) throw new Error('not-authenticated')
    if (!otherUid) throw new Error('missing-otherUid')
    await setDoc(
        doc(db, 'Users', myUid, 'chat_prefs', String(otherUid)),
        { bgCode: String(bgCode), updatedAt: serverTimestamp() },
        { merge: true }
    )
}

export function listenChatBgPreference(myUid, otherUid, callback) {
    if (!myUid || !otherUid) return () => { }
    const ref = doc(db, 'Users', String(myUid), 'chat_prefs', String(otherUid))
    const unsub = onSnapshot(
        ref,
        (snap) => {
            const data = snap.exists() ? (snap.data() || {}) : {}
            callback(data.bgCode || null)
        },
        (err) => {
            console.warn('[listenChatBgPreference] snapshot error:', err?.code, err?.message)
            callback(null)
        }
    )
    return unsub
}
