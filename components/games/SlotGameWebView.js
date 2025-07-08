import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export default function SlotGame() {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    (async () => {
      // 1) Téléchargez d’abord tous vos assets
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

      // 3) Construction des data-URI
      const [ bg64, frame64, spin64, ...sym64 ] = b64s;
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
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
  <style>body,html{margin:0;padding:0;overflow:hidden;}</style>
</head>
<body>
  <div id="game-container"></div>
  <script>
    const symbolDataURIs = ${JSON.stringify(symbolDataURIs)};
    const symbols = Object.keys(symbolDataURIs);

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: 'game-container',
      backgroundColor: '#000000',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: { preload, create }
    };
    new Phaser.Game(config);

    function preload() {
      this.load.image('bg',    'data:image/png;base64,${bg64}');
      this.load.image('frame', 'data:image/png;base64,${frame64}');
      this.load.image('spin',  'data:image/png;base64,${spin64}');
      symbols.forEach(key => {
        this.load.image(key, symbolDataURIs[key]);
      });
    }

    function create() {
      const { width, height } = this.scale;
      this.add.image(width/2, height/2, 'bg').setDisplaySize(width, height);
      this.add.image(width/2, height/2, 'frame').setDisplaySize(width, height);

      this.symbolSize = 128;
      this.visibleRows = 3;
      this.reels = [];
      const spacingX = 150;
      const startX = width/2 - 2 * spacingX;

      for (let i = 0; i < 5; i++) {
        const container = this.add.container(startX + i * spacingX, height / 2);
        for (let r = 0; r < this.visibleRows; r++) {
          const key = Phaser.Utils.Array.GetRandom(symbols);
          container.add(
            this.add.image(0, (r - 1) * this.symbolSize, key)
              .setDisplaySize(this.symbolSize, this.symbolSize)
          );
        }
        this.reels.push(container);
      }

      this.spinBtn = this.add.image(width/2, height - 100, 'spin')
        .setDisplaySize(200, 200)
        .setInteractive()
        .on('pointerdown', () => spin.call(this));
    }

    function spin() {
      this.spinBtn.disableInteractive();
      this.reels.forEach((container, idx) => {
        const total = (3 * symbols.length + this.visibleRows + Phaser.Math.Between(0, symbols.length - 1)) * this.symbolSize;
        this.tweens.add({
          targets: container,
          y: '+=' + total,
          duration: 1000 + idx * 200,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            container.y = this.scale.height / 2;
            container.list.forEach(img => {
              img.setTexture(Phaser.Utils.Array.GetRandom(symbols));
            });
            if (idx === this.reels.length - 1) {
              this.spinBtn.setInteractive();
              console.log('Résultats :', this.reels.map(c => c.list.map(i => i.texture.key)));
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
        <ActivityIndicator size="large" />
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
});