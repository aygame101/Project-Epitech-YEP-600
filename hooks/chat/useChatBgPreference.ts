// hooks/useChatBgPreference.ts
import { Alert } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { listenChatBgPreference, saveChatBgPreference } from '../../config/firebaseConfig'
import { BG_PRESETS, BgCode } from '../../constants/chatBg'
import { withTimeout } from '../../utils/withTimeout'

export function useChatBgPreference(meUid?: string | null, otherUid?: string | null) {
    const [bgCode, setBgCode] = useState<BgCode>('solid-dark')
    const mountedRef = useRef(true)
    useEffect(() => () => { mountedRef.current = false }, [])

    useEffect(() => {
        if (!meUid || !otherUid) return
        const unsub = listenChatBgPreference(meUid, String(otherUid), (code?: string | null) => {
            const found = BG_PRESETS.find(p => p.code === code)
            if (mountedRef.current) setBgCode((found?.code ?? 'solid-dark') as BgCode)
        })
        return unsub
    }, [meUid, otherUid])

    const chooseBg = async (code: BgCode) => {
        if (!otherUid) return
        const prev = bgCode
        setBgCode(code)
        try {
            await withTimeout(saveChatBgPreference(String(otherUid), code), 4000)
        } catch (e) {
            if (mountedRef.current) {
                setBgCode(prev)
                Alert.alert('Fond non enregistré', 'Réessaie plus tard.')
            }
        }
    }

    return { bgCode, chooseBg }
}
