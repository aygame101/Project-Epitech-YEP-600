// components/games/SlotGameWebView.js

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export default function SlotGameWebView() {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    (async () => {
      // 1) Chargement des assets
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
      const assets = await Promise.all(modules.map(m => Asset.fromModule(m).downloadAsync()));

      // 2) Conversion en base64
      const b64s = await Promise.all(
        assets.map(a => {
          if (!a.localUri) throw new Error('Asset.localUri is null');
          return FileSystem.readAsStringAsync(a.localUri, { encoding: FileSystem.EncodingType.Base64 });
        })
      );

      const [bg64, frame64, spin64, ...sym64] = b64s;
      const symbols = ['bar','bell','cherry','diamond','lemon','orange','plum','seven'];
      const symbolDataURIs = {};
      symbols.forEach((key, i) => {
        symbolDataURIs[key] = 'data:image/png;base64,' + sym64[i];
      });

      // 3) Génération du HTML injecté dans la WebView
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
  <style>
    body, html { margin:0; padding:0; overflow:hidden; background:#000; }
    #game-container { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script>
    // Données et constantes
    const symbolDataURIs = ${JSON.stringify(symbolDataURIs)};
    const symbols = Object.keys(symbolDataURIs);
    const START_TOKENS = 1000;
    const BET_AMOUNT = 10;
    const PAYTABLE = { 3:10, 4:40, 5:100 };

    // Chaque ligne est un array de 5 entiers {0=haut,1=milieu,2=bas}
    const PAYLINES = [
      // 1–7 (déjà en place)
      [0,0,0,0,0], // 1: ligne haute
      [1,1,1,1,1], // 2: ligne milieu
      [2,2,2,2,2], // 3: ligne basse
      [2,1,2,1,2], // 4: zig-zag bas–milieu–bas–milieu–bas
      [0,1,0,1,0], // 5: zig-zag haut–milieu–haut–milieu–haut
      [0,1,2,1,0], // 6: V inversé haut–milieu–bas–milieu–haut
      [2,1,0,1,2], // 7: V bas–milieu–haut–milieu–bas

      // 8–10: lignes qui descendent puis remontent
      [0,0,1,1,0], // 8: 2×haut → 2×milieu → haut
      [2,2,1,1,2], // 9: 2×bas  → 2×milieu → bas
      [0,1,1,1,0], // 10: haut → 3×milieu → haut

      // 11–20: « escaliers » et « coins »
      [1,0,0,0,1],  // 11: milieu → 3×haut → milieu
      [1,2,2,2,1],  // 12: milieu → 3×bas  → milieu
      [0,1,2,2,2],  // 13: haut → milieu → 3×bas
      [2,1,0,0,0],  // 14: bas  → milieu → 3×haut
      [0,2,1,2,0],  // 15: haut → bas  → milieu → bas  → haut
      [2,0,1,0,2],  // 16: bas  → haut → milieu → haut → bas
      [1,1,0,1,1],  // 17: milieu → milieu → haut → milieu → milieu
      [1,1,2,1,1],  // 18: milieu → milieu → bas  → milieu → milieu
      [0,1,1,0,0],  // 19: haut → 2×milieu → 2×haut
      [2,1,1,2,2],  // 20: bas  → 2×milieu → 2×bas

      // 21–30: schémas en « coin » inversés et alternés
      [0,0,2,0,0],  // 21: 2×haut → bas → 2×haut
      [2,2,0,2,2],  // 22: 2×bas  → haut → 2×bas
      [1,0,2,0,1],  // 23: milieu→ haut → bas → haut → milieu
      [1,2,0,2,1],  // 24: milieu→ bas  → haut → bas  → milieu
      [0,2,2,2,0],  // 25: haut → 3×bas → haut
      [2,0,0,0,2],  // 26: bas  → 3×haut→ bas
      [0,1,0,1,2],  // 27: haut → milieu→ haut → milieu→ bas
      [2,1,2,1,0],  // 28: bas  → milieu→ bas  → milieu→ haut
      [1,0,1,2,2],  // 29: milieu→ haut → milieu→ 2×bas
      [1,2,1,0,0],  // 30: milieu→ bas  → milieu→ 2×haut

      // 31–40: doubles zig-zag et formes « Z »
      [0,2,0,2,0],  // 31: haut–bas–haut–bas–haut
      [2,0,2,0,2],  // 32: bas–haut–bas–haut–bas
      [1,1,1,0,0],  // 33: 3×milieu → 2×haut
      [1,1,1,2,2],  // 34: 3×milieu → 2×bas
      [0,0,1,2,2],  // 35: 2×haut → milieu → 2×bas
      [2,2,1,0,0],  // 36: 2×bas  → milieu → 2×haut
      [0,2,1,0,0],  // 37: haut → bas → milieu → 2×haut
      [2,0,1,2,2],  // 38: bas  → haut → milieu → 2×bas
      [1,0,0,1,1],  // 39: milieu→ 2×haut → 2×milieu
      [1,2,2,1,1],  // 40: milieu→ 2×bas  → 2×milieu

      // 41–50: schémas « lunettes », « pont » et décalages
      [0,2,2,0,0],  // 41: haut → 2×bas → 2×haut
      [2,0,0,2,2],  // 42: bas  → 2×haut → 2×bas
      [1,1,0,0,1],  // 43: 2×milieu → 2×haut → milieu
      [1,1,2,2,1],  // 44: 2×milieu → 2×bas  → milieu
      [0,2,0,0,0],  // 45: haut → bas → 3×haut
      [2,0,2,2,2],  // 46: bas  → haut → 3×bas
      [0,0,1,0,2],  // 47: 2×haut → milieu → haut → bas
      [2,2,1,2,0],  // 48: 2×bas  → milieu → bas  → haut
      [1,0,2,2,1],  // 49: milieu→ haut → 2×bas → milieu
      [1,2,1,1,1],  // 50: milieu→ bas  → 3×milieu
    ];

    // Configuration Phaser
    const config = {
      type: Phaser.AUTO,
      width: 720,
      height: 1280,
      parent: 'game-container',
      backgroundColor: '#000000',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: { preload, create }
    };
    new Phaser.Game(config);

    // Chargement des images
    function preload() {
      this.load.image('bg',    'data:image/png;base64,${bg64}');
      this.load.image('frame', 'data:image/png;base64,${frame64}');
      this.load.image('spin',  'data:image/png;base64,${spin64}');
      symbols.forEach(key => this.load.image(key, symbolDataURIs[key]));
    }

    // Création de la scène
    function create() {
      const { width, height } = this.scale;
      // Fond et cadre
      this.add.image(width/2, height/2, 'bg').setDisplaySize(width, height);
      this.add.image(width/2, height/2, 'frame').setDisplaySize(width, height);

      // Affichage des jetons
      this.tokens = START_TOKENS;
      this.tokenText = this.add.text(20, 20, 'Jetons: ' + this.tokens, {
        font: '32px Arial', fill: '#ffffff'
      }).setDepth(1);

      // Initialisation des rouleaux
      this.symbolSize = Math.round(128 * 0.85);
      this.visibleRows = 3;
      this.spacingX = Math.round(120 * 1.15);
      const startX = width/2 - 2 * this.spacingX;
      this.reels = [];
      for (let i = 0; i < 5; i++) {
        const container = this.add.container(startX + i * this.spacingX, height / 2);
        for (let r = 0; r < this.visibleRows; r++) {
          const key = Phaser.Utils.Array.GetRandom(symbols);
          container.add(
            this.add.image(0, (r - 1) * this.symbolSize, key)
              .setDisplaySize(this.symbolSize, this.symbolSize)
          );
        }
        this.reels.push(container);
      }

      // Pour stocker les graphiques/textes de gains
      this.winGraphics = [];
      this.winTexts = [];

      // Bouton SPIN
      this.spinBtn = this.add.image(width/2, height - 100, 'spin')
        .setDisplaySize(120, 120)
        .setInteractive()
        .on('pointerdown', () => spin.call(this));
    }

    // Fonction de spin
    function spin() {
      // Effacer les anciennes lignes et messages
      this.winGraphics.forEach(g => g.destroy());
      this.winTexts.forEach(t => t.destroy());
      this.winGraphics = [];
      this.winTexts = [];

      // Retirer la mise et désactiver le bouton
      this.tokens -= BET_AMOUNT;
      this.tokenText.setText('Jetons: ' + this.tokens);
      this.spinBtn.disableInteractive();

      // Animation des rouleaux
      this.reels.forEach((container, idx) => {
        const total = (this.visibleRows + symbols.length * 3 + Phaser.Math.Between(0, symbols.length - 1)) * this.symbolSize;
        this.tweens.add({
          targets: container,
          y: '+=' + total,
          duration: 1000 + idx * 150,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            container.y = this.scale.height / 2;
            container.list.forEach(img => img.setTexture(
              Phaser.Utils.Array.GetRandom(symbols)
            ));
            if (idx === this.reels.length - 1) {
              evaluateResult.call(this);
              this.spinBtn.setInteractive();
            }
          }
        });
      });
    }

    // Évaluation des résultats
    function evaluateResult() {
      const centerX = this.scale.width/2 - 2 * this.spacingX;
      const centerY = this.scale.height/2;
      let totalWin = 0;

      // 1) Collecte brute de tous les segments >=3
      const raw = [];
      PAYLINES.forEach((pattern, lineIndex) => {
        const coords = pattern.map((row, col) => [col, row]);
        const seq = coords.map(([c, r]) =>
          this.reels[c].list[r].texture.key
        );
        const first = seq[0];
        let count = 1;
        for (let i = 1; i < seq.length; i++) {
          if (seq[i] === first) count++;
          else break;
        }
        if (count >= 3) {
          raw.push({ symbol: first, coords: coords.slice(0, count), count, lineIndex });
        }
      });

      // 2) Dédoublonnage exact
      const uniqMap = {};
      raw.forEach(seg => {
        const keyExact = seg.symbol + '|' + seg.coords.map(c => c[0]+','+c[1]).join(';');
        if (!uniqMap[keyExact] || seg.count > uniqMap[keyExact].count) {
          uniqMap[keyExact] = seg;
        }
      });
      const uniq = Object.values(uniqMap);

      // 3) Filtrer les segments qui sont préfixe d'un autre plus long
      const toPay = uniq.filter(seg =>
        !uniq.some(other =>
          other.symbol === seg.symbol &&
          other.count > seg.count &&
          other.coords.slice(0, seg.count)
               .every((c,i) => c[0] === seg.coords[i][0] && c[1] === seg.coords[i][1])
        )
      );

      // 4) Tracer & payer
      toPay.forEach(seg => {
        const win = PAYTABLE[seg.count] || 0;
        totalWin += win;
        // tracer la ligne
        const g = this.add.graphics();
        g.lineStyle(6, 0xffd700, 1);
        g.beginPath();
        seg.coords.forEach(([col, row], idx) => {
          const x = centerX + col * this.spacingX;
          const y = centerY + (row - 1) * this.symbolSize;
          if (idx === 0) g.moveTo(x, y);
          else          g.lineTo(x, y);
        });
        g.strokePath();
        this.winGraphics.push(g);

        // afficher le texte de gain
        const msg = this.add.text(
          centerX + 2*this.spacingX,
          centerY - 200 + seg.lineIndex * 20,
          '+' + win + ' (L' + (seg.lineIndex+1) + ')',
          { font: '24px Arial', fill: '#ffff00' }
        ).setOrigin(0.5);
        this.winTexts.push(msg);
      });

      // 5) Mise à jour des jetons
      if (totalWin > 0) {
        this.tokens += totalWin;
        this.tokenText.setText('Jetons: ' + this.tokens);
      }
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
  loader: { flex:1, justifyContent:'center', alignItems:'center' },
  webview: { flex:1 }
});
