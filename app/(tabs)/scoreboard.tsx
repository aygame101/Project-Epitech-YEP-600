// components/Scoreboard.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { listenScoreboardTop } from '../../config/firebaseConfig'

export default function Scoreboard({ topN = 10 }) {
    const [rows, setRows] = useState([])

    useEffect(() => {
        const unsub = listenScoreboardTop(topN, setRows)
        return () => unsub()
    }, [topN])

    return (
        <View style={{ width: '100%', padding: 12 }}>
            <Text style={{ color: '#e94560', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
                🏆 Meilleurs joueurs (net)
            </Text>
            <FlatList
                data={rows}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(255,255,255,0.1)'
                    }}>
                        <Text style={{ color: '#fff' }}>{index + 1}. {item.userName || item.userNameLower}</Text>
                        <Text style={{ color: '#fff' }}>{item.net}</Text>
                    </View>
                )}
            />
        </View>
    )
}
