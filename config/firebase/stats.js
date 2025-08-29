import { db } from './app'
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore'
import { getCurrentParisWeekKey } from './time'

/**
 * Enregistre un résultat de jeu et met à jour:
 * - player_stats/{uid} (agrégats)
 * - player_stats/{uid}/tx (append-only)
 * - Users/{uid}.walletBalance (solde)
 * - player_stats_weekly/{weekKey}/stats/{uid} (agrégats hebdo)
 *
 * Retourne { delta, newBalance }.
 */
export async function recordGameResult(
    uid,
    { game = 'slots', wager = 0, payout = 0, metadata = {} }
) {
    const statsRef = doc(db, 'player_stats', uid)
    const txDocRef = doc(collection(db, `player_stats/${uid}/tx`))
    const userRef = doc(db, 'Users', uid)
    const w = Number(wager) || 0
    const p = Number(payout) || 0

    const weekKey = getCurrentParisWeekKey()
    const weeklyRef = doc(db, 'player_stats_weekly', weekKey, 'stats', uid)

    return await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef)
        if (!userSnap.exists()) throw new Error('profile-missing')
        const userData = userSnap.data() || {}
        const currentBalance = Number(userData.walletBalance || 0)

        const statsSnap = await tx.get(statsRef)
        let s = statsSnap.exists() ? statsSnap.data() : {
            uid,
            userName: userData.userName || '',
            userNameLower: (userData.userNameLower || '').toString(),
            gamesPlayed: 0, wins: 0, losses: 0, pushes: 0,
            totalWagered: 0, totalPayout: 0, net: 0,
            lastUpdated: serverTimestamp(),
        }

        const weeklySnap = await tx.get(weeklyRef)
        let ws = weeklySnap.exists() ? weeklySnap.data() : {
            uid, weekKey,
            userName: userData.userName || '',
            userNameLower: (userData.userNameLower || '').toString(),
            gamesPlayed: 0, wins: 0, losses: 0, pushes: 0,
            totalWagered: 0, totalPayout: 0, net: 0,
            lastUpdated: serverTimestamp(),
        }

        const delta = p - w
        const newBalance = currentBalance + delta

        // Append-only transaction
        tx.set(txDocRef, {
            uid, game, wager: w, payout: p, delta,
            metadata: { ...metadata, weekKey },
            createdAt: serverTimestamp(),
        })

        // Lifetime aggregates
        const gamesPlayed = (s.gamesPlayed || 0) + 1
        const wins = (s.wins || 0) + (delta > 0 ? 1 : 0)
        const losses = (s.losses || 0) + (delta < 0 ? 1 : 0)
        const pushes = (s.pushes || 0) + (delta === 0 ? 1 : 0)
        const totalWagered = (s.totalWagered || 0) + w
        const totalPayout = (s.totalPayout || 0) + p
        const net = totalPayout - totalWagered

        tx.set(statsRef, {
            uid,
            userName: s.userName || userData.userName || '',
            userNameLower: s.userNameLower || (userData.userNameLower || '').toString(),
            gamesPlayed, wins, losses, pushes,
            totalWagered, totalPayout, net,
            lastUpdated: serverTimestamp(),
        }, { merge: true })

        // Weekly aggregates
        const w_gamesPlayed = (ws.gamesPlayed || 0) + 1
        const w_wins = (ws.wins || 0) + (delta > 0 ? 1 : 0)
        const w_losses = (ws.losses || 0) + (delta < 0 ? 1 : 0)
        const w_pushes = (ws.pushes || 0) + (delta === 0 ? 1 : 0)
        const w_totalWagered = (ws.totalWagered || 0) + w
        const w_totalPayout = (ws.totalPayout || 0) + p
        const w_net = w_totalPayout - w_totalWagered

        tx.set(weeklyRef, {
            uid, weekKey,
            userName: ws.userName || userData.userName || '',
            userNameLower: ws.userNameLower || (userData.userNameLower || '').toString(),
            gamesPlayed: w_gamesPlayed,
            wins: w_wins,
            losses: w_losses,
            pushes: w_pushes,
            totalWagered: w_totalWagered,
            totalPayout: w_totalPayout,
            net: w_net,
            lastUpdated: serverTimestamp(),
        }, { merge: true })

        // Wallet
        tx.update(userRef, {
            walletBalance: newBalance,
            lastGameAt: serverTimestamp(),
            lastGameDelta: delta,
        })

        return { delta, newBalance }
    })
}
