// components/scoreboard/ScoreRow.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../../constants/layout'
import { formatJets } from '../../utils/number'
import type { Row } from '../../hooks/home/useScoreboard'

type Props = { item: Row; index: number }

export default function ScoreRow({ item, index }: Props) {
    const isTop3 = index < 3
    const medal = ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`

    return (
        <View style={[styles.row, isTop3 && styles.topRow]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.rank}>{medal}</Text>
                <Text style={styles.name} numberOfLines={1}>
                    {item.userName || item.userNameLower || 'Joueur'}
                </Text>
            </View>
            <Text style={styles.net}>{formatJets(item.totalPayout)}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 62, 128, 0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    topRow: {
        backgroundColor: 'rgba(255, 62, 128, 0.10)',
        borderColor: 'rgba(255, 62, 128, 0.35)',
        shadowColor: COLORS.accent,
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    rank: {
        width: 34,
        color: COLORS.accent,
        fontSize: 18,
        fontWeight: '700',
    },
    name: {
        color: '#fff',
        fontSize: 16,
        maxWidth: 220,
    },
    net: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
