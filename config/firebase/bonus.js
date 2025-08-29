import { db } from './app'
import {
    doc, onSnapshot, runTransaction, serverTimestamp, increment, Timestamp,
} from 'firebase/firestore'

export const DAILY_BONUS_INTERVAL_MS = 24 * 60 * 60 * 1000
export const DAILY_BONUS_GRACE_MS = 48 * 60 * 60 * 1000
export const DAILY_BONUS_BASE = 100
export const DAILY_BONUS_STEP = 100
export const DAILY_BONUS_CAP = 7

export function listenDailyBonusStatus(userId, callback) {
    if (!userId) return () => { }
    const userDocRef = doc(db, 'Users', userId)
    const unsub = onSnapshot(userDocRef, (snap) => {
        const data = snap.data() || {}
        const lastField = data.lastDailyBonusClaimedAt
        const last =
            lastField instanceof Timestamp ? lastField.toMillis()
                : typeof lastField === 'number' ? lastField : 0

        const now = Date.now()
        const streak = Number(data.dailyBonusStreak || 0)
        const cap = DAILY_BONUS_CAP

        const timeUntilClaim = Math.max(0, (last ? last + DAILY_BONUS_INTERVAL_MS : 0) - now)
        const canClaim = last === 0 || timeUntilClaim === 0
        const timeUntilLoseStreak = last ? Math.max(0, (last + DAILY_BONUS_GRACE_MS) - now) : 0

        const nextStreak = streak <= 0 ? 1 : Math.min(streak + 1, cap)
        const nextAmount = DAILY_BONUS_BASE + DAILY_BONUS_STEP * (nextStreak - 1)

        callback({
            canClaim,
            timeRemainingMs: timeUntilClaim,
            graceRemainingMs: timeUntilLoseStreak,
            streak,
            cap,
            nextAmount,
        })
    })
    return unsub
}

export async function claimDailyBonusClient(uid) {
    const ref = doc(db, 'Users', uid)
    return await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists()) throw new Error('profil-not-found')

        const data = snap.data() || {}
        const lastField = data.lastDailyBonusClaimedAt
        const last =
            lastField instanceof Timestamp ? lastField.toMillis()
                : typeof lastField === 'number' ? lastField : 0

        const oldStreak = Number(data.dailyBonusStreak || 0)
        const now = Date.now()
        const dt = last ? (now - last) : Number.POSITIVE_INFINITY

        const canContinue = last > 0 && dt >= DAILY_BONUS_INTERVAL_MS && dt < DAILY_BONUS_GRACE_MS
        const canClaimNow = last === 0 || dt >= DAILY_BONUS_INTERVAL_MS

        if (!canClaimNow) {
            const remainingMs = (last + DAILY_BONUS_INTERVAL_MS) - now
            const hrs = Math.ceil(remainingMs / (1000 * 60 * 60))
            return { status: 'failure', message: `Trop tôt. Réessaie dans ${hrs} h.` }
        }

        const newStreak = last === 0 ? 1 : (canContinue ? Math.min(oldStreak + 1, DAILY_BONUS_CAP) : 1)
        const amount = DAILY_BONUS_BASE + DAILY_BONUS_STEP * (newStreak - 1)

        tx.update(ref, {
            walletBalance: increment(amount),
            lastDailyBonusClaimedAt: serverTimestamp(),
            dailyBonusStreak: newStreak,
        })

        return {
            status: 'success',
            message: `Bonus de ${amount} réclamé ! (Jour ${newStreak}/${DAILY_BONUS_CAP})`,
            amount, newStreak,
        }
    })
}
