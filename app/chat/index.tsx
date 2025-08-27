// app/chat/index.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
    View, Text, TextInput, FlatList, TouchableOpacity,
    Image, StyleSheet, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { auth } from '../../config/firebaseConfig'
import { searchUsersByPrefix, updateFavoris } from '../../config/firebaseConfig' // <-- NEW

const ICON_SIZE = 36
const ACCENT = '#e94560'
const BG = '#1a1a2e'

type UserRow = {
    uid: string
    displayName?: string
    usernameLower: string
    avatarUrl?: string
    favoris?: 0 | 1 // <-- NEW: attendu par l’UI (0 = pas favori, 1 = favori)
}

export default function ChatDirectory() {
    const router = useRouter()
    const me = auth.currentUser
    const [q, setQ] = useState('')
    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState<UserRow[]>([])
    const [err, setErr] = useState<string | null>(null)
    const [busy, setBusy] = useState<Record<string, boolean>>({}) // <-- NEW: pour éviter les double-clics

    // Tri: favoris en haut, puis tri alpha sur displayName/username
    const sortedRows = useMemo(() => {
        const clone = [...rows]
        clone.sort((a, b) => {
            const fa = a.favoris ? 1 : 0
            const fb = b.favoris ? 1 : 0
            if (fa !== fb) return fb - fa // favoris=1 d'abord
            const nameA = (a.displayName ?? a.usernameLower ?? '').toLocaleLowerCase()
            const nameB = (b.displayName ?? b.usernameLower ?? '').toLocaleLowerCase()
            return nameA.localeCompare(nameB)
        })
        return clone
    }, [rows])

    useEffect(() => {
        let alive = true
        const run = async () => {
            setLoading(true)
            setErr(null)
            try {
                const res = await searchUsersByPrefix(q, 50)
                // On filtre moi-même
                const filtered: UserRow[] = res.filter((u: any) => u.uid !== me?.uid)
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
    }, [q, me?.uid])

    const openUser = (u: UserRow) => {
        router.push({ pathname: '/chat/[otherUid]', params: { otherUid: u.uid, dn: u.displayName ?? u.usernameLower } })
    }

    const toggleFavoris = async (u: UserRow) => {
        if (!me?.uid) return
        if (busy[u.uid]) return
        const next = (u.favoris ? 0 : 1) as 0 | 1

        // UI optimiste
        setBusy(prev => ({ ...prev, [u.uid]: true }))
        setRows(prev =>
            prev.map(r => (r.uid === u.uid ? { ...r, favoris: next } : r))
        )

        try {
            // Appel backend pour persister
            await updateFavoris(u.uid, next)
        } catch (e) {
            console.warn('[chat/index] updateFavoris error:', (e as any)?.message || e)
            // rollback en cas d’échec
            setRows(prev =>
                prev.map(r => (r.uid === u.uid ? { ...r, favoris: u.favoris ?? 0 } : r))
            )
            setErr('Impossible de mettre à jour les favoris. Réessaie.')
        } finally {
            setBusy(prev => {
                const copy = { ...prev }
                delete copy[u.uid]
                return copy
            })
        }
    }

    const renderItem = ({ item }: { item: UserRow }) => (
        <TouchableOpacity style={styles.row} onPress={() => openUser(item)} activeOpacity={0.8}>
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

            {/* --- NEW: bouton favoris (+ / 🌟) --- */}
            <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); toggleFavoris(item) }}
                disabled={!!busy[item.uid]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.favBtn}
                accessibilityRole="button"
                accessibilityLabel={item.favoris ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
                <Text style={[styles.favEmoji, busy[item.uid] && { opacity: 0.5 }]}>
                    {item.favoris ? '🌟' : '+'}
                </Text>
            </TouchableOpacity>

            {/* Chevron d’accès à la conversation */}
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

            {!loading && !err && sortedRows.length === 0 && (
                <Text style={styles.empty}>Aucun utilisateur</Text>
            )}

            {!loading && !err && sortedRows.length > 0 && (
                <FlatList
                    data={sortedRows}
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

    // --- NEW styles ---
    favBtn: { paddingHorizontal: 8, paddingVertical: 4 },
    favEmoji: { fontSize: 22, color: '#fff' },

    cta: { color: ACCENT, fontSize: 28, fontWeight: '900', paddingHorizontal: 6 }
})
