// components/chat/ChatBackground.tsx
import React, { useMemo } from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BG_PRESETS } from '../../constants/chatBg'
import { CHAT_BG_FALLBACK } from '../../constants/chatUi'

export default function ChatBackground({ code }: { code?: string | null }) {
    const preset = useMemo(() => BG_PRESETS.find(p => p.code === code) ?? BG_PRESETS[0], [code])
    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: CHAT_BG_FALLBACK }]}>
            {preset.type === 'color' && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: preset.value as string }]} />
            )}
            {preset.type === 'gradient' && (
                <LinearGradient
                    colors={preset.value as string[]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
            )}
            {preset.type === 'image' && (
                <Image source={preset.value as any} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
        </View>
    )
}
