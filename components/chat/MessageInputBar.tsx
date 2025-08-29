// components/chat/MessageInputBar.tsx
import React from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { CHAT_GAP, CHAT_ACCENT } from '../../constants/chatUi'

export default function MessageInputBar({
    value,
    onChangeText,
    onSend,
    bottom,
    onHeight,
}: {
    value: string
    onChangeText: (t: string) => void
    onSend: () => void
    bottom: number
    onHeight?: (h: number) => void
}) {
    return (
        <View
            style={[styles.inputBar, { bottom }]}
            onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}
        >
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder="Écrire un message…"
                placeholderTextColor="rgba(255,255,255,0.7)"
                multiline
                blurOnSubmit={false}
                onSubmitEditing={onSend}
            />
            <TouchableOpacity style={styles.send} onPress={onSend} disabled={!value.trim()}>
                <Text style={{ color: '#fff', fontWeight: '800'}}>Envoyer</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    inputBar: {
        position: 'absolute',
        left: 0, right: 0,
        paddingTop: CHAT_GAP, paddingHorizontal: 10,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'transparent',
        borderTopWidth: 0
    },
    input: {
        flex: 1, minHeight: 40, maxHeight: 120,
        backgroundColor: 'rgba(0,0,0,0.20)',
        color: '#fff',
        borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 0,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    send: { paddingHorizontal: 16, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: CHAT_ACCENT },
})
