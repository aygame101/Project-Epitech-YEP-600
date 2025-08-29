// hooks/useScoreboard.ts
import { useEffect, useState } from 'react'
import { listenWeeklyScoreboardTop, listenScoreboardTop } from '../../config/firebaseConfig'

export type Row = {
    id: string
    userName?: string
    userNameLower?: string
    totalPayout: number
}

export type Mode = 'weekly' | 'global'

export function useScoreboardTop(topN: number, mode: Mode) {
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        const onRows = (data: Row[]) => {
            setRows(data ?? [])
            setLoading(false)
        }

        const unsub =
            mode === 'weekly'
                ? listenWeeklyScoreboardTop(topN, onRows)
                : listenScoreboardTop(topN, onRows)

        return () => {
            if (typeof unsub === 'function') unsub()
        }
    }, [topN, mode])

    return { rows, loading }
}
