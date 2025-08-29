// components/chat/BgPickerModal.tsx
import React from 'react'
import { Modal, Pressable, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BG_PRESETS, BgCode } from '../../constants/chatBg'
import { CHAT_ACCENT } from '../../constants/chatUi'

export default function BgPickerModal({
    visible, onClose, onChoose,
}: {
    visible: boolean
    onClose: () => void
    onChoose: (code: BgCode) => void
}) {
    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.modalTitle}>Choisir un fond</Text>
                    <View style={styles.presetGrid}>
                        {BG_PRESETS.map(p => (
                            <TouchableOpacity key={p.code} style={styles.presetItem} onPress={() => onChoose(p.code)}>
                                {p.type === 'color' && <View style={[styles.swatch, { backgroundColor: p.value as string }]} />}
                                {p.type === 'gradient' && <LinearGradient colors={p.value as string[]} style={styles.swatch} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}
                                {p.type === 'image' && <Image source={p.value as any} style={styles.swatch} resizeMode="cover" />}
                                <Text style={styles.presetLabel} numberOfLines={1}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Fermer</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { width: '100%', maxWidth: 520, borderRadius: 16, padding: 16, backgroundColor: '#111318', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    modalTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 12 },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    presetItem: { width: 100, alignItems: 'center' },
    swatch: { width: 100, height: 60, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
    presetLabel: { color: 'rgba(255,255,255,0.9)', marginTop: 6, fontSize: 12 },
    closeBtn: { marginTop: 14, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: CHAT_ACCENT, borderRadius: 10 },
})
