// components/routes/gameStatsService.js
import { db } from '../../config/firebaseConfig'
import {
    doc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp
} from 'firebase/firestore'

// --- utils
const normalizeGameType = (g) => {
    const s = String(g || '').toLowerCase()
    if (s === 'slots') return 'slot'
    if (s === 'slot') return 'slot'
    if (s === 'blackjack') return 'blackjack'
    return 'other'
}

const sevenDaysAgoTs = () => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return Timestamp.fromDate(d)
}

/**
 * Statistiques globales attendues par GameDashboard "stats":
 *  - totalGames, totalWins, totalLosses, totalDraws
 *  - totalWinnings, totalLossesAmount
 *  - averageWin, averageLoss
 *  - gameTypeStats: { [gameType]: { gamesPlayed, wins, losses, draws, winRate } }
 */
export async function getUserGameStats(uid) {
    // 1) agrégés "lifetime"
    const psSnap = await getDoc(doc(db, 'player_stats', uid))
    const agg = psSnap.exists() ? psSnap.data() : null

    const totalGames = Number(agg?.gamesPlayed || 0)
    const totalWins = Number(agg?.wins || 0)
    const totalLosses = Number(agg?.losses || 0)
    const totalDraws = Number(agg?.pushes || 0)
    const totalWagered = Number(agg?.totalWagered || 0)
    const totalPayout = Number(agg?.totalPayout || 0)

    const totalWinnings = totalPayout
    const totalLossesAmount = Math.max(0, totalWagered - totalPayout)

    // 2) moyennes + stats par jeu via transactions (cap à 1000 pour éviter les gros reads)
    const txRef = collection(db, `player_stats/${uid}/tx`)
    const qTx = query(txRef, orderBy('createdAt', 'desc'), limit(1000))
    const txSnap = await getDocs(qTx)

    let sumWin = 0
    let sumLossAbs = 0
    const perGame = {} // { [gameType]: { gamesPlayed, wins, losses, draws } }

    txSnap.forEach(d => {
        const t = d.data() || {}
        const delta = Number(t.delta || 0)
        const gt = normalizeGameType(t.game)

        if (!perGame[gt]) perGame[gt] = { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 }
        perGame[gt].gamesPlayed += 1
        if (delta > 0) { perGame[gt].wins += 1; sumWin += delta }
        else if (delta < 0) { perGame[gt].losses += 1; sumLossAbs += Math.abs(delta) }
        else { perGame[gt].draws += 1 }
    })

    const averageWin = totalWins > 0 ? Math.round(sumWin / totalWins) : 0
    const averageLoss = totalLosses > 0 ? Math.round(sumLossAbs / totalLosses) : 0

    // Ajouter winRate par jeu
    const gameTypeStats = {}
    Object.entries(perGame).forEach(([k, v]) => {
        const played = v.gamesPlayed || 0
        const winRate = played > 0 ? (v.wins / played) * 100 : 0
        gameTypeStats[k] = { ...v, winRate }
    })

    return {
        totalGames,
        totalWins,
        totalLosses,
        totalDraws,
        totalWinnings,
        totalLossesAmount,
        averageWin,
        averageLoss,
        gameTypeStats
    }
}

/**
 * Performance récente (7 jours) pour "overview":
 *  - gamesPlayed, wins, losses, draws, winRate
 */
export async function getRecentPerformance(uid) {
    const txRef = collection(db, `player_stats/${uid}/tx`)
    const qTx = query(
        txRef,
        where('createdAt', '>=', sevenDaysAgoTs()),
        orderBy('createdAt', 'asc')
    )
    const snap = await getDocs(qTx)

    let games = 0, wins = 0, losses = 0, draws = 0
    snap.forEach(d => {
        const t = d.data() || {}
        const delta = Number(t.delta || 0)
        games += 1
        if (delta > 0) wins += 1
        else if (delta < 0) losses += 1
        else draws += 1
    })

    const winRate = games > 0 ? (wins / games) * 100 : 0
    return { gamesPlayed: games, wins, losses, draws, winRate }
}

/**
 * Meilleures performances pour "overview":
 *  - bestWin (max delta>0)
 *  - bestGameType (meilleur winRate avec au moins 5 parties si possible)
 *  - mostPlayedGame (max games)
 */
export async function getBestPerformances(uid) {
    // On lit jusqu'à 1000 dernières pour rester raisonnable
    const txRef = collection(db, `player_stats/${uid}/tx`)
    const qTx = query(txRef, orderBy('createdAt', 'desc'), limit(1000))
    const snap = await getDocs(qTx)

    let bestWin = 0
    const byGame = {} // { [gameType]: { games: n, wins: n } }

    snap.forEach(d => {
        const t = d.data() || {}
        const delta = Number(t.delta || 0)
        const gt = normalizeGameType(t.game)
        if (!byGame[gt]) byGame[gt] = { games: 0, wins: 0 }
        byGame[gt].games += 1
        if (delta > 0) {
            byGame[gt].wins += 1
            if (delta > bestWin) bestWin = delta
        }
    })

    // mostPlayed
    let mostPlayedGame = null, mostPlayedCount = -1
    Object.entries(byGame).forEach(([g, v]) => {
        if (v.games > mostPlayedCount) { mostPlayedCount = v.games; mostPlayedGame = g }
    })

    // bestGameType (winRate), on privilégie les jeux avec >=5 parties si dispo
    let bestGameType = null, bestRate = -1
    Object.entries(byGame).forEach(([g, v]) => {
        const rate = v.games > 0 ? (v.wins / v.games) * 100 : 0
        const qualifies = v.games >= 5
        // priorité aux jeux qui qualifient, sinon on prend le meilleur restant
        if (qualifies) {
            if (rate > bestRate || bestGameType === null) { bestRate = rate; bestGameType = g }
        }
    })
    // si aucun n’a >=5 parties, on prend le meilleur global
    if (!bestGameType) {
        Object.entries(byGame).forEach(([g, v]) => {
            const rate = v.games > 0 ? (v.wins / v.games) * 100 : 0
            if (rate > bestRate || bestGameType === null) { bestRate = rate; bestGameType = g }
        })
    }

    return { bestWin, bestGameType, mostPlayedGame }
}
