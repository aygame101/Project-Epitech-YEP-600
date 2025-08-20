// components/Scoreboard.tsx
import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { listenScoreboardTop } from '../../config/firebaseConfig'

type Row = {
    id: string
    userName?: string
    userNameLower?: string
    totalPayout: number
}

export default function Scoreboard({ topN = 10 }: { topN?: number }) {
    const navigation = useNavigation()
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const onRows = (data: Row[]) => {
            setRows(data ?? [])
            setLoading(false)
        }
        const unsub = listenScoreboardTop(topN, onRows)
        return () => { if (typeof unsub === 'function') unsub() }
    }, [topN])

    const renderItem = ({ item, index }: { item: Row; index: number }) => {
        const isTop3 = index < 3
        const medal = ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`

        return (
            <View style={[styles.row, isTop3 && styles.topRow]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.rank}>{medal}</Text>
                    <Text style={styles.name} numberOfLines={1}>
                        {item.userName || item.userNameLower || 'Joueur'}
                    </Text>
                </View>
                <Text style={styles.net}>{formatJets(item.totalPayout)}</Text>
            </View>
        )
    }

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#e94560" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                🏆 (Total Gagner)
            </Text>
            <Text style={styles.subtitle}>Actualisé en temps réel</Text>

            <FlatList
                style={{ alignSelf: 'stretch' }}
                data={rows}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <Text style={styles.empty}>Aucun joueur pour le moment.</Text>
                }
                contentContainerStyle={{ paddingBottom: 24 }}
            />

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
        </View>
    )
}

function formatJets(n: number) {
    try {
        return `${Intl.NumberFormat('fr-FR').format(n)} jets`
    } catch {
        return `${n} jets`
    }
}

const styles = StyleSheet.create({
    loader: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        marginBottom: 6,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        color: '#ccc',
        marginBottom: 20,
    },
    highlight: {
        color: '#e94560',
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    topRow: {
        backgroundColor: 'rgba(233, 69, 96, 0.12)',
    },
    rank: {
        width: 34,
        color: '#e94560',
        fontSize: 18,
        fontWeight: '700',
    },
    name: {
        color: '#fff',
        fontSize: 16,
        maxWidth: 220,
    },
    net: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    separator: {
        height: 10,
    },
    backButton: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#e94560',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    backText: {
        color: '#e94560',
        fontSize: 16,
        fontWeight: '600',
    },
    empty: {
        color: '#ccc',
        textAlign: 'center',
        marginTop: 40,
    },
})
