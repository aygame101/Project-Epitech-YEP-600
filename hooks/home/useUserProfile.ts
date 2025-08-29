// hooks/useUserProfile.ts
import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { auth, db } from '../../config/firebaseConfig'
import { doc, onSnapshot } from 'firebase/firestore'

export function useUserProfile(onNoUser?: () => void) {
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')
    const [walletBalance, setWalletBalance] = useState(0)

    useFocusEffect(
        useCallback(() => {
            const user = auth.currentUser
            if (!user) {
                onNoUser?.()
                setLoading(false)
                return
            }

            setLoading(true)
            const ref = doc(db, 'Users', user.uid)
            const unsubscribe = onSnapshot(
                ref,
                (snap) => {
                    if (snap.exists()) {
                        const data = snap.data() as any
                        setUserName(data.userName || '')
                        setWalletBalance(data.walletBalance ?? 0)
                    } else {
                        setUserName('')
                        setWalletBalance(0)
                    }
                    setLoading(false)
                },
                () => setLoading(false)
            )
            return () => unsubscribe()
        }, [onNoUser])
    )

    return { loading, userName, walletBalance }
}
