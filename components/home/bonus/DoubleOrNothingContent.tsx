// components/bonus/DoubleOrNothingContent.tsx
import React from 'react'
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native'
import { COLORS } from '../../../constants/layout'

type Props = {
    pot: number
    rounds: number
    lastPick: 'pile' | 'face' | null
    lastFlip: 'pile' | 'face' | null
    lost: boolean
    isFlipping: boolean
    frontOpacity: any
    backOpacity: any
    rotateY: any
    scaleX: any
    onPick: (side: 'pile' | 'face') => void
    onClaim: () => void
}

export default function DoubleOrNothingContent({
    pot, rounds, lastPick, lastFlip, lost, isFlipping,
    frontOpacity, backOpacity, rotateY, scaleX,
    onPick, onClaim,
}: Props) {
    return (
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

            {/* Pièce animée */}
            <View style={styles.coinArea}>
                <Animated.View
                    style={[
                        styles.coin,
                        {
                            transform: [
                                { perspective: 800 },
                                { rotateY },
                                { scaleX },
                            ],
                        },
                    ]}
                >
                    <Animated.View style={[styles.face, { opacity: frontOpacity }]}>
                        <Text style={styles.faceText}>PILE</Text>
                    </Animated.View>
                    <Animated.View style={[styles.face, styles.faceBack, { opacity: backOpacity }]}>
                        <Text style={styles.faceText}>FACE</Text>
                    </Animated.View>
                </Animated.View>
            </View>

            {!lost ? (
                <>
                    <Text style={styles.bodyCenter}>Choisis ton côté :</Text>
                    <View style={styles.choiceRow}>
                        <Pressable
                            onPress={() => onPick('pile')}
                            disabled={isFlipping}
                            style={({ pressed }) => [styles.coinBtn, isFlipping && styles.disabledBtn, pressed && !isFlipping && styles.pressed]}
                        >
                            <Text style={styles.coinText}>Pile</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onPick('face')}
                            disabled={isFlipping}
                            style={({ pressed }) => [styles.coinBtn, isFlipping && styles.disabledBtn, pressed && !isFlipping && styles.pressed]}
                        >
                            <Text style={styles.coinText}>Face</Text>
                        </Pressable>
                    </View>

                    {rounds > 0 && (
                        <View style={styles.actionsRow}>
                            <Pressable onPress={onClaim} disabled={isFlipping} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                                <Text style={styles.primaryText}>Réclamer ({pot})</Text>
                            </Pressable>
                        </View>
                    )}
                </>
            ) : (
                <>
                    <Text style={[styles.bodyCenter, { marginBottom: 10 }]}>Perdu… tu repars avec 0.</Text>
                    <View style={styles.actionsRow}>
                        <Pressable onPress={onClaim} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                            <Text style={styles.primaryText}>Réclamer (0)</Text>
                        </Pressable>
                    </View>
                </>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
    infoBox: { marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 10 },
    infoText: { fontSize: 15, color: '#bbb', marginBottom: 4 },
    em: { color: COLORS.accent, fontWeight: '800' },
    bodyCenter: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 12 },
    actionsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 6 },
    primaryBtn: { backgroundColor: COLORS.accent, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
    primaryText: { color: COLORS.bg, fontWeight: '800', fontSize: 16 },
    pressed: { transform: [{ scale: 0.98 }] },
    choiceRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 10 },
    coinBtn: { backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    coinText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    disabledBtn: { opacity: 0.5 },

    coinArea: { alignItems: 'center', justifyContent: 'center', marginBottom: 12, height: 90 },
    coin: {
        width: 80, height: 80, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    face: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    faceBack: { transform: [{ rotateY: '180deg' }] },
    faceText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
})
