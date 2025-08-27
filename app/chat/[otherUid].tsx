// app/chat/[otherUid].tsx
import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet, Keyboard, NativeSyntheticEvent, TextInputSubmitEditingEventData
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'
import { auth } from '../../config/firebaseConfig'
import { getOrCreateConversation, listenMessages, sendMessage, markRead } from '../../config/firebaseConfig'

const ICON_SIZE = 36
const ACCENT = '#e94560'
const BG = '#1a1a2e'
const GAP = 8 // espace voulu au-dessus/au-dessous de la barre

export default function ChatRoom() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { otherUid, dn } = useLocalSearchParams<{ otherUid: string; dn?: string }>()
  const me = auth.currentUser!
  const [cid, setCid] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<any[]>([])
  const [text, setText] = useState('')
  const listRef = useRef<FlatList>(null)

  const [inputBarH, setInputBarH] = useState(56)
  const [keyboardShown, setKeyboardShown] = useState(false)

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const s = Keyboard.addListener(show, () => setKeyboardShown(true))
    const h = Keyboard.addListener(hide, () => setKeyboardShown(false))
    return () => { s.remove(); h.remove() }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { cid } = await getOrCreateConversation(
        me.uid,
        { uid: String(otherUid), displayName: String(dn ?? '') }
      )
      if (alive) setCid(cid)
    })()
    return () => { alive = false }
  }, [otherUid])

  useEffect(() => {
    if (!cid) return
    const unsub = listenMessages(cid, (rows) => {
      setMsgs(rows)
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
    })
    return () => unsub && unsub()
  }, [cid])

  useEffect(() => { if (cid) markRead({ cid, uid: me.uid }) }, [cid, msgs.length])

  const goBack = () => { try { router.back() } catch { router.replace('/chat') } }

  const actuallySend = async (t: string) => {
    const trimmed = t.trim()
    if (!trimmed || !cid) return
    setText('')
    await sendMessage({ cid, senderId: me.uid, text: trimmed })
    await markRead({ cid, uid: me.uid })
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
  }

  const onSend = async () => { await actuallySend(text) }
  const onSubmitEditing = async (_e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => { await onSend() }

  const renderMsg = ({ item }: any) => {
    const mine = item.senderId === me.uid
    return (
      <View style={[styles.bubble, mine ? styles.me : styles.other]}>
        <Text style={styles.msgText}>{item.text}</Text>
      </View>
    )
  }

  // Espace sous la barre selon clavier :
  // - clavier ouvert  -> GAP
  // - clavier fermé   -> max(home-indicator, GAP)
  const bottomGap = keyboardShown ? GAP : Math.max(insets.bottom, GAP)

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Pas d'edge "bottom" : on gère l'espace bas nous-mêmes */}
      <SafeAreaView edges={['top','left','right']} style={{ flex: 1, backgroundColor: BG }}>
        {/* Header : retour | nom | spacer */}
        <View style={[styles.headerRow, { paddingTop: 8, paddingHorizontal: 20 }]}>
          <TouchableOpacity style={styles.iconButton} onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.iconButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {dn ? String(dn) : 'Conversation'}
            </Text>
          </View>
          <View style={styles.iconSpacer} />
        </View>

        <FlatList
          ref={listRef}
          data={msgs}
          renderItem={renderMsg}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: inputBarH + bottomGap + 12,
            // permet de tirer/drag même si peu de messages (close clavier à la iMessage)
            flexGrow: 1,
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          // 💡 iOS : fermeture progressive du clavier en scrollant (comme iMessage)
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          // 🔧 Android fallback : on ferme dès le début d’un drag
          onScrollBeginDrag={() => { if (Platform.OS === 'android') Keyboard.dismiss() }}
        />

        {/* Barre d'entrée contrôlée par bottomGap pour un gap symétrique */}
        <View
          style={[styles.inputBar, { bottom: bottomGap }]}
          onLayout={(e) => setInputBarH(e.nativeEvent.layout.height)}
        >
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Écrire un message…"
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline
            blurOnSubmit={false}
            onSubmitEditing={onSubmitEditing}
          />
          <TouchableOpacity style={styles.send} onPress={onSend}>
            <Text style={{ color: '#111', fontWeight: '800' }}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: 6 },
  iconButton: {
    width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2,
    backgroundColor: 'rgba(233,69,96,0.15)', borderWidth: 1, borderColor: ACCENT,
    justifyContent: 'center', alignItems: 'center'
  },
  iconButtonText: { fontSize: 18, color: ACCENT },
  headerCenter: { flex: 1, alignItems: 'center' },
  iconSpacer: { width: ICON_SIZE, height: ICON_SIZE, opacity: 0 },
  title: { fontSize: 20, color: '#fff', fontWeight: '700', textAlign: 'center' },

  bubble: { maxWidth: '80%', marginVertical: 6, padding: 10, borderRadius: 14 },
  me: { backgroundColor: ACCENT, alignSelf: 'flex-end' },
  other: { backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start' },
  msgText: { color: '#fff', fontSize: 15 },

  inputBar: {
    position: 'absolute',
    left: 0, right: 0,
    paddingTop: GAP, paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)',
    backgroundColor: BG
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)'
  },
  send: { paddingHorizontal: 14, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8ef' }
})
