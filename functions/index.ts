import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const ERROR_MESSAGES = {
  UNAUTHENTICATED: 'Vous devez être connecté pour réclamer un bonus.',
  INTERNAL_ERROR: 'Une erreur est survenue lors de la réclamation du bonus.',
  USER_NOT_FOUND: 'Utilisateur non trouvé.'
};

export const claimDailyBonus = functions.https.onCall(async (data: any, context: functions.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', ERROR_MESSAGES.UNAUTHENTICATED);
  }

  const userId = context.auth.uid;
  const db = admin.database();
  const userRef = db.ref(`users/${userId}`);

  try {
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      throw new functions.https.HttpsError('not-found', ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const lastClaimedAt = typeof userData.lastDailyBonusClaimedAt === 'number' ? userData.lastDailyBonusClaimedAt : 0;
    const currentTime = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const BONUS_AMOUNT = 100;

    if (currentTime - lastClaimedAt >= ONE_DAY_MS) {
      const newCurrency = (typeof userData.currency === 'number' ? userData.currency : 0) + BONUS_AMOUNT;
      await userRef.update({
        lastDailyBonusClaimedAt: admin.database.ServerValue.TIMESTAMP,
        currency: newCurrency
      });
      return { status: 'success', message: `Bonus de ${BONUS_AMOUNT} réclamé !` };
    } else {
      const timeRemaining = (lastClaimedAt + ONE_DAY_MS) - currentTime;
      const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
      return {
        status: 'failure',
        message: `Revenez dans ${hoursRemaining} heure(s) pour votre prochain bonus.`
      };
    }
  } catch (error) {
    console.error("Erreur lors de la réclamation du bonus:", error);
    throw new functions.https.HttpsError('internal', ERROR_MESSAGES.INTERNAL_ERROR);
  }
});
