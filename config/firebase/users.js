import { db } from './app'
import {
    collection, query, orderBy, startAt, endAt, limit as qLimit, getDocs,
} from 'firebase/firestore'

export async function searchUsersByPrefix(prefix = '', limit = 20) {
    const ref = collection(db, 'Usernames')
    const start = prefix.trim().toLowerCase()
    const end = start + '\uf8ff'
    const q = query(ref, orderBy('usernameLower'), startAt(start), endAt(end), qLimit(limit))
    const snap = await getDocs(q)
    return snap.docs.map(d => {
        const data = d.data() || {}
        return {
            id: d.id,
            usernameLower: d.id,
            uid: data.uid,
            displayName: data.displayName || d.id,
            avatarUrl: data.avatarUrl || null,
        }
    })
}
