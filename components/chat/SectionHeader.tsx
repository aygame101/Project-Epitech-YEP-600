// components/chat/SectionHeader.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../../constants/layout'

export default function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    sectionHeader: {
        paddingTop: 14,
        paddingBottom: 6,
        backgroundColor: COLORS.bg,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
})
