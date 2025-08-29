// components/home/BottomActionsBar.tsx
import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BAR_HEIGHT, ICON_SIZE, COLORS } from '../../constants/layout'

type Props = {
    onPressDashboard: () => void
    onPressScoreboard: () => void
    onPressChat: () => void
}

export default function BottomActionsBar({
    onPressDashboard,
    onPressScoreboard,
    onPressChat,
}: Props) {
    const insets = useSafeAreaInsets()

    return (
        <View
            style={[
                styles.actionsBottom,
                {
                    bottom: 0,
                    height: BAR_HEIGHT + insets.bottom,
                    paddingBottom: insets.bottom,
                },
            ]}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onPressDashboard}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
                <Text style={styles.iconButtonText}>📊</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.iconButton}
                onPress={onPressScoreboard}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
                <Text style={styles.iconButtonText}>🏆</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.iconButton}
                onPress={onPressChat}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
                <Text style={styles.iconButtonText}>💬</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    actionsBottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        borderTopWidth: 1,
        borderColor: 'rgba(255, 62, 128, 0.3)',
        paddingHorizontal: 20,
        elevation: 10, // Android
        shadowColor: '#000', // iOS
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
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
    },
    iconButtonText: {
        fontSize: 22,
        color: COLORS.accent,
    },
})
