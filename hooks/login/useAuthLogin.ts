// hooks/useAuthLogin.ts
import { auth, db } from '../../config/firebaseConfig'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { normalizeUsername } from '../../utils/username'

async function resolveEmailFromIdentifier(identifier: string) {
    let loginEmail = identifier.trim()
    if (loginEmail.includes('@')) return loginEmail
    const usernameLower = normalizeUsername(loginEmail)
    const mapSnap = await getDoc(doc(db, 'Usernames', usernameLower))
    if (!mapSnap.exists()) {
        const err = new Error('user-not-found')
            ; (err as any).code = 'user-not-found'
        throw err
    }
    return (mapSnap.data() as any).email as string
}

export function useAuthLogin() {
    const login = async (identifier: string, password: string) => {
        const email = await resolveEmailFromIdentifier(identifier)
        const { user } = await signInWithEmailAndPassword(auth, email, password)

        // Rattrapage: si mapping manquant pour anciens comptes
        try {
            const userSnap = await getDoc(doc(db, 'Users', user.uid))
            if (userSnap.exists()) {
                const data = userSnap.data() as any
                const unameLower = normalizeUsername(data.userName || '')
                if (unameLower) {
                    const mapRef = doc(db, 'Usernames', unameLower)
                    const mapSnap = await getDoc(mapRef)
                    if (!mapSnap.exists()) {
                        await setDoc(mapRef, {
                            uid: user.uid,
                            email: data.email ?? user.email,
                            usernameLower: unameLower,
                            displayName: data.userName ?? '',
                        })
                    }
                }
            }
        } catch {
            // no-op
        }
    }

    return { login }
}
