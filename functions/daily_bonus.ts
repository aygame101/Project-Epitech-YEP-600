// functions/src/claimDailyBonus.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import * as admin from 'firebase-admin'

if (admin.apps.length === 0) {
  admin.initializeApp()
}

const ERROR_MESSAGES = {
  UNAUTHENTICATED: 'Vous devez être connecté pour réclamer un bonus.',
  INTERNAL_ERROR: 'Une erreur est survenue lors de la réclamation du bonus.',
  USER_NOT_FOUND: 'Utilisateur non trouvé.'
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const BONUS_AMOUNT = 100

// Adapte la région à ton déploiement (ex: 'europe-west1')
export const claimDailyBonus = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', ERROR_MESSAGES.UNAUTHENTICATED)
  }

  const uid = request.auth.uid
  const fs = admin.firestore()
  const userRef = fs.collection('Users').doc(uid)

  try {
    const result = await fs.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      if (!snap.exists) {
        throw new HttpsError('not-found', ERROR_MESSAGES.USER_NOT_FOUND)
      }

      const data = snap.data() || {}
      const lastField = data.lastDailyBonusClaimedAt

      const last =
        lastField && typeof lastField.toMillis === 'function'
          ? lastField.toMillis()
          : typeof lastField === 'number'
          ? lastField
          : 0

      const now = Date.now()

      if (now - last < ONE_DAY_MS) {
        const timeRemaining = (last + ONE_DAY_MS) - now
        const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60))
        return {
          status: 'failure',
          message: `Revenez dans ${hoursRemaining} heure(s) pour votre prochain bonus.`
        }
      }

      tx.update(userRef, {
        walletBalance: admin.firestore.FieldValue.increment(BONUS_AMOUNT),
        lastDailyBonusClaimedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      return { status: 'success', message: `Bonus de ${BONUS_AMOUNT} réclamé !` }
    })

    return result
  } catch (error) {
    logger.error('Erreur lors de la réclamation du bonus:', error)
    if (error instanceof HttpsError) throw error
    throw new HttpsError('internal', ERROR_MESSAGES.INTERNAL_ERROR)
  }
})
