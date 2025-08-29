// components/chat/ChatRoomHeader.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { CHAT_ICON_SIZE, CHAT_ACCENT } from '../../constants/chatUi'

export default function ChatRoomHeader({
    title,
    isFav,
    favBusy,
    onBack,
    onToggleFav,
    onOpenBgPicker,
}: {
    title: string
    isFav: 0 | 1
    favBusy: boolean
    onBack: () => void
    onToggleFav: () => void
    onOpenBgPicker: () => void
}) {
    return (
        <View style={[styles.headerRow, { paddingTop: 8, paddingHorizontal: 20 }]}>
            <TouchableOpacity style={styles.iconButton} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.iconButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
                    <TouchableOpacity
                        onPress={onToggleFav}
                        disabled={favBusy}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.headerIconBtn}
                        accessibilityRole="button"
                        accessibilityLabel={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                        <Text style={[styles.headerIconEmoji, favBusy && { opacity: 0.5 }]}>{isFav ? '⭐' : '☆'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                onPress={onOpenBgPicker}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerRightBtn}
                accessibilityRole="button"
                accessibilityLabel="Changer le fond"
            >
                <Text style={styles.headerIconEmoji}>🎨</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: 6 },
    iconButton: {
        width: CHAT_ICON_SIZE, height: CHAT_ICON_SIZE, borderRadius: CHAT_ICON_SIZE / 2,
        backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: CHAT_ACCENT,
        justifyContent: 'center', alignItems: 'center'
    },
    iconButtonText: { fontSize: 18, color: CHAT_ACCENT },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '80%', justifyContent: 'center' },
    title: { fontSize: 20, color: '#fff', fontWeight: '700', textAlign: 'center', flexShrink: 1 },
    headerIconBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.20)' },
    headerIconEmoji: { fontSize: 16, color: '#fff' },
    headerRightBtn: {
        width: CHAT_ICON_SIZE, height: CHAT_ICON_SIZE, borderRadius: CHAT_ICON_SIZE / 2,
        backgroundColor: 'rgba(0,0,0,0.20)', borderWidth: 1, borderColor: CHAT_ACCENT,
        justifyContent: 'center', alignItems: 'center'
    },
})
