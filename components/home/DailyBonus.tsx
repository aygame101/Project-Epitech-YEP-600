// components/home/DailyBonus.tsx
import React, { useCallback, useMemo, useState } from 'react'
import { TouchableOpacity, Text, View, Modal, StyleSheet } from 'react-native'
import { auth, claimDailyBonusClient, recordGameResult } from '../../config/firebaseConfig'
import { useDailyBonus } from '../../hooks/home/useDailyBonus'
import { useCoinFlip } from '../../hooks/home/useCoinFlip'
import BonusMainContent from './bonus/BonusMainContent'
import DoubleOrNothingContent from './bonus/DoubleOrNothingContent'
import { COLORS } from '../../constants/layout'

export default function DailyBonus({ buttonStyle, textStyle }: { buttonStyle?: any; textStyle?: any }) {
  const me = auth.currentUser
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<'main' | 'double'>('main')
  const [loading, setLoading] = useState(false)

  // Bonus live + timers (tick quand le modal est ouvert)
  const {
    canClaim, streak, cap, nextAmount, claimLeftMs, graceLeftMs,
  } = useDailyBonus(me?.uid, visible)

  // Coin flip state/animations
  const {
    baseAmount, pot, rounds, lastPick, lastFlip, lost, isFlipping,
    frontOpacity, backOpacity, rotateY, scaleX, start, flip,
  } = useCoinFlip()

  const openModal = useCallback(() => {
    setMode('main')
    setVisible(true)
  }, [])
  const closeModal = useCallback(() => {
    if (loading) return
    setVisible(false)
    setMode('main')
  }, [loading])

  const openDouble = useCallback(() => {
    if (!canClaim) return
    start(nextAmount)
    setMode('double')
  }, [canClaim, nextAmount, start])

  // Écriture finale : bonus normal + écarts via transactions "game"
  const finalizeClaim = useCallback(async (finalTotal: number) => {
    if (!me?.uid) return
    try {
      setLoading(true)
      // 1) crédite le bonus normal et consomme le jour
      await claimDailyBonusClient(me.uid)

      // 2) si on vient du double, on compense l'écart
      if (mode === 'double') {
        const diff = Math.round(finalTotal - baseAmount)
        if (diff > 0) {
          await recordGameResult(me.uid, {
            game: 'bonus-double',
            wager: 0,
            payout: diff,
            metadata: { rounds, outcome: 'win' },
          })
        } else if (diff < 0) {
          await recordGameResult(me.uid, {
            game: 'bonus-double',
            wager: baseAmount,
            payout: 0,
            metadata: { rounds, outcome: 'lose' },
          })
        }
      }

      setVisible(false) // le snapshot Firestore rafraîchira l’UI
      setMode('main')
    } catch (e) {
      console.error(e)
      // on laisse le modal ouvert; l'utilisateur peut réessayer
    } finally {
      setLoading(false)
    }
  }, [me?.uid, mode, baseAmount, rounds])

  return (
    <>
      {/* 🎁 Bouton rond compact (comme avant) */}
      <TouchableOpacity
        accessibilityLabel="Bonus quotidien"
        onPress={openModal}
        style={[buttonStyle, !canClaim && styles.dimmed]}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Text style={textStyle}>🎁</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            {mode === 'main' ? (
              <BonusMainContent
                loading={loading}
                canClaim={canClaim}
                streak={streak}
                cap={cap}
                nextAmount={nextAmount}
                claimLeftMs={claimLeftMs}
                graceLeftMs={graceLeftMs}
                onClose={closeModal}
                onOpenDouble={openDouble}
                onClaimNow={() => finalizeClaim(nextAmount)}
              />
            ) : (
              <DoubleOrNothingContent
                pot={pot}
                rounds={rounds}
                lastPick={lastPick}
                lastFlip={lastFlip}
                lost={lost}
                isFlipping={isFlipping}
                frontOpacity={frontOpacity}
                backOpacity={backOpacity}
                rotateY={rotateY}
                scaleX={scaleX}
                onPick={flip}
                onClaim={() => finalizeClaim(lost ? 0 : pot)}
              />
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
    width: '100%', maxWidth: 420, backgroundColor: COLORS.bg, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 20,
  },
})
