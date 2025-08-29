// hooks/useFavoriteForUser.ts
import { useEffect, useRef, useState } from 'react'
import { listenFavoritesMap, updateFavoris } from '../../config/firebaseConfig'

export function useFavoriteForUser(meUid?: string | null, otherUid?: string | null) {
    const [isFav, setIsFav] = useState<0 | 1>(0)
    const [favBusy, setFavBusy] = useState(false)
    const mountedRef = useRef(true)
    useEffect(() => () => { mountedRef.current = false }, [])

    useEffect(() => {
        if (!meUid || !otherUid) return
        const unsub = listenFavoritesMap(meUid, (map: Record<string, 0 | 1>) => {
            const v = map[String(otherUid)] ?? 0
            if (mountedRef.current) setIsFav(v as 0 | 1)
        })
        return unsub
    }, [meUid, otherUid])

    const toggleFav = async () => {
        if (!meUid || !otherUid || favBusy) return
        const prev = isFav
        const next = (prev ? 0 : 1) as 0 | 1
        setFavBusy(true); setIsFav(next)
        try { await updateFavoris(String(otherUid), next) }
        catch { if (mountedRef.current) setIsFav(prev) }
        finally { if (mountedRef.current) setFavBusy(false) }
    }

    return { isFav, favBusy, toggleFav }
}
