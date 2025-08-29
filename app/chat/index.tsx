// app/chat/index.tsx
import React, { useMemo, useState } from 'react'
import { View, Text, ActivityIndicator, SectionList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { useAuthUser } from '../../hooks/chat/useAuthUser'
import { useFavoritesMap } from '../../hooks/chat/useFavoritesMap'
import { useUserSearch } from '../../hooks/chat/useUserSearch'
import { updateFavoris } from '../../config/firebaseConfig'

import ChatHeader from '../../components/chat/ChatHeader'
import SearchBar from '../../components/chat/SearchBar'
import SectionHeader from '../../components/chat/SectionHeader'
import UserListItem from '../../components/chat/UserListItem'

import { enrichWithFavorites, sortUsers, makeSections } from '../../utils/chatList'
import type { UserRow } from '../../types/chat'
import { COLORS } from '../../constants/layout'

export default function ChatDirectory() {
  const router = useRouter()
  const me = useAuthUser()

  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  // Search
  const { loading, rows, err, setErr } = useUserSearch(q, me?.uid, 50)

  // Favoris
  const { favMap, setFavMap } = useFavoritesMap(me?.uid)

  // Enrichir + trier + sections
  const enrichedRows = useMemo<UserRow[]>(
    () => enrichWithFavorites(rows, favMap),
    [rows, favMap]
  )
  const sortedRows = useMemo<UserRow[]>(() => sortUsers(enrichedRows), [enrichedRows])
  const sections = useMemo(() => makeSections(sortedRows), [sortedRows])

  const openUser = (u: UserRow) => {
    router.push({ pathname: '/chat/[otherUid]', params: { otherUid: u.uid, dn: u.displayName ?? u.usernameLower } })
  }

  const toggleFavoris = async (u: UserRow) => {
    if (!me?.uid) return
    if (busy[u.uid]) return
    const current = favMap[u.uid] ?? 0
    const next = (current ? 0 : 1) as 0 | 1

    // UI optimiste
    setBusy((prev) => ({ ...prev, [u.uid]: true }))
    setFavMap((prev) => ({ ...prev, [u.uid]: next }))

    try {
      await updateFavoris(u.uid, next)
    } catch (e) {
      console.warn('[chat/index] updateFavoris error:', (e as any)?.message || e)
      // rollback
      setFavMap((prev) => ({ ...prev, [u.uid]: current }))
      setErr('Impossible de mettre à jour les favoris. Réessaie.')
    } finally {
      setBusy((prev) => {
        const copy = { ...prev }
        delete copy[u.uid]
        return copy
      })
    }
  }

  const goBack = () => {
    try { router.back() } catch { router.replace('/') }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ChatHeader title="Choisir un joueur" onBack={goBack} />
      <SearchBar value={q} onChangeText={setQ} />

      {loading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 12 }} />}

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
        <SectionList
          sections={sections as any}
          keyExtractor={(it) => it.uid}
          renderItem={({ item }: { item: UserRow }) => (
            <UserListItem
              item={item}
              isBusy={!!busy[item.uid]}
              onToggleFavoris={toggleFavoris}
              onPress={openUser}
            />
          )}
          renderSectionHeader={({ section }: { section: { title: string } }) => (
            <SectionHeader title={section.title} />
          )}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  error: { color: '#ffb3c8', marginTop: 12, textAlign: 'center' },
  empty: { color: 'rgba(255,255,255,0.8)', marginTop: 12, textAlign: 'center' },
})
