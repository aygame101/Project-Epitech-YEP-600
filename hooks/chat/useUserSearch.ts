// hooks/useUserSearch.ts
import { useEffect, useState } from 'react'
import { searchUsersByPrefix } from '../../config/firebaseConfig'
import type { UserRow } from '../../types/chat'

export function useUserSearch(q: string, myUid?: string | null, limit = 50) {
    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState<UserRow[]>([])
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        let alive = true
        const run = async () => {
            setLoading(true)
            setErr(null)
            try {
                const res = await searchUsersByPrefix(q, limit)
                const filtered: UserRow[] = (res as UserRow[]).filter((u) => u.uid !== myUid)
                if (alive) setRows(filtered)
            } catch (e: any) {
                console.warn('[useUserSearch] search error:', e?.message || e)
                if (alive) {
                    setRows([])
                    setErr(e?.message || 'Erreur inconnue (vérifie les règles Firestore).')
                }
            } finally {
                if (alive) setLoading(false)
            }
        }
        const t = setTimeout(run, 200)
        return () => { alive = false; clearTimeout(t) }
    }, [q, myUid, limit])

    return { loading, rows, err, setErr }
}
