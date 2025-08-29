// hooks/useFavoritesMap.ts
import { useEffect, useState } from 'react'
import { listenFavoritesMap } from '../../config/firebaseConfig'

export function useFavoritesMap(myUid?: string | null) {
    const [favMap, setFavMap] = useState<Record<string, 0 | 1>>({})
    useEffect(() => {
        if (!myUid) return
        const unsub = listenFavoritesMap(myUid, (map: Record<string, 0 | 1>) => setFavMap(map))
        return unsub
    }, [myUid])
    return { favMap, setFavMap }
}
