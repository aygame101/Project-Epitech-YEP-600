// config/firebaseConfig.js
import Constants from 'expo-constants'
import { initializeApp, getApps } from 'firebase/app'
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth'
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'
import {
  getFirestore,
  doc, getDoc, setDoc, onSnapshot, runTransaction,
  serverTimestamp, increment, Timestamp, collection, query, orderBy, limit as qLimit,
  where, addDoc, updateDoc, getDocs, startAt, endAt, documentId
} from 'firebase/firestore'


/* ===== Helpers Paris week (reset dimanche 23:59 => lundi 00:00) ===== */
function _lastSundayUTC(year, monthIndex0) {
  // renvoie le dernier dimanche (UTC) du mois (0=janvier)
  const d = new Date(Date.UTC(year, monthIndex0 + 1, 0)) // dernier jour du mois
  const day = d.getUTCDay() // 0..6 (0=dim)
  d.setUTCDate(d.getUTCDate() - day) // recule jusqu'au dimanche
  d.setUTCHours(0, 0, 0, 0)
  return d
}
function _isParisDST(dateUtc) {
  const y = dateUtc.getUTCFullYear()
  const start = _lastSundayUTC(y, 2) // mars
  start.setUTCHours(1, 0, 0, 0)      // 01:00 UTC
  const end = _lastSundayUTC(y, 9)   // octobre
  end.setUTCHours(1, 0, 0, 0)        // 01:00 UTC
  return dateUtc >= start && dateUtc < end
}
function _parisOffsetMs(dateUtc=new Date()) {
  // Paris = UTC+1 (hiver) ou UTC+2 (été)
  return _isParisDST(dateUtc) ? 2 * 3600000 : 1 * 3600000
}
function _parisNow(dateUtc=new Date()) {
  return new Date(dateUtc.getTime() + _parisOffsetMs(dateUtc))
}
/** Clé semaine: 'YYYY-MM-DD' (lundi 00:00 heure de Paris) */
export function getCurrentParisWeekKey(dateUtc=new Date()) {
  const p = _parisNow(dateUtc)
  // p est “Paris local” simulé en UTC; on utilise getters UTC pour rester cohérents
  const dow = p.getUTCDay() // 0..6 (0=dimanche)
  const daysSinceMonday = (dow + 6) % 7 // lundi=0, ..., dimanche=6
  const monday = new Date(Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday)
  monday.setUTCHours(0, 0, 0, 0)
  const y = monday.getUTCFullYear()
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0')
  const d = String(monday.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}` // ex: '2025-08-25'
}

// --- Config
const expoExtra = Constants.manifest?.extra ?? Constants.expoConfig?.extra
const firebaseConfig = {
  apiKey: expoExtra.API_KEY,
  authDomain: expoExtra.AUTH_DOMAIN,
  projectId: expoExtra.PROJECT_ID,
  storageBucket: expoExtra.STORAGE_BUCKET,
  messagingSenderId: expoExtra.MESSAGING_SENDER_ID,
  appId: expoExtra.APP_ID,
  measurementId: expoExtra.MEASUREMENT_ID
}

// --- Init
if (!getApps().length) initializeApp(firebaseConfig)

import { setLogLevel } from 'firebase/firestore'
setLogLevel('error')

export const auth = initializeAuth(getApps()[0], {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
})
export const db = getFirestore()

/* ==================== BONUS QUOTIDIEN ==================== */
export const DAILY_BONUS_INTERVAL_MS = 30 * 1000;         // TEST: 30s  (PROD: 24*60*60*1000)
export const DAILY_BONUS_GRACE_MS    = 60 * 1000;         // TEST: 60s  (PROD: 48*60*60*1000)
export const DAILY_BONUS_BASE        = 100;
export const DAILY_BONUS_STEP        = 100;
export const DAILY_BONUS_CAP         = 7;

export function listenDailyBonusStatus(userId, callback) {
  if (!userId) return () => {};
  const userDocRef = doc(db, 'Users', userId);

  return onSnapshot(userDocRef, (snap) => {
    const data = snap.data() || {};
    const lastField = data.lastDailyBonusClaimedAt;
    const last =
      lastField instanceof Timestamp ? lastField.toMillis()
        : typeof lastField === 'number' ? lastField : 0;

    const streak = Number(data.dailyBonusStreak || 0);
    const now = Date.now();

    const canClaim = last === 0 ? true : (now - last) >= DAILY_BONUS_INTERVAL_MS;
    const timeRemainingMs = canClaim ? 0 : Math.max(0, (last + DAILY_BONUS_INTERVAL_MS) - now);

    // fenêtre de grâce pour conserver la streak (jusqu'à last + 2*DAILY_BONUS_INTERVAL_MS)
    const graceEnd = last ? (last + DAILY_BONUS_INTERVAL_MS * 2) : 0;
    const graceRemainingMs = last ? Math.max(0, graceEnd - now) : 0;

    // montant si on réclame maintenant
    const nextStreak = Math.min((streak || 0) + 1, DAILY_BONUS_CAP);
    const nextAmount = DAILY_BONUS_BASE + DAILY_BONUS_STEP * (nextStreak - 1);

    callback({
      canClaim,
      timeRemainingMs,
      graceRemainingMs,
      streak,
      nextAmount,
      cap: DAILY_BONUS_CAP,
    });
  });
}

export async function claimDailyBonusClient(uid) {
  const ref = doc(db, 'Users', uid)
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('profil-not-found')

    const data = snap.data() || {}
    const lastField = data.lastDailyBonusClaimedAt
    const last =
      lastField instanceof Timestamp ? lastField.toMillis()
        : typeof lastField === 'number' ? lastField : 0
    const oldStreak = Number(data.dailyBonusStreak || 0)
    const now = Date.now()

    const dt = last ? (now - last) : Number.POSITIVE_INFINITY
    const canContinue = last > 0 && dt >= DAILY_BONUS_INTERVAL_MS && dt < DAILY_BONUS_GRACE_MS
    const canClaimNow = last === 0 || dt >= DAILY_BONUS_INTERVAL_MS

    if (!canClaimNow) {
      const remaining = (last + DAILY_BONUS_INTERVAL_MS) - now
      const secs = Math.ceil(remaining / 1000)
      return { status: 'failure', message: `Trop tôt. Réessaie dans ${secs}s.` }
    }

    const newStreak = last === 0 ? 1 : (canContinue ? Math.min(oldStreak + 1, DAILY_BONUS_CAP) : 1)
    const amount = DAILY_BONUS_BASE + DAILY_BONUS_STEP * (newStreak - 1)

    // DEBUG facultatif (utile si ça rebloque) :
    // console.log({ dt, last, oldStreak, newStreak, amount })

    tx.update(ref, {
      walletBalance: increment(amount),
      lastDailyBonusClaimedAt: serverTimestamp(),
      dailyBonusStreak: newStreak,
    })

    return {
      status: 'success',
      message: `Bonus de ${amount} réclamé ! (Jour ${newStreak}/${DAILY_BONUS_CAP})`,
      amount, newStreak,
    }
  })
}

/* ==================== SCOREBOARD / TRANSACTIONS ==================== */
/**
 * Enregistre un résultat de jeu et met à jour:
 * - player_stats/{uid} (agrégats)
 * - player_stats/{uid}/tx (append-only)
 * - Users/{uid}.walletBalance (solde)  => même transaction
 *
 * Retourne { delta, newBalance }.
 */

export async function recordGameResult(
  uid,
  { game = 'slots', wager = 0, payout = 0, metadata = {} }
) {
  const statsRef = doc(db, 'player_stats', uid)
  const txDocRef = doc(collection(db, `player_stats/${uid}/tx`))
  const userRef = doc(db, 'Users', uid)
  const w = Number(wager) || 0
  const p = Number(payout) || 0

  // ★ NEW – doc hebdo pour la “semaine Paris” courante
  const weekKey = getCurrentParisWeekKey()
  const weeklyRef = doc(db, 'player_stats_weekly', weekKey, 'stats', uid)

  return await runTransaction(db, async (tx) => {
    // 1) Lire user + solde
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists()) throw new Error('profile-missing')
    const userData = userSnap.data() || {}
    const currentBalance = Number(userData.walletBalance || 0)

    // 2) Lire stats lifetime
    const statsSnap = await tx.get(statsRef)
    let s = statsSnap.exists() ? statsSnap.data() : {
      uid,
      userName: userData.userName || '',
      userNameLower: (userData.userNameLower || '').toString(),
      gamesPlayed: 0, wins: 0, losses: 0, pushes: 0,
      totalWagered: 0, totalPayout: 0, net: 0,
      lastUpdated: serverTimestamp()
    }

    // ★ NEW) Lire stats hebdo
    const weeklySnap = await tx.get(weeklyRef)
    let ws = weeklySnap.exists() ? weeklySnap.data() : {
      uid,
      weekKey,
      userName: userData.userName || '',
      userNameLower: (userData.userNameLower || '').toString(),
      gamesPlayed: 0, wins: 0, losses: 0, pushes: 0,
      totalWagered: 0, totalPayout: 0, net: 0,
      lastUpdated: serverTimestamp()
    }

    const delta = p - w
    const newBalance = currentBalance + delta

    // 3) Écrire transaction append-only
    tx.set(txDocRef, {
      uid,
      game,
      wager: w,
      payout: p,
      delta,
      metadata: { ...metadata, weekKey }, // ★ utile pour debug
      createdAt: serverTimestamp()
    })

    // 4) Mettre à jour agrégats (lifetime)
    const gamesPlayed = (s.gamesPlayed || 0) + 1
    const wins = (s.wins || 0) + (delta > 0 ? 1 : 0)
    const losses = (s.losses || 0) + (delta < 0 ? 1 : 0)
    const pushes = (s.pushes || 0) + (delta === 0 ? 1 : 0)
    const totalWagered = (s.totalWagered || 0) + w
    const totalPayout = (s.totalPayout || 0) + p
    const net = totalPayout - totalWagered

    tx.set(statsRef, {
      uid,
      userName: s.userName || userData.userName || '',
      userNameLower: s.userNameLower || (userData.userNameLower || '').toString(),
      gamesPlayed, wins, losses, pushes,
      totalWagered, totalPayout, net,
      lastUpdated: serverTimestamp()
    }, { merge: true })

    // ★ NEW) Mettre à jour agrégats (hebdo)
    const w_gamesPlayed = (ws.gamesPlayed || 0) + 1
    const w_wins = (ws.wins || 0) + (delta > 0 ? 1 : 0)
    const w_losses = (ws.losses || 0) + (delta < 0 ? 1 : 0)
    const w_pushes = (ws.pushes || 0) + (delta === 0 ? 1 : 0)
    const w_totalWagered = (ws.totalWagered || 0) + w
    const w_totalPayout = (ws.totalPayout || 0) + p
    const w_net = w_totalPayout - w_totalWagered

    tx.set(weeklyRef, {
      uid,
      weekKey,
      userName: ws.userName || userData.userName || '',
      userNameLower: ws.userNameLower || (userData.userNameLower || '').toString(),
      gamesPlayed: w_gamesPlayed,
      wins: w_wins,
      losses: w_losses,
      pushes: w_pushes,
      totalWagered: w_totalWagered,
      totalPayout: w_totalPayout,
      net: w_net,
      lastUpdated: serverTimestamp()
    }, { merge: true })

    // 5) Mettre à jour le solde joueur
    tx.update(userRef, {
      walletBalance: newBalance,
      lastGameAt: serverTimestamp(),
      lastGameDelta: delta
    })

    return { delta, newBalance }
  })
}


/* ===== Scoreboard live ===== */
export function listenScoreboardTop(topN = 10, callback) {
  const ref = collection(db, 'player_stats')
  const q = query(ref, orderBy('totalPayout', 'desc'), qLimit(topN))
  const unsub = onSnapshot(q, (snap) => {
    const rows = []
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }))
    callback(rows)
  })
  return unsub
}

/* ===== Scoreboard hebdo (semaine courante Europe/Paris) ===== */
export function listenWeeklyScoreboardTop(topN = 10, callback, weekKey = getCurrentParisWeekKey()) {
  const ref = collection(db, 'player_stats_weekly', weekKey, 'stats')
  const q = query(ref, orderBy('totalPayout', 'desc'), qLimit(topN))
  const unsub = onSnapshot(q, (snap) => {
    const rows = []
    snap.forEach((d) => rows.push({ id: d.id, ...d.data() }))
    callback(rows)
  })
  return unsub
}

/* ===== Utilitaires profil ===== */
export async function saveUserProfile(userId, profileData) {
  await setDoc(doc(db, 'Users', userId), profileData, { merge: true })
}
export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'Users', userId))
  return snap.exists() ? snap.data() : null
}

/* ==================== CHAT / USER DIRECTORY ==================== */

// Id de conversation déterministe pour 1–1
// Toujours un id + un ordre d'UIDs déterministes
const normalizePair = (a, b) => {
  const ids = [String(a), String(b)].sort()   // 👈 ordre stable
  return { cid: ids.join('_'), ids }
}
export const conversationIdFor = (a, b) => normalizePair(a, b).cid

export async function searchUsersByPrefix(prefix = '', limit = 20) {
  const ref = collection(db, 'Usernames')
  const start = prefix.trim().toLowerCase()
  const end = start + '\uf8ff'
  const q = query(
    ref,
    orderBy('usernameLower'),
    startAt(start),
    endAt(end),
    qLimit(limit)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() || {}
    return {
      id: d.id,
      usernameLower: d.id,
      uid: data.uid,
      displayName: data.displayName || d.id,
      avatarUrl: data.avatarUrl || null
    }
  })
}

export async function getOrCreateConversation(myUid, other) {
  const { cid, ids } = normalizePair(myUid, other.uid)
  const cref = doc(db, 'conversations', cid)

  // 1) create-or-merge SANS jamais lire avant
  try {
    await setDoc(cref, {
      participantIds: ids,                    // 👈 ordre stable, identique pour les 2 côtés
      participants: {
        [myUid]: { displayName: 'You' },
        [other.uid]: { displayName: other.displayName || other.usernameLower || 'Player' }
      }
    }, { merge: true })
  } catch (e) {
    // Si la conv existe avec l'ordre inverse, la règle bloque le changement → on ignore et on continue
    console.warn('[chat] setDoc conv skipped:', e?.message)
  }

  // 2) méta autorisées
  try {
    await updateDoc(cref, { updatedAt: serverTimestamp() })
  } catch { /* pas grave la 1ère fois */ }

  return { cid }
}

export async function sendMessage({ cid, senderId, text }) {
  const t = (text || '').slice(0, 2000)
  const mref = collection(db, 'conversations', cid, 'messages')

  await addDoc(mref, {
    senderId,
    type: 'text',
    text: t,
    createdAt: serverTimestamp()
  })
  await updateDoc(doc(db, 'conversations', cid), {
    lastMessage: t.slice(0, 200),
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

// Ecoute des messages d'une conversation
export function listenMessages(cid, callback) {
  const ref = collection(db, 'conversations', cid, 'messages')
  const q = query(ref, orderBy('createdAt', 'asc'), qLimit(200))
  const unsub = onSnapshot(q, (snap) => {
    const rows = []
    snap.forEach(d => rows.push({ id: d.id, ...d.data() }))
    callback(rows)
  })
  return unsub
}

// Marquer comme lu
export async function markRead({ cid, uid }) {
  const mref = doc(db, 'conversations', cid, 'members', uid)
  const snap = await getDoc(mref)
  if (!snap.exists()) {
    await setDoc(mref, { lastReadAt: serverTimestamp() })
  } else {
    await updateDoc(mref, { lastReadAt: serverTimestamp() })
  }
}
