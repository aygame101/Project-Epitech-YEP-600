// hooks/useDailyBonus.ts
import { useEffect, useMemo, useState } from 'react'
import { listenDailyBonusStatus } from '../../config/firebaseConfig'

const BASE = 100
const STEP = 100
const CAP_DEFAULT = 7

export function useDailyBonus(uid?: string | null, tickWhileVisible = false) {
    const [canClaim, setCanClaim] = useState(false)
    const [streak, setStreak] = useState(0)
    const [cap, setCap] = useState(CAP_DEFAULT)
    const [nextAmount, setNextAmount] = useState(BASE)

    const [claimDeadline, setClaimDeadline] = useState(0)
    const [graceDeadline, setGraceDeadline] = useState(0)
    const [claimLeftMs, setClaimLeftMs] = useState(0)
    const [graceLeftMs, setGraceLeftMs] = useState(0)

    // Firestore live
    useEffect(() => {
        if (!uid) return
        return listenDailyBonusStatus(uid, (s) => {
            setCanClaim(!!s?.canClaim)

            const rawStreak = Number(s?.streak || 0)
            const capLocal = Number(s?.cap || CAP_DEFAULT)
            setStreak(rawStreak)
            setCap(capLocal)

            const nextStreak = rawStreak <= 0 ? 1 : Math.min(rawStreak + 1, capLocal)
            const amount = BASE + STEP * (nextStreak - 1)
            setNextAmount(amount)

            const cd = Date.now() + Number(s?.timeRemainingMs || 0)
            const gd = Date.now() + Number(s?.graceRemainingMs || 0)
            setClaimDeadline(cd)
            setGraceDeadline(gd)
            setClaimLeftMs(Math.max(0, cd - Date.now()))
            setGraceLeftMs(Math.max(0, gd - Date.now()))
        })
    }, [uid])

    // Auto bascule "Réclamer" quand l'échéance arrive
    useEffect(() => {
        if (!claimDeadline) return
        const wait = Math.max(0, claimDeadline - Date.now())
        const to = setTimeout(() => setCanClaim(true), wait)
        return () => clearTimeout(to)
    }, [claimDeadline])

    // Reset visuel quand la fenêtre de grâce se termine
    useEffect(() => {
        if (!graceDeadline) return
        const wait = Math.max(0, graceDeadline - Date.now())
        const to = setTimeout(() => {
            setStreak(0)
            setNextAmount(BASE)
        }, wait)
        return () => clearTimeout(to)
    }, [graceDeadline])

    // Tick d’1s pour les compteurs quand le modal est ouvert
    useEffect(() => {
        if (!tickWhileVisible) return
        const id = setInterval(() => {
            setClaimLeftMs(Math.max(0, claimDeadline - Date.now()))
            setGraceLeftMs(Math.max(0, graceDeadline - Date.now()))
        }, 1000)
        return () => clearInterval(id)
    }, [tickWhileVisible, claimDeadline, graceDeadline])

    return {
        canClaim,
        streak,
        cap,
        nextAmount,
        claimDeadline,
        graceDeadline,
        claimLeftMs,
        graceLeftMs,
    }
}
