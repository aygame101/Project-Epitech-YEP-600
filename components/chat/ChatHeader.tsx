// components/chat/ChatHeader.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { COLORS } from '../../constants/layout'

const ICON_SIZE = 36

export default function ChatHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <View style={styles.headerRow}>
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onBack}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Text style={styles.iconButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
                <Text style={styles.title}>{title}</Text>
            </View>

            <View style={styles.iconSpacer} />
        </View>
    )
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        marginBottom: 12,
    },
    iconButton: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        backgroundColor: 'rgba(255, 62, 128, 0.15)',
        borderWidth: 1,
        borderColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    iconButtonText: { fontSize: 18, color: COLORS.accent },
    headerCenter: { flex: 1, alignItems: 'center' },
    iconSpacer: { width: ICON_SIZE, height: ICON_SIZE, opacity: 0 },
    title: {
        fontSize: 26,
        color: COLORS.accent,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(255, 62, 128, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
})
