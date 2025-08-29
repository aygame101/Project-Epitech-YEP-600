// app/(tabs)/Scoreboard.tsx
import React, { useState } from 'react'
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

import SegmentToggle from '../../components/scoreboard/SegmentToggle'
import ScoreRow from '../../components/scoreboard/ScoreRow'
import { useScoreboardTop, type Mode } from '../../hooks/home/useScoreboard'
import { COLORS } from '../../constants/layout'

export default function Scoreboard({ topN = 10 }: { topN?: number }) {
    const navigation = useNavigation()
    const [mode, setMode] = useState<Mode>('weekly')

    const { rows, loading } = useScoreboardTop(topN, mode)

    if (loading) {
        return (
            <SafeAreaView style={styles.loader} edges={['top', 'bottom']}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={[styles.container, { paddingTop: 15, paddingBottom: 0 }]}>
                <Text style={styles.title}>
                    🏆 {mode === 'weekly' ? 'Gains (Cette semaine)' : 'Gains (Global)'}
                </Text>

                <SegmentToggle mode={mode} onChange={setMode} />

                <Text style={styles.legendText}>(Total Gagné)</Text>

                <FlatList
                    style={{ alignSelf: 'stretch' }}
                    data={rows}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => <ScoreRow item={item} index={index} />}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={<Text style={styles.empty}>Aucun joueur pour le moment.</Text>}
                    contentContainerStyle={{ paddingBottom: 24 }}
                />

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Retour</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    loader: {
        flex: 1,
        backgroundColor: COLORS.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 26,
        marginBottom: 12,
        color: COLORS.accent,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(255, 62, 128, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    legendText: {
        color: '#ccc',
        marginBottom: 8,
    },
    separator: {
        height: 10,
    },
    backButton: {
        marginTop: 20,
        borderWidth: 2,
        borderColor: COLORS.accent,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    backText: {
        color: COLORS.accent,
        fontSize: 16,
        fontWeight: '600',
    },
    empty: {
        color: '#ccc',
        textAlign: 'center',
        marginTop: 40,
    },
})
