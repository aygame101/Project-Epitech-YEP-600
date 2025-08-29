// app/chat/[otherUid].tsx
import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'
import { auth, sendMessage, markRead } from '../../config/firebaseConfig'

import ChatBackground from '../../components/chat/ChatBackground'
import ChatRoomHeader from '../../components/chat/ChatRoomHeader'
import MessageList from '../../components/chat/MessageList'
import MessageInputBar from '../../components/chat/MessageInputBar'
import BgPickerModal from '../../components/chat/BgPickerModal'

import { useKeyboardHeight } from '../../hooks/chat/useKeyboardHeight'
import { useConversation } from '../../hooks/chat/useConversation'
import { useFavoriteForUser } from '../../hooks/chat/useFavoriteForUser'
import { useChatBgPreference } from '../../hooks/chat/useChatBgPreference'

import { CHAT_GAP } from '../../constants/chatUi'

export default function ChatRoom() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { otherUid, dn } = useLocalSearchParams<{ otherUid: string; dn?: string }>()
  const me = auth.currentUser!
  const kbH = useKeyboardHeight()

  const { cid, msgs } = useConversation(me.uid, String(otherUid), dn)
  const { isFav, favBusy, toggleFav } = useFavoriteForUser(me?.uid, String(otherUid))
  const { bgCode, chooseBg } = useChatBgPreference(me?.uid, String(otherUid))

  const [pickerVisible, setPickerVisible] = useState(false)
  const [text, setText] = useState('')
  const [inputBarH, setInputBarH] = useState(56)

  const goBack = () => { try { router.back() } catch { router.replace('/chat') } }

  const actuallySend = async (t: string) => {
    const trimmed = t.trim()
    if (!trimmed || !cid) return
    setText('')
    await sendMessage({ cid, senderId: me.uid, text: trimmed })
    await markRead({ cid, uid: me.uid })
  }
  const onSend = async () => { await actuallySend(text) }

  // Positionnement avec le clavier
  const baseInset = Math.max(insets.bottom, CHAT_GAP)
  const bottomForBar = kbH > 0 ? kbH + CHAT_GAP : baseInset
  const listPadBottom = inputBarH + (kbH > 0 ? CHAT_GAP : baseInset) + 12

  return (
    <View style={{ flex: 1 }}>
      {/* Fond */}
      <ChatBackground code={bgCode} />

      {/* Contenu */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
          <ChatRoomHeader
            title={dn ? String(dn) : 'Conversation'}
            isFav={isFav}
            favBusy={favBusy}
            onBack={goBack}
            onToggleFav={toggleFav}
            onOpenBgPicker={() => setPickerVisible(true)}
          />

          <MessageList meUid={me.uid} msgs={msgs} bottomPadding={listPadBottom} />

          <MessageInputBar
            value={text}
            onChangeText={setText}
            onSend={onSend}
            bottom={bottomForBar}
            onHeight={setInputBarH}
          />

          <BgPickerModal
            visible={pickerVisible}
            onClose={() => setPickerVisible(false)}
            onChoose={(code) => { chooseBg(code); setPickerVisible(false) }}
          />
        </SafeAreaView>
      </View>
    </View>
  )
}
