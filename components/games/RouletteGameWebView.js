// components/games/RouletteGameWebView.js
import React, { useState, useCallback, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import { useRouter } from 'expo-router'
import { auth, db, recordGameResult } from '../../config/firebaseConfig'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import rouletteHtml from './roulette/phaser.html.js'

export default function RouletteGameWebView() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userBalance, setUserBalance] = useState(1000)

  // ✅ on se met à jour en live sur Users/{uid} (comme l’index)
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    const ref = doc(db, 'Users', user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      const bal = snap.exists() ? (snap.data().walletBalance ?? 0) : 0
      setUserBalance(Number(bal) || 0)
    })
    return () => unsub && unsub()
  }, [])

  const injectedBefore = `
    // Solde initial visible très tôt
    window.initialBalance = ${userBalance};
    (function ensureInitial() {
      const setIfReady = () => {
        if (typeof setSolde === 'function') {
          setSolde(window.initialBalance);
          if (typeof renderSoldeMise === 'function') renderSoldeMise();
        }
      };
      if (document.readyState === 'complete') setIfReady();
      else window.addEventListener('load', setIfReady);
    })();
    true; // <- requis par react-native-webview
  `

  const onMessage = useCallback(async ({ nativeEvent }) => {
    try {
      const data = JSON.parse(nativeEvent.data)

      if (data.action === 'goBack') {
        router.replace('/')
        return
      }

      // ✅ Réception d’un résultat de spin → écriture transactionnelle Firestore
      if (data.result) {
        const user = auth.currentUser
        if (!user) return
        const {
          game = 'roulette',
          wager = 0,
          payout = 0,
          winningNumber,
          bets
        } = data.result

        try {
          await recordGameResult(user.uid, {
            game,
            wager,
            payout,
            metadata: {
              winningNumber,
              bets: Array.isArray(bets) ? bets.slice(0, 100) : [] // petite limite
            }
          })
          // Pas de setState du solde ici: la souscription onSnapshot mettra l’UI à jour
        } catch (e) {
          console.error('recordGameResult error', e)
          Alert.alert('Erreur', 'Enregistrement du résultat impossible.')
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [router])

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      )}
      <WebView
        originWhitelist={['*']}
        source={{ html: rouletteHtml }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScriptBeforeContentLoaded={injectedBefore}
        onMessage={onMessage}
        onError={({ nativeEvent }) =>
          Alert.alert('WebView erreur', nativeEvent.description)
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', zIndex: 1
  },
  webview: { flex: 1 }
})
