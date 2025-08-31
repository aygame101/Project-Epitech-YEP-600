// components/games/RouletteGameWebView.js
import React, { useState, useCallback } from 'react'
import { View, ActivityIndicator, StyleSheet, Alert, ImageBackground } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import { useRouter } from 'expo-router'
import { auth, db, recordGameResult } from '../../config/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import { useFocusEffect } from '@react-navigation/native'

import { buildRouletteHtml } from './roulette/htmlTemplate'

export default function RouletteGameWebView() {
    const router = useRouter()
    const [html, setHtml] = useState('')
    const [loading, setLoading] = useState(true)
    const insets = useSafeAreaInsets()

    const loadGame = useCallback(async () => {
        setLoading(true)
        try {
            const user = auth.currentUser
            if (!user) throw new Error('Utilisateur non connecté')
            const snap = await getDoc(doc(db, 'Users', user.uid))
            const walletBalance = snap.exists() ? Number(snap.data().walletBalance ?? 0) : 0

            const htmlContent = buildRouletteHtml({ walletBalance })
            setHtml(htmlContent)
        } catch (err) {
            console.error(err)
            Alert.alert('Erreur', err.message)
            setHtml('<html><body style="background:#000;color:#fff">Erreur de chargement</body></html>')
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(useCallback(() => { loadGame() }, [loadGame]))

    const onMessage = useCallback(async ({ nativeEvent }) => {
        try {
            const data = JSON.parse(nativeEvent.data)

            if (data.action === 'goBack') {
                router.replace('/')
                return
            }

            if (data.result) {
                const user = auth.currentUser
                if (!user) return
                const { game = 'roulette', wager = 0, payout = 0, winningNumber, bets = [] } = data.result
                try {
                    await recordGameResult(user.uid, {
                        game,
                        wager,
                        payout,
                        metadata: { winningNumber, bets: Array.isArray(bets) ? bets.slice(0, 100) : [] }
                    })
                    // Le solde est géré côté Firestore via recordGameResult (transaction).
                } catch (e) {
                    console.error('recordGameResult error', e)
                    Alert.alert('Erreur', "Enregistrement du résultat impossible.")
                }
            }
        } catch (e) {
            console.error(e)
        }
    }, [router])

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator testID="loader" size="large" color="#e94560" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* StatusBar transparente pour voir le fond en-dessous */}
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* FOND GLOBAL : on “déborde” volontairement dans les safe areas */}
            <ImageBackground
                source={require('../../assets/games/blackjack/table-background.png')}
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        top: -insets.top,
                        bottom: -insets.bottom,
                        left: -insets.left,
                        right: -insets.right,
                    },
                ]}
                imageStyle={{ resizeMode: 'cover' }}
            />

            <WebView
                testID="webview"
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                onMessage={onMessage}
                onError={({ nativeEvent }) => Alert.alert('WebView erreur', nativeEvent.description)}
                style={[styles.webview, { backgroundColor: 'transparent' }]}
                contentInsetAdjustmentBehavior="never"
                bounces={false}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    webview: { flex: 1 },
})
