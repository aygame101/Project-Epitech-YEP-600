// hooks/useAuthSignup.ts
import { auth, db } from '../../config/firebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { isValidUsername, normalizeUsername } from '../../utils/username'

export function useAuthSignup() {
    const signup = async (email: string, userName: string, password: string) => {
        const usernameLower = normalizeUsername(userName)
        if (!isValidUsername(usernameLower)) {
            const err = new Error('invalid-username')
                ; (err as any).code = 'invalid-username'
            throw err
        }

        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)

        await runTransaction(db, async (tx) => {
            const unameRef = doc(db, 'Usernames', usernameLower)
            const unameSnap = await tx.get(unameRef)
            if (unameSnap.exists()) {
                const err = new Error('username-taken')
                    ; (err as any).code = 'username-taken'
                throw err
            }

            // Mapping public
            tx.set(unameRef, {
                uid: user.uid,
                email: email.trim(),
                usernameLower,
                displayName: userName.trim(),
            })

            // Profil privé
            const userRef = doc(db, 'Users', user.uid)
            tx.set(userRef, {
                email: email.trim(),
                userId: user.uid,
                userName: userName.trim(),
                userNameLower: usernameLower,
                walletBalance: 1000,
                lastDailyBonusClaimedAt: null,
            })

            // Agrégats scoreboard
            const statsRef = doc(db, 'player_stats', user.uid)
            tx.set(statsRef, {
                uid: user.uid,
                userName: userName.trim(),
                userNameLower: usernameLower,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                pushes: 0,
                totalWagered: 0,
                totalPayout: 0,
                net: 0,
                lastUpdated: serverTimestamp(),
            })
        })
    }

    return { signup }
}
