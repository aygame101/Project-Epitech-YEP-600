// app/chat/[otherUid].tsx
import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Platform, StyleSheet, Keyboard,
  NativeSyntheticEvent, TextInputSubmitEditingEventData, Modal, Pressable, Image, Alert
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'
import {
  auth, getOrCreateConversation, listenMessages, sendMessage, markRead,
  updateFavoris, listenFavoritesMap,
  listenChatBgPreference, saveChatBgPreference
} from '../../config/firebaseConfig'
import { LinearGradient } from 'expo-linear-gradient'

const ICON_SIZE = 36
const ACCENT = '#e94560'
const BG_FALLBACK = '#0f1115'
const GAP = 8

// Presets de fond
const BG_PRESETS = [
  { code: 'solid-dark',    label: 'Sombre',    type: 'color'    as const, value: '#1a1a2e' },
  { code: 'solid-deepblue',label: 'Bleu nuit', type: 'color'    as const, value: '#0b132b' },
  { code: 'solid-graphite',label: 'Graphite',  type: 'color'    as const, value: '#111518' },

  { code: 'grad-midnight', label: 'Midnight',  type: 'gradient' as const, value: ['#0a0f1e', '#0f2027', '#203a43', '#2c5364'] },
  { code: 'grad-violet',   label: 'Violet',    type: 'gradient' as const, value: ['#23074d', '#5a189a', '#d63384', '#cc5333'] },
  { code: 'grad-sunset',   label: 'Sunset',    type: 'gradient' as const, value: ['#f4402cff','#f86a5c','#f9a14a','#ffd166'] },

  { code: 'grad-galaxy', label: 'Galaxy', type: 'gradient' as const, value: ['#0b0f21', '#2b1e66', '#ff3fb4', '#00d2ff'] },
  { code: 'grad-casino', label: 'Casino', type: 'gradient' as const, value: ['#0b2e1a', '#145c34', '#1fa34a', '#0c3b22'] },
  // { code: 'img-paper',  label: 'Papier',  type: 'image' as const, value: ['#23074d', '#5a189a', '#d63384', '#cc5333'] },
] as const

type BgCode = typeof BG_PRESETS[number]['code']

