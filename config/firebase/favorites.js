import { auth } from './app'
import { db } from './app'
import { doc, setDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore'

export async function updateFavoris(otherUid, favoris) {
    const myUid = auth.currentUser?.uid
    if (!myUid) throw new Error('not-authenticated')
    if (!otherUid) throw new Error('missing-otherUid')

    const ref = doc(db, 'Users', myUid, 'favorites', otherUid)
    await setDoc(ref, { favoris, updatedAt: serverTimestamp() }, { merge: true })
}

// Écoute live => { [otherUid]: 0|1, ... }
export function listenFavoritesMap(myUid, callback) {
    if (!myUid) return () => { }
    const ref = collection(db, 'Users', myUid, 'favorites')
    const unsub = onSnapshot(
        ref,
        (snap) => {
            const map = {}
            snap.forEach(d => {
                const data = d.data() || {}
                map[d.id] = (data.favoris === 1 ? 1 : 0)
            })
            callback(map)
        },
        (err) => {
            console.warn('[listenFavoritesMap] snapshot error:', err?.code, err?.message)
            callback({})
        }
    )
    return unsub
}
