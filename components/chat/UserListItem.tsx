// components/chat/UserListItem.tsx
import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { COLORS } from '../../constants/layout'
import type { UserRow } from '../../types/chat'

type Props = {
    item: UserRow
    isBusy: boolean
    onToggleFavoris: (u: UserRow) => void
    onPress: (u: UserRow) => void
}

export default function UserListItem({ item, isBusy, onToggleFavoris, onPress }: Props) {
    return (
        <TouchableOpacity style={styles.row} onPress={() => onPress(item)} activeOpacity={0.8}>
            {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={{ color: '#111', fontWeight: '800' }}>
                        {(item.displayName ?? item.usernameLower)?.[0]?.toUpperCase()}
                    </Text>
                </View>
            )}

            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.displayName ?? item.usernameLower}</Text>
                <Text style={styles.sub}>@{item.usernameLower}</Text>
            </View>

            <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); onToggleFavoris(item) }}
                disabled={isBusy}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.favBtn}
                accessibilityRole="button"
                accessibilityLabel={item.favoris ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
                <Text style={[styles.favEmoji, isBusy && { opacity: 0.5 }]}>
                    {item.favoris ? '⭐' : '+'}
                </Text>
            </TouchableOpacity>

            <Text style={styles.cta}>›</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.12)',
    },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222' },
    avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#8ef' },
    name: { color: '#fff', fontSize: 16, fontWeight: '700' },
    sub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
    favBtn: { paddingHorizontal: 8, paddingVertical: 4 },
    favEmoji: { fontSize: 22, color: '#fff' },
    cta: { color: COLORS.accent, fontSize: 28, fontWeight: '900', paddingHorizontal: 6 },
})
