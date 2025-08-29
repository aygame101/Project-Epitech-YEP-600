import { db } from './app'
import { collection, onSnapshot, query, orderBy, limit as qLimit } from 'firebase/firestore'
import { getCurrentParisWeekKey } from './time'

export function listenScoreboardTop(topN = 10, callback) {
    const ref = collection(db, 'player_stats')
    const q = query(ref, orderBy('totalPayout', 'desc'), qLimit(topN))
    const unsub = onSnapshot(q, (snap) => {
        const rows = []
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }))
        callback(rows)
    })
    return unsub
}

export function listenWeeklyScoreboardTop(topN = 10, callback, weekKey = getCurrentParisWeekKey()) {
    const ref = collection(db, 'player_stats_weekly', weekKey, 'stats')
    const q = query(ref, orderBy('totalPayout', 'desc'), qLimit(topN))
    const unsub = onSnapshot(q, (snap) => {
        const rows = []
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }))
        callback(rows)
    })
    return unsub
}
