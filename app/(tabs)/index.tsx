// app/(tabs)/index.tsx
import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { useNavigation, CommonActions } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebaseConfig'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'

import { useUserProfile } from '../../hooks/home/useUserProfile'
import UserInfoHeader from '../../components/home/UserInfoHeader'
import GameGrid from '../../components/home/GameGrid'
import BottomActionsBar from '../../components/home/BottomActionsBar'
import { GAMES } from '../../constants/games'
import { BAR_HEIGHT, COLORS } from '../../constants/layout'

export default function GameSelection() {
  const navigation = useNavigation()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const goLogin = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'loginScreen' }],
      })
    )
  }, [navigation])

  const { loading, userName, walletBalance } = useUserProfile(goLogin)

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth)
      goLogin()
    } catch (e) {
      console.error('Erreur de déconnexion', e)
    }
  }, [goLogin])

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    )
  }

  const scrollExtraBottom = BAR_HEIGHT + insets.bottom + 20

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: scrollExtraBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <UserInfoHeader userName={userName} walletBalance={walletBalance} />

        <Text style={styles.title}>Choisis ton jeu</Text>

        <GameGrid games={GAMES} onSelect={(screen) => navigation.navigate(screen as never)} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomActionsBar
        onPressDashboard={() => navigation.navigate('dashboard' as never)}
        onPressScoreboard={() => navigation.navigate('scoreboard' as never)}
        onPressChat={() => router.push('/chat')}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 26,
    marginBottom: 25,
    color: COLORS.accent,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 62, 128, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  logoutButton: {
    marginTop: 30,
    borderWidth: 2,
    borderColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  logoutText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  },
})
