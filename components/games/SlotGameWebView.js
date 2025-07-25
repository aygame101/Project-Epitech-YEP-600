// components/games/SlotGameWebView.js

import React, { useState, useEffect } from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native'
import { WebView } from 'react-native-webview'
import { Asset } from 'expo-asset'
import * as FileSystem from 'expo-file-system'
import { useRouter } from 'expo-router'
import { auth, db } from '../../config/firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

// Passez à true pour un HTML minimal de debug
const USE_MINIMAL_HTML = false

// Vos 50 lignes de gains
const PAYLINES = [
  [0,0,0,0,0], [1,1,1,1,1], [2,2,2,2,2], [2,1,2,1,2], [0,1,0,1,0],
  [0,1,2,1,0], [2,1,0,1,2], [0,0,1,1,0], [2,2,1,1,2], [0,1,1,1,0],
  [1,0,0,0,1], [1,2,2,2,1], [0,1,2,2,2], [2,1,0,0,0], [0,2,1,2,0],
  [2,0,1,0,2], [1,1,0,1,1], [1,1,2,1,1], [0,1,1,0,0], [2,1,1,2,2],
  [0,0,2,0,0], [2,2,0,2,2], [1,0,2,0,1], [1,2,0,2,1], [0,2,2,2,0],
  [2,0,0,0,2], [0,1,0,1,2], [2,1,2,1,0], [1,0,1,2,2], [1,2,1,0,0],
  [0,2,0,2,0], [2,0,2,0,2], [1,1,1,0,0], [1,1,1,2,2], [0,0,1,2,2],
  [2,2,1,0,0], [0,2,1,0,0], [2,0,1,2,2], [1,0,0,1,1], [1,2,2,1,1],
  [0,2,2,0,0], [2,0,0,2,2], [1,1,0,0,1], [1,1,2,2,1], [0,2,0,0,0],
  [2,0,2,2,2], [0,0,1,0,2], [2,2,1,2,0], [1,0,2,2,1], [1,2,1,1,1],
]

