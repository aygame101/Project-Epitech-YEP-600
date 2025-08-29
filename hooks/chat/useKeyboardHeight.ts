// hooks/useKeyboardHeight.ts
import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

export function useKeyboardHeight() {
    const [kbH, setKbH] = useState(0)
    useEffect(() => {
        const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
        const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
        const s = Keyboard.addListener(show, (e) => setKbH(e.endCoordinates?.height ?? 0))
        const h = Keyboard.addListener(hide, () => setKbH(0))
        return () => { s.remove(); h.remove() }
    }, [])
    return kbH
}
