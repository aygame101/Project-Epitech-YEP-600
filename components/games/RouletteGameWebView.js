import React, { useState, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import { useRouter } from 'expo-router'
import { auth, db } from '../../config/firebaseConfig.js'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import rouletteHtml from './roulette/phaser.html.js'

export default function RouletteGameWebView() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userBalance, setUserBalance] = useState(1000)

  useEffect(() => {
    const fetchBalance = async () => {
      const user = auth.currentUser
      if (user) {
        const userDoc = await getDoc(doc(db, 'Users', user.uid))
        if (userDoc.exists()) {
          setUserBalance(userDoc.data().walletBalance ?? 1000)
        }
      }
    }
    fetchBalance()
  }, [])

  const handleMessage = async ({ nativeEvent }) => {
    try {
      const data = JSON.parse(nativeEvent.data)
      if (data.action === 'goBack') {
        router.replace('/')
      } else if (typeof data.newBalance === 'number') {
        const user = auth.currentUser
        if (user) {
          await updateDoc(doc(db, 'Users', user.uid), { walletBalance: data.newBalance })
          setUserBalance(data.newBalance)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const injectedJS = `
  // Définir le solde initial immédiatement après le chargement
  window.initialBalance = ${ userBalance };

  // Si solde est déjà défini, le mettre à jour
  if (typeof solde !== 'undefined') {
    solde = ${ userBalance };
  }

  // Mettre à jour l'affichage initial du solde avant que renderSoldeMise ne soit appelé
  document.addEventListener('DOMContentLoaded', function () {
    const soldeElement = document.getElementById('solde');
    if (soldeElement) {
      soldeElement.textContent = 'Solde : ' + ${ userBalance } + ' €';
    }
  });

  // S'assurer que renderSoldeMise est appelé après le chargement complet
  if (document.readyState === 'complete') {
    if (typeof renderSoldeMise === 'function') {
      renderSoldeMise();
    }
  } else {
    window.addEventListener('load', function () {
      if (typeof renderSoldeMise === 'function') {
        renderSoldeMise();
      }
    });
  }

  // Ajouter un observateur pour surveiller les changements de DOM
  // et s'assurer que le solde est toujours affiché correctement
  setTimeout(function () {
    if (typeof solde !== 'undefined') {
      solde = ${ userBalance };
      if (typeof renderSoldeMise === 'function') {
        renderSoldeMise();
      }
    }
  }, 1000);
  `

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
        injectedJavaScript={injectedJS}
        onMessage={handleMessage}
        onError={({ nativeEvent }) => Alert.alert('WebView erreur', nativeEvent.description)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', zIndex: 1 },
  webview: { flex: 1 }
})