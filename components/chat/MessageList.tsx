// components/chat/MessageList.tsx
import React, { useRef } from 'react'
import { FlatList, Keyboard, Platform } from 'react-native'
import MessageBubble from './MessageBubble'

export default function MessageList({
    meUid,
    msgs,
    bottomPadding,
}: {
    meUid: string
    msgs: any[]
    bottomPadding: number
}) {
    const listRef = useRef<FlatList>(null)

    return (
        <FlatList
            ref={listRef}
            data={msgs}
            renderItem={({ item }) => <MessageBubble text={item.text} mine={item.senderId === meUid} />}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding, flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onScrollBeginDrag={() => { if (Platform.OS === 'android') Keyboard.dismiss() }}
        />
    )
}
