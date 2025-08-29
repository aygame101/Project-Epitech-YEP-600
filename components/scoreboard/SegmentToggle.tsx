// components/scoreboard/SegmentToggle.tsx
import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { COLORS } from '../../constants/layout'
import type { Mode } from '../../hooks/home/useScoreboard'

type Props = {
    mode: Mode
    onChange: (m: Mode) => void
}

export default function SegmentToggle({ mode, onChange }: Props) {
    return (
        <View style={styles.segment}>
            <TouchableOpacity
                style={[styles.segmentBtn, mode === 'weekly' && styles.segmentBtnActive]}
                onPress={() => onChange('weekly')}
            >
                <Text style={[styles.segmentText, mode === 'weekly' && styles.segmentTextActive]}>
                    Cette semaine
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.segmentBtn, mode === 'global' && styles.segmentBtnActive]}
                onPress={() => onChange('global')}
            >
                <Text style={[styles.segmentText, mode === 'global' && styles.segmentTextActive]}>
                    Global
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    segment: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255, 62, 128, 0.35)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 4,
        marginBottom: 12,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    segmentBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: 'transparent',
    },
    segmentBtnActive: {
        backgroundColor: 'rgba(255, 62, 128, 0.15)',
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    segmentText: {
        color: '#ccc',
        fontWeight: '600',
        fontSize: 14,
    },
    segmentTextActive: {
        color: COLORS.accent,
    },
})
