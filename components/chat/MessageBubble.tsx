// components/chat/MessageBubble.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CHAT_ACCENT } from '../../constants/chatUi'

export default function MessageBubble({ text, mine }: { text: string; mine: boolean }) {
    return (
        <View style={[styles.bubble, mine ? styles.me : styles.other]}>
            <Text style={styles.msgText}>{text}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    bubble: { maxWidth: '80%', marginVertical: 6, padding: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.25)' },
    me: { alignSelf: 'flex-end', backgroundColor: 'rgba(233,69,96,0.75)' },
    other: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)' },
    msgText: { color: '#fff', fontSize: 15 },
})
