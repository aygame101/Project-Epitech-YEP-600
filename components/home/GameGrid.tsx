// components/home/GameGrid.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { GameItem } from '../../constants/games'
import { COLORS } from '../../constants/layout'

type Props = {
    games: GameItem[]
    onSelect: (screen: string) => void
}

export default function GameGrid({ games, onSelect }: Props) {
    return (
        <View style={styles.container}>
            {games.map((g) => (
                <TouchableOpacity key={g.screen} style={styles.gameButton} onPress={() => onSelect(g.screen)}>
                    <Text style={styles.gameButtonText}>{g.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        marginBottom: 30,
    },
    gameButton: {
        width: '100%',
        paddingVertical: 18,
        marginVertical: 10,
        borderRadius: 12,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
    },
    gameButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
})
