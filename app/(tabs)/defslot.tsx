// app/(tabs)/defslot.tsx
import React from 'react'
import { StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import SlotGameWebView from '../../components/games/SlotGameWebView'

export default function DefSlot() {
  return (
    <>
      {/* 2) SafeAreaView sans inset = pas de marge en haut/bas */}
      <SafeAreaView style={styles.container} edges={[]}>
        <SlotGameWebView />
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
})
