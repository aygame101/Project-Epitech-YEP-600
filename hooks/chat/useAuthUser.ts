// hooks/useAuthUser.ts
import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../../config/firebaseConfig'

export function useAuthUser() {
    const [user, setUser] = useState<User | null>(() => auth.currentUser)
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u || null))
        return unsub
    }, [])
    return user
}
