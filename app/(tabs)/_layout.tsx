// app/(tabs)/_layout.tsx
import React from 'react'
import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,                 // pas de header natif non plus
        tabBarStyle: { display: 'none' },   // cache la barre de tabs sur tous les écrans
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Accueil',
        }}
      />
      <Tabs.Screen
        name="defslot"
        options={{
          title: 'Slot',
          tabBarLabel: 'Slot',
        }}
      />
    </Tabs>
  )
}
