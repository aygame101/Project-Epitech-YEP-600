import { db } from './app'
import {
    doc, setDoc, updateDoc, serverTimestamp, collection, addDoc,
    query, orderBy, limit as qLimit, onSnapshot, getDoc,
} from 'firebase/firestore'

// Id de conversation déterministe pour 1–1
const normalizePair = (a, b) => {
    const ids = [String(a), String(b)].sort()
    return { cid: ids.join('_'), ids }
}
export const conversationIdFor = (a, b) => normalizePair(a, b).cid

export async function getOrCreateConversation(myUid, other) {
    const { cid, ids } = normalizePair(myUid, other.uid)
    const cref = doc(db, 'conversations', cid)

    try {
        await setDoc(cref, {
            participantIds: ids,
            participants: {
                [myUid]: { displayName: 'You' },
                [other.uid]: { displayName: other.displayName || other.usernameLower || 'Player' },
            },
        }, { merge: true })
    } catch (e) {
        console.warn('[chat] setDoc conv skipped:', e?.message)
    }

    try {
        await updateDoc(cref, { updatedAt: serverTimestamp() })
    } catch { }

    return { cid }
}

export async function sendMessage({ cid, senderId, text }) {
    const t = (text || '').slice(0, 2000)
    const mref = collection(db, 'conversations', cid, 'messages')

    await addDoc(mref, { senderId, type: 'text', text: t, createdAt: serverTimestamp() })
    await updateDoc(doc(db, 'conversations', cid), {
        lastMessage: t.slice(0, 200),
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
}

export function listenMessages(cid, callback) {
    const ref = collection(db, 'conversations', cid, 'messages')
    const q = query(ref, orderBy('createdAt', 'asc'), qLimit(200))
    const unsub = onSnapshot(q, (snap) => {
        const rows = []
        snap.forEach(d => rows.push({ id: d.id, ...d.data() }))
        callback(rows)
    })
    return unsub
}

export async function markRead({ cid, uid }) {
    const mref = doc(db, 'conversations', cid, 'members', uid)
    const snap = await getDoc(mref)
    if (!snap.exists()) {
        await setDoc(mref, { lastReadAt: serverTimestamp() })
    } else {
        await updateDoc(mref, { lastReadAt: serverTimestamp() })
    }
}
