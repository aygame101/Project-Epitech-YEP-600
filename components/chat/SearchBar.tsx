// components/chat/SearchBar.tsx
import React from 'react'
import { TextInput, StyleSheet } from 'react-native'

export default function SearchBar({
    value, onChangeText,
}: { value: string; onChangeText: (t: string) => void }) {
    return (
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Rechercher (ex: s, sc, sco...)"
            placeholderTextColor="rgba(255,255,255,0.7)"
            autoCapitalize="none"
            style={styles.search}
        />
    )
}

const styles = StyleSheet.create({
    search: {
        height: 46,
        borderRadius: 12,
        paddingHorizontal: 14,
        marginTop: 10,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.06)',
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255, 62, 128, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
})
