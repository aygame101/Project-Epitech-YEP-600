import React, { useState, useEffect } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

export default function SlotGame() {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    (async () => {
      // 1) Chargez vos images Expo et récupérez leurs URIs
      const [
        bgAsset,
        frameAsset,
        spinAsset,
        barAsset, bellAsset, cherryAsset, diamondAsset,
        lemonAsset, orangeAsset, plumAsset, sevenAsset
      ] = await Promise.all([
        Asset.fromModule(require('../../assets/games/slot/background.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/slot-frame.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/spin-button.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/symbols/bar.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/symbols/bell.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/symbols/cherry.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/symbols/diamond.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/symbols/lemon.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/symbols/orange.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/symbols/plum.png')).downloadAsync(),
        Asset.fromModule(require('../../assets/games/slot/symbols/seven.png')).downloadAsync(),
      ]);

      // 2) Construisez le HTML en inline, en injectant les URI
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Slot Expo</title>
  <style> body,html{margin:0;padding:0;overflow:hidden;} </style>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
</head>
<body>
  <div id="game-container"></div>
  <script>
    // --- Config Phaser ---
    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: 'game-container',
      backgroundColor: '#000000',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: {
        preload: preload,
        create: create,
      }
    };
    new Phaser.Game(config);

    // --- Preload ---
    function preload() {
      this.load.image('bg', '${bgAsset.localUri}');
      this.load.image('frame', '${frameAsset.localUri}');
      this.load.image('spin', '${spinAsset.localUri}');
      // Symboles
      this.symbols = ['bar','bell','cherry','diamond','lemon','orange','plum','seven'];
      this.symbols.forEach(key => {
        this.load.image(key,
          '${barAsset.localUri}'.replace('bar.png', key + '.png')
        );
      });
    }

    // --- Create & Slot Logic ---
    function create() {
      const { width, height } = this.scale;
      // background et frame
      this.add.image(width/2, height/2, 'bg').setDisplaySize(width,height);
      this.add.image(width/2, height/2, 'frame').setDisplaySize(width,height);

      // préparation des reels
      this.reels = [];
      this.symbolSize = 128;
      this.visibleRows = 3;
      const spacingX = 150;
      const startX   = width/2 - 2 * spacingX;
      // Clé symbols depuis preload
      const keys = this.symbols;

      for (let i = 0; i < 5; i++) {
        const container = this.add.container(startX + i*spacingX, height/2);
        for (let row = 0; row < this.visibleRows; row++) {
          const key = Phaser.Utils.Array.GetRandom(keys);
          container.add(
            this.add.image(0, (row-1)*this.symbolSize, key)
              .setDisplaySize(this.symbolSize, this.symbolSize)
          );
        }
        this.reels.push(container);
      }

      // bouton spin
      this.spinBtn = this.add.image(width/2, height-100, 'spin')
        .setDisplaySize(200,200)
        .setInteractive()
        .on('pointerdown', () => spin.call(this));
    }

    // --- Spin function ---
    function spin() {
      this.spinBtn.disableInteractive();
      const delayStep = 200;
      this.reels.forEach((container, idx) => {
        const total = (3 * this.symbols.length + this.visibleRows + Phaser.Math.Between(0,this.symbols.length-1)) * this.symbolSize;
        this.tweens.add({
          targets: container,
          y: '+=' + total,
          duration: 1000 + idx*delayStep,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            container.y = this.scale.height/2;
            // réassignation aléatoire
            container.list.forEach(img => {
              img.setTexture(Phaser.Utils.Array.GetRandom(this.symbols));
            });
            if (idx === this.reels.length-1) {
              this.spinBtn.setInteractive();
              console.log('Résultat:', this.reels.map(c=>c.list.map(i=>i.texture.key)));
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

  // 3) Pendant le chargement…
  if (!html) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 4) Affichage de la WebView
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
    />
  );
}

const styles = StyleSheet.create({
  loader: { flex:1, alignItems:'center', justifyContent:'center' },
  webview: { flex:1 }
});
