import React, { useState, useCallback } from 'react'
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import { useRouter } from 'expo-router'
import { auth, db } from '../../config/firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useFocusEffect } from '@react-navigation/native'

import { loadBlackjackAssets } from './blackjack/assetsLoader'
import { buildBlackjackHtml } from './blackjack/htmlTemplate'

export default function BlackjackGameWebView() {
    const router = useRouter()
    const [html, setHtml] = useState('')
    const [loading, setLoading] = useState(true)

    const loadGame = useCallback(async () => {
        setLoading(true)
        try {
            // 1) Solde utilisateur
            const user = auth.currentUser
            if (!user) throw new Error('Utilisateur non connecté')
            const snap = await getDoc(doc(db, 'Users', user.uid))
            const walletBalance = snap.exists() ? (snap.data().walletBalance ?? 0) : 0

            // 2) Assets encodés
            const assets = await loadBlackjackAssets()

            // 3) HTML final
            const htmlContent = buildBlackjackHtml({ assets, walletBalance })
            setHtml(htmlContent)
        } catch (err) {
            console.error(err)
            Alert.alert('Erreur', err.message)
            setHtml('<html><body></body></html>')
        } finally {
            setLoading(false)
        }
    }, [])

    useFocusEffect(useCallback(() => { loadGame() }, [loadGame]))

    const handleMessage = async ({ nativeEvent }) => {
        try {
            const data = JSON.parse(nativeEvent.data)
            if (data.action === 'goBack') {
                router.replace('/')
            } else if (typeof data.newBalance === 'number') {
                const user = auth.currentUser
                if (user) {
                    await updateDoc(doc(db, 'Users', user.uid), { walletBalance: data.newBalance })
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#e94560" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <WebView
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                onMessage={handleMessage}
                onError={({ nativeEvent }) => Alert.alert('WebView erreur', nativeEvent.description)}
                style={styles.webview}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    webview: { flex: 1 },
})
