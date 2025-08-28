// components/services/DailyBonus.js
import React, { useEffect, useState, useCallback } from 'react'
import {
  TouchableOpacity,
  Text,
  View,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native'
import {
  auth,
  listenDailyBonusStatus,
  claimDailyBonusClient,
  // on utilise la voie "jeu" pour ajouter/soustraire l'écart après le double
  recordGameResult,
} from '../../config/firebaseConfig'

const ACCENT = '#ff3e80'
const BASE = 100
const STEP = 100
const CAP = 7

export default function DailyBonus({ buttonStyle, textStyle }) {
  const [canClaim, setCanClaim] = useState(false)
  const [loading, setLoading] = useState(false)

  // Modal principal
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState(null)
  const [streak, setStreak] = useState(0)
  const [cap, setCap] = useState(CAP)
  const [nextAmount, setNextAmount] = useState(BASE)

  // Timers
  const [claimDeadline, setClaimDeadline] = useState(0)
  const [graceDeadline, setGraceDeadline] = useState(0)
  const [claimLeftMs, setClaimLeftMs] = useState(0)
  const [graceLeftMs, setGraceLeftMs] = useState(0)

  // Modal "Double ou rien"
  const [mode, setMode] = useState('main')
  const [baseAmount, setBaseAmount] = useState(BASE) // montant du bonus “normal” d’aujourd’hui
  const [pot, setPot] = useState(BASE)               // cagnotte en cours (double à chaque win)
  const [rounds, setRounds] = useState(0)            // nb de doubles réussis
  const [lastPick, setLastPick] = useState(null)     // 'pile' | 'face' | null
  const [lastFlip, setLastFlip] = useState(null)     // 'pile' | 'face' | null
  const [lost, setLost] = useState(false)            // a-t-on tout perdu ?
  const [isFlipping, setIsFlipping] = useState(false) // animation en cours ?

  // Animation de la pièce (recréable)
  const [spinKey, setSpinKey] = useState(0)
  const spin = React.useMemo(() => new Animated.Value(0), [spinKey])
  const spinAngleRef = React.useRef(0)
  useEffect(() => { spinAngleRef.current = 0 }, [spinKey])
  // --- Opacités des faces selon l'angle ---
  const spinMod = Animated.modulo(spin, 360)

  const frontOpacity = spinMod.interpolate({
    inputRange: [0, 89, 90, 269, 270, 360],
    outputRange: [1, 1, 0, 0, 1, 1],
    extrapolate: 'clamp',
  })
  const backOpacity = spinMod.interpolate({
    inputRange: [0, 89, 90, 269, 270, 360],
    outputRange: [0, 0, 1, 1, 0, 0],
    extrapolate: 'clamp',
  })

  // ---- écoute Firestore
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    return listenDailyBonusStatus(user.uid, (s) => {
      setCanClaim(!!s?.canClaim)

      const rawStreak = Number(s?.streak || 0)
      const capLocal = Number(s?.cap || CAP)
      setStreak(rawStreak)
      setCap(capLocal)

      // Prochain bonus = 1er palier si aucune streak
      const nextStreak = rawStreak <= 0 ? 1 : Math.min(rawStreak + 1, capLocal)
      const amount = BASE + STEP * (nextStreak - 1)
      setNextAmount(amount)

      const cd = Date.now() + Number(s?.timeRemainingMs || 0)
      const gd = Date.now() + Number(s?.graceRemainingMs || 0)
      setClaimDeadline(cd)
      setGraceDeadline(gd)
      setClaimLeftMs(Math.max(0, cd - Date.now()))
      setGraceLeftMs(Math.max(0, gd - Date.now()))
      setMessage(null)
    })
  }, [])

  // ➜ fin du délai de claim : bouton se transforme en “Réclamer”
  useEffect(() => {
    if (!claimDeadline) return
    const wait = Math.max(0, claimDeadline - Date.now())
    const to = setTimeout(() => setCanClaim(true), wait)
    return () => clearTimeout(to)
  }, [claimDeadline])

  // ➜ fin de la fenêtre de grâce : reset visuel
  useEffect(() => {
    if (!graceDeadline) return
    const wait = Math.max(0, graceDeadline - Date.now())
    const to = setTimeout(() => {
      setStreak(0)
      setNextAmount(BASE)
    }, wait)
    return () => clearTimeout(to)
  }, [graceDeadline])

  // tick 1s pendant modal principal
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => {
      const remainClaim = Math.max(0, claimDeadline - Date.now())
      const remainGrace = Math.max(0, graceDeadline - Date.now())
      setClaimLeftMs(remainClaim)
      setGraceLeftMs(remainGrace)
      if (remainClaim <= 0 && !canClaim) setCanClaim(true)
      if (remainGrace <= 0 && streak !== 0) {
        setStreak(0)
        setNextAmount(BASE)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [visible, claimDeadline, graceDeadline, canClaim, streak])

  const fmtHMS = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(sec)}`
  }

  const openModal = useCallback(() => {
    setMessage(null)
    setMode('main')
    setVisible(true)
    const remain = Math.max(0, claimDeadline - Date.now())
    setClaimLeftMs(remain)
    if (remain <= 0) setCanClaim(true)
    const remainGrace = Math.max(0, graceDeadline - Date.now())
    setGraceLeftMs(remainGrace)
    if (remainGrace <= 0 && streak !== 0) {
      setStreak(0)
      setNextAmount(BASE)
    }
  }, [claimDeadline, graceDeadline, streak])

  const closeModal = useCallback(() => {
    if (loading) return
    setVisible(false)
    setMode('main')
  }, [loading])

  // --- Double ou rien
  const openDouble = useCallback(() => {
    if (!canClaim) return
    setSpinKey(k => k + 1)
    setBaseAmount(nextAmount)
    setPot(nextAmount)
    setRounds(0)
    setLastPick(null)
    setLastFlip(null)
    setLost(false)
    setMode('double')        // 👉 on reste dans le même modal
  }, [canClaim, nextAmount])

  const flip = useCallback((pick) => {
    if (lost || isFlipping) return
    setIsFlipping(true)
    const result = Math.random() < 0.5 ? 'pile' : 'face'

    // 3 tours complets + demi-tour si "face", pour tomber du bon côté
    const fullSpins = 3
    const extra = result === 'pile' ? 0 : 180
    const target = spinAngleRef.current + 360 * fullSpins + extra

    Animated.timing(spin, {
      toValue: target,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      // mémorise l'angle final (on ramène dans [0..360) pour éviter de grossir indéfiniment)
      spinAngleRef.current = target //% 360

      // On révèle le résultat et on met à jour le pot
      setLastPick(pick)
      setLastFlip(result)
      if (pick === result) {
        setPot((p) => p * 2)
        setRounds((r) => r + 1)
      } else {
        setPot(0)
        setLost(true)
      }
      setIsFlipping(false)
    })
  }, [lost, isFlipping, spin])

  // écriture finale : bonus normal + écart via game tx
  const finalizeClaim = useCallback(async (finalTotal) => {
    const user = auth.currentUser
    if (!user) return
    try {
      setLoading(true)
      // 1) on crédite le bonus normal et on consomme le jour
      const baseRes = await claimDailyBonusClient(user.uid)

      // 2) SEULEMENT si on vient du mode "double", on compense l'écart
      if (mode === 'double') {
        const diff = Math.round(finalTotal - baseAmount)
        if (diff > 0) {
          await recordGameResult(user.uid, {
            game: 'bonus-double',
            wager: 0,
            payout: diff,
            metadata: { rounds, outcome: 'win' }
          })
        } else if (diff < 0) {
          await recordGameResult(user.uid, {
            game: 'bonus-double',
            wager: baseAmount,
            payout: 0,
            metadata: { rounds, outcome: 'lose' }
          })
        }
      }

      setMessage(baseRes?.message || 'Bonus traité.')
      setMode('main')
      setVisible(false)
      // le snapshot va passer canClaim=false, et rafraîchir l’UI
    } catch (e) {
      console.error(e)
      setMessage("Impossible de finaliser le bonus.")
    } finally {
      setLoading(false)
    }
  }, [mode, baseAmount, rounds])

  return (
    <>
      {/* 🎁 toujours visible; dim si pas prêt */}
      <TouchableOpacity
        accessibilityLabel="Bonus quotidien"
        onPress={openModal}
        style={[buttonStyle, !canClaim && styles.dimmed]}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Text style={textStyle}>🎁</Text>
      </TouchableOpacity>

      {/* MODAL PRINCIPAL */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>{mode === 'main' ? (
            <>
              <Text style={styles.title}>Bonus quotidien</Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Série actuelle : <Text style={styles.em}>{Math.min(streak, cap)}</Text> / {cap}
                </Text>
                <Text style={styles.infoText}>
                  Prochain bonus : <Text style={styles.em}>{nextAmount} jets</Text>
                </Text>
                {streak > 0 && canClaim && graceLeftMs > 0 && (
                  <Text style={styles.infoText}>
                    Perte de la série dans : <Text style={styles.em}>{fmtHMS(graceLeftMs)}</Text>
                  </Text>
                )}
              </View>

              <View style={styles.actionsRow}>
                <Pressable onPress={closeModal} disabled={loading} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                  <Text style={styles.secondaryText}>Fermer</Text>
                </Pressable>
                <Pressable
                  onPress={openDouble}
                  disabled={!canClaim || loading}
                  style={({ pressed }) => [
                    styles.ghostBtn,
                    (!canClaim || loading) && styles.ghostBtnDisabled,
                    pressed && canClaim && styles.pressed,
                  ]}
                >
                  <Text style={styles.ghostText}>Doubler ?</Text>
                </Pressable>
                <Pressable
                  onPress={() => finalizeClaim(nextAmount)}
                  disabled={!canClaim || loading}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (!canClaim || loading) && styles.primaryBtnDisabled,
                    pressed && canClaim && styles.pressed,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#0f1123" />
                  ) : (
                    <Text style={styles.primaryText}>
                      {canClaim ? `Réclamer` : fmtHMS(claimLeftMs)}
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            /* ====== MODE "double" ====== */
            <>
              <Text style={styles.title}>Double ou rien</Text>

              <View style={[styles.infoBox, { alignItems: 'center' }]}>
                <Text style={styles.infoText}>Cagnotte actuelle :</Text>
                <Text style={[styles.em, { fontSize: 22 }]}>{pot} jets</Text>
                {lastFlip && (
                  <Text style={[styles.infoText, { marginTop: 6 }]}>
                    Tu as choisi <Text style={styles.em}>{lastPick}</Text> → résultat : <Text style={styles.em}>{lastFlip}</Text>
                  </Text>
                )}
              </View>

              {/* Pièce animée — toujours visible */}
              <View style={styles.coinArea}>
                <Animated.View
                  style={[
                    styles.coin,
                    {
                      transform: [
                        { perspective: 800 },
                        {
                          rotateY: spin.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                            extrapolate: 'extend',
                          }),
                        },
                        {
                          scaleX: spinMod.interpolate({
                            inputRange: [0, 90, 180, 270, 360],
                            outputRange: [1, 0.8, 1, 0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {/* Face "Pile" */}
                  <Animated.View style={[styles.face, { opacity: frontOpacity }]}>
                    <Text style={styles.faceText}>PILE</Text>
                  </Animated.View>
                  {/* Face "Face" */}
                  <Animated.View style={[styles.face, { opacity: backOpacity }]}>
                    <Text style={[styles.faceText, styles.faceBack]}>FACE</Text>
                  </Animated.View>
                </Animated.View>
              </View>

              {!lost ? (
                <>
                  <Text style={styles.bodyCenter}>Choisis ton côté :</Text>
                  <View style={styles.choiceRow}>
                    <Pressable
                      onPress={() => flip('pile')}
                      disabled={isFlipping}
                      style={({ pressed }) => [styles.coinBtn, isFlipping && styles.disabledBtn, pressed && !isFlipping && styles.pressed]}
                    >
                      <Text style={styles.coinText}>Pile</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => flip('face')}
                      disabled={isFlipping}
                      style={({ pressed }) => [styles.coinBtn, isFlipping && styles.disabledBtn, pressed && !isFlipping && styles.pressed]}
                    >
                      <Text style={styles.coinText}>Face</Text>
                    </Pressable>
                  </View>

                  {rounds > 0 && (
                    <View style={styles.actionsRow}>
                      <Pressable onPress={() => finalizeClaim(pot)} disabled={isFlipping} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                        <Text style={styles.primaryText}>Réclamer ({pot})</Text>
                      </Pressable>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.bodyCenter, { marginBottom: 10 }]}>Perdu… tu repars avec 0.</Text>
                  <View style={styles.actionsRow}>
                    <Pressable onPress={() => finalizeClaim(0)} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                      <Text style={styles.primaryText}>Réclamer (0)</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </>

          )}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  dimmed: { opacity: 0.55 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: '#0f1123', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  infoBox: { marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 10 },
  infoText: { fontSize: 15, color: '#bbb', marginBottom: 4 },
  em: { color: ACCENT, fontWeight: '800' },
  body: { fontSize: 16, color: '#ccc', marginBottom: 18 },
  bodyCenter: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 6 },
  primaryBtn: { backgroundColor: ACCENT, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  primaryBtnDisabled: { backgroundColor: 'rgba(255, 62, 128, 0.35)' },
  primaryText: { color: '#0f1123', fontWeight: '800', fontSize: 16 },
  secondaryBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: ACCENT, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  secondaryText: { color: ACCENT, fontWeight: '700', fontSize: 16 },
  ghostBtn: { backgroundColor: 'rgba(255,255,255,0.04)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  ghostBtnDisabled: { opacity: 0.5 },
  ghostText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  pressed: { transform: [{ scale: 0.98 }] },
  choiceRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 10 },
  coinBtn: { backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  coinText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  coinArea: { alignItems: 'center', justifyContent: 'center', marginBottom: 12, height: 90 },
  coin: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    // petit style "pièce"
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'visible',
  },
  face: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  faceBack: {
    transform: [{ rotateY: '180deg' }],
  },

  faceText: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 1,
  },
  disabledBtn: { opacity: 0.5 },
})
