// src/components/SlotMachineWebView.js
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SlotMachineWebView = ({ 
  balance, 
  onBalanceChange, 
  onWin, 
  onError 
}) => {
  const webViewRef = useRef(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(screenHeight * 0.8);

  // HTML du jeu (peut être un fichier local ou une URL)
  const gameHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Slot Machine</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                overflow: hidden;
            }
            #phaser-game {
                width: 100vw;
                height: 100vh;
            }
        </style>
    </head>
    <body>
        <div id="phaser-game"></div>
        <script src="./dist/bundle.js"></script>
    </body>
    </html>
  `;

  // Gérer les messages du WebView
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Message reçu du jeu:', message);

      switch (message.action) {
        case 'gameReady':
          setIsGameReady(true);
          // Envoyer le balance initial
          sendMessageToGame('updateBalance', { balance });
          break;

        case 'gameEvent':
          handleGameEvent(message.data);
          break;

        case 'playerStats':
          handlePlayerStats(message.data);
          break;

        case 'gameError':
          console.error('Erreur du jeu:', message.data);
          onError?.(message.data);
          break;

        default:
          console.log('Action non gérée:', message.action);
      }
    } catch (error) {
      console.error('Erreur parsing message:', error);
    }
  };

  const handleGameEvent = (eventData) => {
    switch (eventData.type) {
      case 'win':
        onWin?.(eventData);
        onBalanceChange?.(eventData.balance);
        break;

      case 'spin':
        console.log('Spin effectué:', eventData);
        break;

      case 'betChanged':
        console.log('Mise changée:', eventData);
        break;
    }
  };

  const handlePlayerStats = (stats) => {
    console.log('Statistiques joueur:', stats);
    // Sauvegarder les stats, les envoyer au backend, etc.
  };

  // Envoyer un message au jeu
  const sendMessageToGame = (action, data = {}) => {
    if (webViewRef.current && isGameReady) {
      const message = JSON.stringify({ action, data });
      webViewRef.current.postMessage(message);
    }
  };

  // Effets
  useEffect(() => {
    if (isGameReady && balance !== undefined) {
      sendMessageToGame('updateBalance', { balance });
    }
  }, [balance, isGameReady]);

  // Méthodes publiques
  const spin = () => {
    sendMessageToGame('forceSpin');
  };

  const setBet = (amount) => {
    sendMessageToGame('setBet', { amount });
  };

  // Gestion des erreurs WebView
  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('Erreur WebView:', nativeEvent);
    
    Alert.alert(
      'Erreur de chargement',
      'Le jeu n\'a pas pu se charger correctement.',
      [{ text: 'OK' }]
    );
  };

  const handleLoadEnd = () => {
    console.log('WebView chargé');
  };

  const handleLoadStart = () => {
    console.log('Début chargement WebView');
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <WebView
        ref={webViewRef}
        source={{ 
          // Option 1: HTML inline
          html: gameHTML,
          // Option 2: Fichier local
          // uri: Platform.OS === 'android' 
          //   ? 'file:///android_asset/slot-game/index.html'
          //   : 'slot-game/index.html'
          // Option 3: URL distante
          // uri: 'https://votre-domaine.com/slot-game/'
        }}
        style={[styles.webView, { height: webViewHeight }]}
        onMessage={handleMessage}
        onError={handleWebViewError}
        onLoadEnd={handleLoadEnd}
        onLoadStart={handleLoadStart}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={Platform.OS === 'android'}
        scrollEnabled={false}
        bounces={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        originWhitelist={['*']}
        // Props pour l'optimisation
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement du jeu...</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SlotMachineWebView;