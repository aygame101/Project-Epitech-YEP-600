import React from 'react';
import { WebView } from 'react-native-webview';

const PhaserGame = () => {
  // Chemin vers le fichier index.html pour iOS
  const gamePath = require('../../phaser_games/slotgame/index.html');

  return (
    <WebView
      source={gamePath}
      style={{ flex: 1 }}
      // Optimisations pour les performances
      cacheEnabled={true}
      // Désactiver le zoom
      scalesPageToFit={false}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      // Configuration audio/vidéo
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      // Permissions pour l'accès aux fichiers
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
    />
  );
};

export default PhaserGame;
