// hooks/useConversation.ts
import { useEffect, useRef, useState } from 'react'
import { getOrCreateConversation, listenMessages, markRead } from '../../config/firebaseConfig'

export function useConversation(meUid: string, otherUid: string, displayName?: string) {
    const [cid, setCid] = useState<string | null>(null)
    const [msgs, setMsgs] = useState<any[]>([])
    const mountedRef = useRef(true)

    useEffect(() => () => { mountedRef.current = false }, [])

    // Get/Create conversation id
    useEffect(() => {
        let alive = true
            ; (async () => {
                const { cid } = await getOrCreateConversation(meUid, { uid: String(otherUid), displayName: String(displayName ?? '') })
                if (alive && mountedRef.current) setCid(cid)
            })()
        return () => { alive = false }
    }, [meUid, otherUid, displayName])

    // Live messages + mark read
    useEffect(() => {
        if (!cid) return
        const unsub = listenMessages(cid, (rows: any[]) => {
            setMsgs(rows)
            // mark as read for me
            markRead({ cid, uid: meUid }).catch(() => { })
        })
        return () => { if (typeof unsub === 'function') unsub() }
    }, [cid, meUid])

    return { cid, msgs }
}
