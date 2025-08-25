// app/chat/index.tsx
import React, { useEffect, useState } from 'react'
import {
    View, Text, TextInput, FlatList, TouchableOpacity,
    Image, StyleSheet, ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { auth } from '../../config/firebaseConfig'
import { searchUsersByPrefix } from '../../config/firebaseConfig'

const ICON_SIZE = 36
const ACCENT = '#e94560'
const BG = '#1a1a2e'

export default function ChatDirectory() {
    const router = useRouter()
    const me = auth.currentUser
    const [q, setQ] = useState('')
    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState<any[]>([])
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        let alive = true
        const run = async () => {
            setLoading(true)
            setErr(null)
            try {
                const res = await searchUsersByPrefix(q, 50)
                const filtered = res.filter(u => u.uid !== me?.uid)
                if (alive) setRows(filtered)
            } catch (e: any) {
                console.warn('[chat/index] search error:', e?.message || e)
                if (alive) {
                    setRows([])
                    setErr(e?.message || 'Erreur inconnue (vérifie les règles Firestore).')
                }
            } finally {
                if (alive) setLoading(false)
            }
        }
        const t = setTimeout(run, 200)
        return () => { alive = false; clearTimeout(t) }
    }, [q])

    const openUser = (u: any) => {
        router.push({ pathname: '/chat/[otherUid]', params: { otherUid: u.uid, dn: u.displayName ?? u.usernameLower } })
    }

    const renderItem = ({ item }: any) => (
        <TouchableOpacity style={styles.row} onPress={() => openUser(item)}>
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
            <Text style={styles.cta}>›</Text>
        </TouchableOpacity>
    )

    const goBack = () => {
        try { router.back() } catch { router.replace('/') }
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header 3 colonnes : retour | titre centré | spacer */}
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.iconButton} onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.iconButtonText}>←</Text>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Choisir un joueur</Text>
                </View>

                <View style={styles.iconSpacer} />
            </View>

            <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Rechercher (ex: s, sc, sco...)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoCapitalize="none"
                style={styles.search}
            />

            {loading && <ActivityIndicator color={ACCENT} style={{ marginTop: 12 }} />}

            {!loading && err && (
                <Text style={styles.error}>
                    {err.includes('permission-denied')
                        ? 'Accès refusé: vérifie les règles Firestore pour /Usernames (allow list).'
                        : err}
                </Text>
            )}

            {!loading && !err && rows.length === 0 && (
                <Text style={styles.empty}>Aucun utilisateur</Text>
            )}

            {!loading && !err && rows.length > 0 && (
                <FlatList
                    data={rows}
                    keyExtractor={(it) => it.uid}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG, padding: 20, paddingTop: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: 10 },
    iconButton: {
        width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2,
        backgroundColor: 'rgba(233,69,96,0.15)', borderWidth: 1, borderColor: ACCENT,
        justifyContent: 'center', alignItems: 'center'
    },
    iconButtonText: { fontSize: 18, color: ACCENT },
    headerCenter: { flex: 1, alignItems: 'center' },
    iconSpacer: { width: ICON_SIZE, height: ICON_SIZE, opacity: 0 },
    title: { fontSize: 22, color: '#fff', fontWeight: '700', textAlign: 'center' },

    search: {
        height: 46, borderRadius: 23, paddingHorizontal: 16, marginTop: 8, marginBottom: 6,
        backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)'
    },

    error: { color: '#ffb3be', marginTop: 12, textAlign: 'center' },
    empty: { color: 'rgba(255,255,255,0.7)', marginTop: 12, textAlign: 'center' },

    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.12)'
    },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222' },
    avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#8ef' },
    name: { color: '#fff', fontSize: 16, fontWeight: '700' },
    sub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    cta: { color: ACCENT, fontSize: 28, fontWeight: '900', paddingHorizontal: 6 }
})