// Fond fixe plein écran (non interactif)
function ChatBackground({ code }: { code?: string | null }) {
  const preset = useMemo(() => BG_PRESETS.find(p => p.code === code) ?? BG_PRESETS[0], [code])
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: BG_FALLBACK }]}>
      {preset.type === 'color' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: preset.value as string }]} />
      )}
      {preset.type === 'gradient' && (
        <LinearGradient
          colors={preset.value as string[]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}
      {preset.type === 'image' && (
        <Image source={preset.value as any} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
    </View>
  )
}

// Timeout util
function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
}

export default function ChatRoom() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { otherUid, dn } = useLocalSearchParams<{ otherUid: string; dn?: string }>()
  const me = auth.currentUser!
  const [cid, setCid] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<any[]>([])
  const listRef = useRef<FlatList>(null)

  const [text, setText] = useState('')
  const [inputBarH, setInputBarH] = useState(56)

  // Hauteur clavier
  const [kbH, setKbH] = useState(0)

  // Favoris
  const [isFav, setIsFav] = useState<0 | 1>(0)
  const [favBusy, setFavBusy] = useState(false)

  // Fond
  const [bgCode, setBgCode] = useState<BgCode>('solid-dark')
  const [pickerVisible, setPickerVisible] = useState(false)

  // Sécurité unmount
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  // Listeners clavier -> hauteur
  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const s = Keyboard.addListener(show, (e) => setKbH(e.endCoordinates?.height ?? 0))
    const h = Keyboard.addListener(hide, () => setKbH(0))
    return () => { s.remove(); h.remove() }
  }, [])

  // Conversation
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { cid } = await getOrCreateConversation(me.uid, { uid: String(otherUid), displayName: String(dn ?? '') })
      if (alive) setCid(cid)
    })()
    return () => { alive = false }
  }, [otherUid])

  // Messages live
  useEffect(() => {
    if (!cid) return
    const unsub = listenMessages(cid, (rows) => {
      setMsgs(rows)
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
    })
    return () => unsub && unsub()
  }, [cid])

  // Mark read simple
  useEffect(() => { if (cid) markRead({ cid, uid: me.uid }) }, [cid, msgs.length])

  // Favoris live
  useEffect(() => {
    if (!me?.uid || !otherUid) return
    const unsub = listenFavoritesMap(me.uid, (map) => {
      const v = map[String(otherUid)] ?? 0
      if (mountedRef.current) setIsFav(v as 0 | 1)
    })
    return unsub
  }, [me?.uid, otherUid])

  // Fond live
  useEffect(() => {
    if (!me?.uid || !otherUid) return
    const unsub = listenChatBgPreference(me.uid, String(otherUid), (code) => {
      const found = BG_PRESETS.find(p => p.code === code)
      if (mountedRef.current) setBgCode((found?.code ?? 'solid-dark') as BgCode)
    })
    return unsub
  }, [me?.uid, otherUid])

  const goBack = () => { try { router.back() } catch { router.replace('/chat') } }

  const toggleFav = async () => {
    if (!me?.uid || !otherUid || favBusy) return
    const prev = isFav
    const next = (prev ? 0 : 1) as 0 | 1
    setFavBusy(true); setIsFav(next)
    try { await updateFavoris(String(otherUid), next) }
    catch (e) { if (mountedRef.current) setIsFav(prev); console.warn('updateFavoris:', (e as any)?.message || e) }
    finally { if (mountedRef.current) setFavBusy(false) }
  }

  const openBgPicker  = () => setPickerVisible(true)
  const closeBgPicker = () => setPickerVisible(false)
  const chooseBg = (code: BgCode) => {
    const prev = bgCode
    setBgCode(code); closeBgPicker()
    withTimeout(saveChatBgPreference(String(otherUid), code), 4000).catch((e) => {
      console.warn('saveChatBgPreference:', (e as any)?.message || e)
      if (mountedRef.current) { setBgCode(prev); Alert.alert('Fond non enregistré', 'Réessaie plus tard.') }
    })
  }

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

  // Positionnement avec le clavier
  const baseInset = Math.max(insets.bottom, GAP)
  const bottomForBar = kbH > 0 ? kbH + GAP : baseInset
  const listPadBottom = inputBarH + (kbH > 0 ? GAP : baseInset) + 12

  return (
    <View style={{ flex: 1 }}>
      {/* FOND FIXE */}
      <ChatBackground code={bgCode} />

      {/* CONTENU AU-DESSUS DU FOND */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
        <SafeAreaView edges={['top','left','right']} style={{ flex: 1 }}>
          {/* Header */}
<View style={[styles.headerRow, { paddingTop: 8, paddingHorizontal: 20 }]}>
  {/* Gauche : retour */}
  <TouchableOpacity style={styles.iconButton} onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
    <Text style={styles.iconButtonText}>←</Text>
  </TouchableOpacity>

  {/* Centre : nom + étoile (centrés) */}
  <View style={styles.headerCenter}>
    <View style={styles.headerTitleRow}>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {dn ? String(dn) : 'Conversation'}
      </Text>
      <TouchableOpacity
        onPress={toggleFav}
        disabled={favBusy}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.headerIconBtn}
        accessibilityRole="button"
        accessibilityLabel={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <Text style={[styles.headerIconEmoji, favBusy && { opacity: 0.5 }]}>{isFav ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
    </View>
  </View>

  {/* Droite : bouton background */}
  <TouchableOpacity
    onPress={openBgPicker}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    style={styles.headerRightBtn}
    accessibilityRole="button"
    accessibilityLabel="Changer le fond"
  >
    <Text style={styles.headerIconEmoji}>🎨</Text>
  </TouchableOpacity>
</View>


          {/* Messages */}
          <FlatList
            ref={listRef}
            data={msgs}
            renderItem={renderMsg}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: listPadBottom, flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onScrollBeginDrag={() => { if (Platform.OS === 'android') Keyboard.dismiss() }}
          />

          {/* Barre d'entrée */}
          <View
            style={[styles.inputBar, { bottom: bottomForBar }]}
            onLayout={(e) => setInputBarH(e.nativeEvent.layout.height)}
          >
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Écrire un message…"
              placeholderTextColor="rgba(255,255,255,0.7)"
              multiline
              blurOnSubmit={false}
              onSubmitEditing={onSubmitEditing}
            />
            <TouchableOpacity style={styles.send} onPress={onSend} disabled={!text.trim()}>
              <Text style={{ color: '#fff', fontWeight: '800', opacity: text.trim() ? 1 : 0.5 }}>Envoyer</Text>
            </TouchableOpacity>
          </View>

          {/* Modal choix du fond */}
          <Modal visible={pickerVisible} animationType="fade" transparent onRequestClose={closeBgPicker}>
            <Pressable style={styles.modalOverlay} onPress={closeBgPicker}>
              <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                <Text style={styles.modalTitle}>Choisir un fond</Text>
                <View style={styles.presetGrid}>
                  {BG_PRESETS.map(p => (
                    <TouchableOpacity key={p.code} style={styles.presetItem} onPress={() => chooseBg(p.code)}>
                      {p.type === 'color' && <View style={[styles.swatch, { backgroundColor: p.value as string }]} />}
                      {p.type === 'gradient' && <LinearGradient colors={p.value as string[]} style={styles.swatch} start={{x:0,y:0}} end={{x:1,y:1}} />}
                      {p.type === 'image' && <Image source={p.value as any} style={styles.swatch} resizeMode="cover" />}
                      <Text style={styles.presetLabel} numberOfLines={1}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={closeBgPicker} style={styles.closeBtn}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Fermer</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        </SafeAreaView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: 6 },
  iconButton: {
    width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: ACCENT,
    justifyContent: 'center', alignItems: 'center'
  },
  iconButtonText: { fontSize: 18, color: ACCENT },
  headerCenter: { flex: 1, alignItems: 'center' },
headerTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  maxWidth: '80%',
  justifyContent: 'center'
},

  title: { fontSize: 20, color: '#fff', fontWeight: '700', textAlign: 'center', flexShrink: 1 },

  headerIconBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.20)' },
  headerIconEmoji: { fontSize: 16, color: '#fff' },

  headerRightBtn: {
  width: ICON_SIZE,
  height: ICON_SIZE,
  borderRadius: ICON_SIZE / 2,
  backgroundColor: 'rgba(0,0,0,0.20)',
  borderWidth: 1,
  borderColor: ACCENT,
  justifyContent: 'center',
  alignItems: 'center'
},

  bubble: { maxWidth: '80%', marginVertical: 6, padding: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.25)' },
  me: { alignSelf: 'flex-end', backgroundColor: 'rgba(233,69,96,0.75)' },
  other: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)' },
  msgText: { color: '#fff', fontSize: 15 },

  inputBar: {
    position: 'absolute',
    left: 0, right: 0,
    paddingTop: GAP, paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'transparent',
    borderTopWidth: 0
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 120,
    backgroundColor: 'rgba(0,0,0,0.20)', // pas de contour gris
    color: '#fff',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, // IOS
    borderWidth: 0,
    textAlignVertical: 'center',  // Android
  includeFontPadding: false,    // Android
  },
  send: { paddingHorizontal: 16, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 520, borderRadius: 16, padding: 16, backgroundColor: '#111318', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 12 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  presetItem: { width: 100, alignItems: 'center' },
  swatch: { width: 100, height: 60, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  presetLabel: { color: 'rgba(255,255,255,0.9)', marginTop: 6, fontSize: 12 },
  closeBtn: { marginTop: 14, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: ACCENT, borderRadius: 10 }
})
