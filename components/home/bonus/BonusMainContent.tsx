// components/bonus/BonusMainContent.tsx
import React from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { fmtHMS } from '../../../utils/time'
import { COLORS } from '../../../constants/layout'

type Props = {
    loading: boolean
    canClaim: boolean
    streak: number
    cap: number
    nextAmount: number
    claimLeftMs: number
    graceLeftMs: number
    onClose: () => void
    onOpenDouble: () => void
    onClaimNow: () => void
}

export default function BonusMainContent({
    loading, canClaim, streak, cap, nextAmount, claimLeftMs, graceLeftMs,
    onClose, onOpenDouble, onClaimNow,
}: Props) {
    return (
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
                <Pressable onPress={onClose} disabled={loading} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                    <Text style={styles.secondaryText}>Fermer</Text>
                </Pressable>
                <Pressable
                    onPress={onOpenDouble}
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
                    onPress={onClaimNow}
                    disabled={!canClaim || loading}
                    style={({ pressed }) => [
                        styles.primaryBtn,
                        (!canClaim || loading) && styles.primaryBtnDisabled,
                        pressed && canClaim && styles.pressed,
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.bg} />
                    ) : (
                        <Text style={styles.primaryText}>
                            {canClaim ? `Réclamer` : fmtHMS(claimLeftMs)}
                        </Text>
                    )}
                </Pressable>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
    infoBox: { marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 10 },
    infoText: { fontSize: 15, color: '#bbb', marginBottom: 4 },
    em: { color: COLORS.accent, fontWeight: '800' },
    actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 6 },
    primaryBtn: { backgroundColor: COLORS.accent, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
    primaryBtnDisabled: { backgroundColor: 'rgba(255, 62, 128, 0.35)' },
    primaryText: { color: COLORS.bg, fontWeight: '800', fontSize: 16 },
    secondaryBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.accent, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
    secondaryText: { color: COLORS.accent, fontWeight: '700', fontSize: 16 },
    ghostBtn: { backgroundColor: 'rgba(255,255,255,0.04)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    ghostBtnDisabled: { opacity: 0.5 },
    ghostText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    pressed: { transform: [{ scale: 0.98 }] },
})