export default function SlotGameWebView() {
  const router = useRouter()
  const [html, setHtml]       = useState('')  // initialise à chaîne vide
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (USE_MINIMAL_HTML) {
        setHtml(`
          <!DOCTYPE html>
          <html><body style="margin:0;padding:0;background:#000">
            <h1 style="color:#0f0">WebView OK</h1>
          </body></html>
        `)
        setLoading(false)
        return
      }

      try {
        // 1) Récupère le solde depuis Firestore
        const user = auth.currentUser
        if (!user) throw new Error('Utilisateur non connecté')
        const snap = await getDoc(doc(db, 'Users', user.uid))
        const walletBalance = snap.exists() ? snap.data().walletBalance : 0

        // 2) Charge et convertit les assets en Base64 (y compris back-button)
        const modules = [
          require('../../assets/games/slot/background.png'),
          require('../../assets/games/slot/slot-frame.png'),
          require('../../assets/games/slot/spin-button.png'),
          require('../../assets/games/slot/back-button.png'),
          require('../../assets/games/slot/symbols/bar.png'),
          require('../../assets/games/slot/symbols/bell.png'),
          require('../../assets/games/slot/symbols/cherry.png'),
          require('../../assets/games/slot/symbols/diamond.png'),
          require('../../assets/games/slot/symbols/lemon.png'),
          require('../../assets/games/slot/symbols/orange.png'),
          require('../../assets/games/slot/symbols/plum.png'),
          require('../../assets/games/slot/symbols/seven.png'),
        ]
        const assets = await Promise.all(
          modules.map(m => Asset.fromModule(m).downloadAsync())
        )
        const b64s = await Promise.all(
          assets.map(a =>
            FileSystem.readAsStringAsync(a.localUri || a.uri, {
              encoding: FileSystem.EncodingType.Base64
            })
          )
        )
        const [bg64, frame64, spin64, back64, ...sym64] = b64s
        const symbols = ['bar','bell','cherry','diamond','lemon','orange','plum','seven']
        const symbolDataURIs = {}
        symbols.forEach((k,i) => {
          symbolDataURIs[k] = 'data:image/png;base64,' + sym64[i]
        })

        // 3) Génère le HTML complet avec Phaser + bouton image + position ajustée
        const htmlContent = `
<!DOCTYPE html>
<html lang="fr"><head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
  <style>
    body,html { margin:0;padding:0;overflow:hidden;background:#000 }
    #game-container { width:100%;height:100% }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script>
    const symbols = ${JSON.stringify(symbols)};
    const symbolDataURIs = ${JSON.stringify(symbolDataURIs)};
    let tokens = ${walletBalance};
    const BET_AMOUNT = 10;
    const PAYTABLE = {3:10,4:40,5:100};
    const PAYLINES = ${JSON.stringify(PAYLINES)};

    let spinBtn, reels, symbolSize, visibleRows, spacingX, winGraphics, winTexts;
    let tokenText, backBtn;

    new Phaser.Game({
      type: Phaser.AUTO,
      width: 720,
      height: 1280,
      parent: 'game-container',
      backgroundColor: '#000',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: { preload, create }
    });

    function preload() {
      this.load.image('bg', 'data:image/png;base64,${bg64}');
      this.load.image('frame', 'data:image/png;base64,${frame64}');
      this.load.image('spin', 'data:image/png;base64,${spin64}');
      this.load.image('back', 'data:image/png;base64,${back64}');
      symbols.forEach(k => this.load.image(k, symbolDataURIs[k]));
    }

    function create() {
      const { width, height } = this.scale;
      this.add.image(width/2, height/2, 'bg').setDisplaySize(width, height);

      // Affiche le solde en haut à droite
      tokenText = this.add.text(
        width - 20, 20,
        'Jetons: ' + tokens,
        { font: '32px Arial', fill: '#fff' }
      ).setOrigin(1, 0).setDepth(10);

      // Ajoute bouton “Retour” en haut à gauche
      backBtn = this.add.image(70, 70, 'back')
        .setDisplaySize(120, 120)
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(20);
      backBtn.on('pointerdown', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' }));
      });

      // Configuration des rouleaux
      symbolSize  = Math.round(128 * 0.85);
      visibleRows = 3;
      spacingX    = Math.round(120 * 1.15);
      reels       = [];
      winGraphics = [];
      winTexts    = [];

      const startX = width/2 - 2 * spacingX;
      for (let i = 0; i < 5; i++) {
        const c = this.add.container(startX + i * spacingX, height/2);
        for (let r = 0; r < visibleRows; r++) {
          const y = (r - 1) * symbolSize;
          const key = Phaser.Utils.Array.GetRandom(symbols);
          c.add(this.add.image(0, y, key).setDisplaySize(symbolSize, symbolSize));
        }
        c.initialYs = c.list.map(ch => ch.y);
        reels.push(c);
      }

      this.add.image(width/2, height/2, 'frame').setDisplaySize(width, height);

      spinBtn = this.add.image(width/2, height - 100, 'spin')
        .setDisplaySize(120, 120)
        .setDepth(10)
        .setInteractive()
        .on('pointerdown', () => spin.call(this));

      if (tokens < BET_AMOUNT) spinBtn.disableInteractive();
    }

    function spin() {
      if (tokens < BET_AMOUNT) return;
      winGraphics.forEach(g => g.destroy());
      winTexts.forEach(t => t.destroy());
      winGraphics = [];
      winTexts    = [];

      spinBtn.disableInteractive();
      tokens -= BET_AMOUNT;
      tokenText.setText('Jetons: ' + tokens);

      reels.forEach((c, idx) => {
        c.prev = 0;
        const spins = Phaser.Math.Between(20, 25) + idx * 6;
        const dist  = spins * symbolSize;
        this.tweens.addCounter({
          from: 0, to: dist, duration: spins * 80, ease: 'Linear',
          onUpdate: t => {
            const v = t.getValue(), d = v - c.prev;
            c.prev = v;
            c.list.forEach(ch => {
              ch.y += d;
              if (ch.y > symbolSize) {
                ch.y -= visibleRows * symbolSize;
                ch.setTexture(Phaser.Utils.Array.GetRandom(symbols));
              }
            });
          },
          onComplete: () => {
            c.list.forEach((ch, i) => ch.y = c.initialYs[i]);
            if (idx === reels.length - 1) evaluateResult.call(this);
          }
        });
      });
    }

    function evaluateResult() {
      const cx = this.scale.width/2 - 2 * spacingX;
      const cy = this.scale.height/2;
      let segs = [];

      PAYLINES.forEach((pattern, li) => {
        const coords = pattern.map((r, c) => [c, r]);
        const seq = coords.map(([c, r]) => {
          const reel = reels[c], y = reel.initialYs[r];
          return (reel.list.find(ch => Math.abs(ch.y - y) < 1) || reel.list[r]).texture.key;
        });
        let first = seq[0], count = 1;
        while (count < seq.length && seq[count] === first) count++;
        if (count >= 3) segs.push({ symbol: first, coords: coords.slice(0, count), count, lineIndex: li });
      });

      const map = {};
      segs.forEach(s => {
        const k = s.symbol + '|' + s.coords.map(c => c.join(',')).join(';');
        if (!map[k] || s.count > map[k].count) map[k] = s;
      });

      let toPay = Object.values(map).filter(s =>
        !Object.values(map).some(o =>
          o.symbol === s.symbol &&
          o.count > s.count &&
          s.coords.every((c, i) => o.coords[i][0] === c[0] && o.coords[i][1] === c[1])
        )
      );
      toPay.sort((a, b) => a.coords[0][0] - b.coords[0][0]);

      const totalWin = toPay.reduce((sum, s) => sum + (PAYTABLE[s.count] || 0), 0);
      toPay.forEach((s, i) => {
        this.time.delayedCall(i * 400, () => {
          const g = this.add.graphics();
          g.lineStyle(6, 0xffd700, 1).beginPath();
          s.coords.forEach(([c, r], j) => {
            const x = cx + c * spacingX, y = cy + (r - 1) * symbolSize;
            j === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
          });
          g.strokePath(); winGraphics.push(g);

          const w = PAYTABLE[s.count] || 0;
          const t = this.add.text(
            cx + 2 * spacingX,
            cy - 200 + s.lineIndex * 20,
            '+' + w + ' (L' + (s.lineIndex + 1) + ')',
            { font: '24px Arial', fill: '#ffff00' }
          ).setOrigin(0.5);
          winTexts.push(t);

          if (i === toPay.length - 1) {
            tokens += totalWin;
            tokenText.setText('Jetons: ' + tokens);
            if (tokens >= BET_AMOUNT) spinBtn.setInteractive();
            window.ReactNativeWebView.postMessage(JSON.stringify({ newBalance: tokens }));
          }
        });
      });

      if (totalWin === 0) {
        if (tokens >= BET_AMOUNT) spinBtn.setInteractive();
        window.ReactNativeWebView.postMessage(JSON.stringify({ newBalance: tokens }));
      }
    }
  </script>
</body>
</html>
        `.trim()

        setHtml(htmlContent)
      } catch (err) {
        console.error('SlotGameWebView useEffect error', err)
        Alert.alert('Erreur', err.message)
        setHtml(`<html><body><h1>Erreur de chargement</h1></body></html>`)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Gère navigation “goBack” et mise à jour du solde
  const handleMessage = async ({ nativeEvent }) => {
    try {
      const data = JSON.parse(nativeEvent.data)
      if (data.action === 'goBack') {
        router.replace('/')
        return
      }
      const { newBalance } = data
      const user = auth.currentUser
      if (user) {
        await updateDoc(doc(db, 'Users', user.uid), { walletBalance: newBalance })
      }
    } catch (e) {
      console.error('update balance error', e)
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
        onError={({ nativeEvent }) => {
          console.error('WebView error:', nativeEvent)
          Alert.alert('Erreur WebView', nativeEvent.description)
        }}
        style={styles.webview}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  webview: {
    flex: 1
  }
})
