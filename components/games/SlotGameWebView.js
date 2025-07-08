import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export default function SlotGameWebView() {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    (async () => {
      // 1) Téléchargement des assets via Expo
      const modules = [
        require('../../assets/games/slot/background.png'),
        require('../../assets/games/slot/slot-frame.png'),
        require('../../assets/games/slot/spin-button.png'),
        require('../../assets/games/slot/symbols/bar.png'),
        require('../../assets/games/slot/symbols/bell.png'),
        require('../../assets/games/slot/symbols/cherry.png'),
        require('../../assets/games/slot/symbols/diamond.png'),
        require('../../assets/games/slot/symbols/lemon.png'),
        require('../../assets/games/slot/symbols/orange.png'),
        require('../../assets/games/slot/symbols/plum.png'),
        require('../../assets/games/slot/symbols/seven.png'),
      ];
      const assets = await Promise.all(
        modules.map(m => Asset.fromModule(m).downloadAsync())
      );

      // 2) Conversion en base64
      const b64s = await Promise.all(
        assets.map(a => {
          const uri = a.localUri;
          if (!uri) throw new Error('Asset.localUri est null');
          return FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64
          });
        })
      );

      // 3) Préparation des data-URIs
      const [bg64, frame64, spin64, ...sym64] = b64s;
      const symbols = ['bar','bell','cherry','diamond','lemon','orange','plum','seven'];
      const symbolDataURIs = {};
      symbols.forEach((key, i) => {
        symbolDataURIs[key] = `data:image/png;base64,${sym64[i]}`;
      });

      // 4) Génération de l’HTML inline
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
  <style>
    body,html { margin:0; padding:0; overflow:hidden; }
    #game-container { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script>
    // Data URIs injectés
    const bgData      = 'data:image/png;base64,${bg64}';
    const frameData   = 'data:image/png;base64,${frame64}';
    const spinData    = 'data:image/png;base64,${spin64}';
    const symbolData  = ${JSON.stringify(symbolDataURIs)};
    const symbols     = Object.keys(symbolData);

    const config = {
      type: Phaser.AUTO,
      width: 1280, height: 720,
      parent: 'game-container',
      backgroundColor: '#000000',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: { preload, create }
    };
    new Phaser.Game(config);

    function preload() {
      this.load.image('bg',    bgData);
      this.load.image('frame', frameData);
      this.load.image('spin',  spinData);
      symbols.forEach(k => this.load.image(k, symbolData[k]));
    }

    function create() {
      const { width, height } = this.scale;
      // arrière-plan et cadre
      this.add.image(width/2, height/2, 'bg').setDisplaySize(width, height);
      this.add.image(width/2, height/2, 'frame').setDisplaySize(width, height);

      // config des rouleaux
      this.symbolSize  = 128;
      this.visibleRows = 3;
      const LOOP_COUNT = 4;    // nb de cycles complets
      this.reels       = [];
      const spacingX   = 150;
      const startX     = width/2 - 2*spacingX;

      // création des 5 rouleaux, chacun avec (LOOP_COUNT×len + visibleRows) symboles empilés
      for (let i = 0; i < 5; i++) {
        const container = this.add.container(startX + i*spacingX, height/2);
        const totalItems = LOOP_COUNT * symbols.length + this.visibleRows;
        for (let j = 0; j < totalItems; j++) {
          const key = symbols[j % symbols.length];
          container.add(
            this.add.image(
              0,
              (j - this.visibleRows) * this.symbolSize,
              key
            ).setDisplaySize(this.symbolSize, this.symbolSize)
          );
        }
        this.reels.push(container);
      }

      // bouton Spin
      this.spinBtn = this.add.image(width/2, height - 100, 'spin')
        .setDisplaySize(200, 200)
        .setInteractive()
        .on('pointerdown', () => startSpin.call(this));
    }

    function startSpin() {
      const baseTime  = 1500;
      const delayStep = 300;

      this.spinBtn.disableInteractive();

      this.reels.forEach((container, idx) => {
        // arrêt aléatoire sur un symbole différent
        const stopIndex  = Phaser.Math.Between(0, symbols.length - 1);
        const totalSteps = symbols.length * 4 + stopIndex;
        const distance   = totalSteps * this.symbolSize;

        this.tweens.add({
          targets: container,
          y: container.y + distance,      // sens vers le bas
          ease: 'Cubic.easeOut',
          duration: baseTime + idx * delayStep,
          delay: idx * delayStep,
          onComplete: () => {
            // remet le container au centre
            container.y = this.scale.height/2;
            // randomise TOUTES les textures pour préparer le tour suivant
            container.list.forEach(img => {
              img.setTexture(Phaser.Utils.Array.GetRandom(symbols));
            });
            // réactive le bouton une fois le dernier rouleau à l'arrêt
            if (idx === this.reels.length - 1) {
              this.spinBtn.setInteractive();
            }
          }
        });
      });
    }
  </script>
</body>
</html>
      `.trim();

      setHtml(htmlContent);
    })();
  }, []);

  if (!html) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large"/>
      </View>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      javaScriptEnabled
      domStorageEnabled
      style={styles.webview}
    />
  );
}

const styles = StyleSheet.create({
  loader:    { flex:1, justifyContent:'center', alignItems:'center' },
  webview:   { flex:1 }
});
