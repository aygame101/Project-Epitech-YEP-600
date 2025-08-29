// components/games/SlotGameWebView.js

import React, { useState, useCallback } from 'react'
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import { Asset } from 'expo-asset'
import * as FileSystem from 'expo-file-system'
import { useRouter } from 'expo-router'
import { auth, db, recordGameResult } from '../../config/firebaseConfig'
import { doc, getDoc, } from 'firebase/firestore'
import { useFocusEffect } from '@react-navigation/native'

const USE_MINIMAL_HTML = false

// Tes 50 lignes de gains
const PAYLINES = [
  //bet 10
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  //bet 20
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 2, 2, 2],
  [2, 1, 0, 0, 0],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  //bet 50
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 2, 1, 2, 0],
  [2, 0, 1, 0, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [0, 0, 2, 0, 0],
  [2, 2, 0, 2, 2],
  [1, 0, 2, 0, 1],
  //bet 100
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 2],
  [0, 0, 0, 1, 0],
  [0, 0, 0, 1, 1],
  [0, 0, 0, 1, 2],
  [0, 0, 0, 2, 0],
  [0, 0, 0, 2, 1],
  [0, 0, 0, 2, 2],
  [0, 0, 1, 0, 1],
  [0, 0, 1, 0, 2],
  [0, 0, 1, 1, 0],
  [0, 0, 1, 1, 1],
  [0, 0, 1, 1, 2],
  [0, 0, 1, 2, 0],
  [0, 0, 1, 2, 1],
  [0, 0, 2, 0, 1],
  [0, 0, 2, 0, 2],
  [0, 0, 2, 1, 0],
  [0, 0, 2, 1, 1],
  [0, 0, 2, 1, 2],
  [0, 0, 2, 2, 0],
  [0, 0, 2, 2, 1],
  [0, 0, 2, 2, 2],
  [0, 1, 0, 0, 0],
  [0, 1, 0, 0, 1],
  [0, 1, 0, 0, 2],
  [0, 1, 0, 1, 1],
  [0, 1, 0, 1, 2],
  [0, 1, 0, 2, 0],
  [0, 1, 0, 2, 1],
  [0, 1, 0, 2, 2],
  [0, 1, 1, 0, 0],
  [0, 1, 1, 0, 1],
  [0, 1, 1, 0, 2],
  [0, 1, 1, 1, 1],
  [0, 1, 1, 1, 2],
  [0, 1, 1, 2, 0],
  [0, 1, 1, 2, 1],
  [0, 1, 1, 2, 2],
  [0, 1, 2, 0, 0],
  [0, 1, 2, 0, 1],
  [0, 1, 2, 0, 2],
  [0, 1, 2, 1, 1],
  [0, 1, 2, 1, 2],
  [0, 1, 2, 2, 0],
  [0, 1, 2, 2, 1],
  [0, 2, 0, 0, 0],
  [0, 2, 0, 0, 1],
  [0, 2, 0, 0, 2],
  [0, 2, 0, 1, 0],
  [0, 2, 0, 1, 1],
  [0, 2, 0, 1, 2],
  [0, 2, 0, 2, 1],
  [0, 2, 0, 2, 2],
  [0, 2, 1, 0, 0],
  [0, 2, 1, 0, 1],
  [0, 2, 1, 0, 2],
  [0, 2, 1, 1, 0],
  [0, 2, 1, 1, 1],
  [0, 2, 1, 1, 2],
  [0, 2, 1, 2, 1],
  [0, 2, 1, 2, 2],
  [0, 2, 2, 0, 0],
  [0, 2, 2, 0, 1],
  [0, 2, 2, 0, 2],
  [0, 2, 2, 1, 0],
  [0, 2, 2, 1, 1],
  [0, 2, 2, 1, 2],
  [0, 2, 2, 2, 0],
  [0, 2, 2, 2, 1],
  [0, 2, 2, 2, 2],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 2],
  [1, 0, 0, 1, 0],
  [1, 0, 0, 1, 1],
  [1, 0, 0, 1, 2],
  [1, 0, 0, 2, 0],
  [1, 0, 0, 2, 1],
  [1, 0, 0, 2, 2],
  [1, 0, 1, 0, 0],
  [1, 0, 1, 0, 1],
  [1, 0, 1, 0, 2],
  [1, 0, 1, 1, 0],
  [1, 0, 1, 1, 1],
  [1, 0, 1, 1, 2],
  [1, 0, 1, 2, 0],
  [1, 0, 1, 2, 2],
  [1, 0, 2, 0, 0],
  [1, 0, 2, 0, 2],
  [1, 0, 2, 1, 0],
  [1, 0, 2, 1, 1],
  [1, 0, 2, 1, 2],
  [1, 0, 2, 2, 0],
  [1, 0, 2, 2, 1],
  [1, 0, 2, 2, 2],
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 1],
  [1, 1, 0, 0, 2],
  [1, 1, 0, 1, 0],
  [1, 1, 0, 1, 2],
  [1, 1, 0, 2, 0],
  [1, 1, 0, 2, 1],
  [1, 1, 0, 2, 2],
  [1, 1, 1, 0, 0],
  [1, 1, 1, 0, 1],
  [1, 1, 1, 0, 2],
  [1, 1, 1, 1, 0],
  [1, 1, 1, 1, 2],
  [1, 1, 1, 2, 0],
  [1, 1, 1, 2, 1],
  [1, 1, 1, 2, 2],
  [1, 1, 2, 0, 0],
  [1, 1, 2, 0, 1],
  [1, 1, 2, 0, 2],
  [1, 1, 2, 1, 0],
  [1, 1, 2, 1, 2],
  [1, 1, 2, 2, 0],
  [1, 1, 2, 2, 1],
  [1, 1, 2, 2, 2],
  [1, 2, 0, 0, 0],
  [1, 2, 0, 0, 1],
  [1, 2, 0, 0, 2],
  [1, 2, 0, 1, 0],
  [1, 2, 0, 1, 1],
  [1, 2, 0, 1, 2],
  [1, 2, 0, 2, 0],
  [1, 2, 0, 2, 1],
  [1, 2, 0, 2, 2],
  [1, 2, 1, 0, 0],
  [1, 2, 1, 0, 2],
  [1, 2, 1, 1, 0],
  [1, 2, 1, 1, 1],
  [1, 2, 1, 1, 2],
  [1, 2, 1, 2, 0],
  [1, 2, 1, 2, 1],
  [1, 2, 1, 2, 2],
  [1, 2, 2, 0, 0],
  [1, 2, 2, 0, 1],
  [1, 2, 2, 0, 2],
  [1, 2, 2, 1, 0],
  [1, 2, 2, 1, 1],
  [1, 2, 2, 1, 2],
  [1, 2, 2, 2, 0],
  [1, 2, 2, 2, 2],
  [2, 0, 0, 0, 0],
  [2, 0, 0, 0, 1],
  [2, 0, 0, 0, 2],
  [2, 0, 0, 1, 0],
  [2, 0, 0, 1, 1],
  [2, 0, 0, 1, 2],
  [2, 0, 0, 2, 0],
  [2, 0, 0, 2, 1],
  [2, 0, 0, 2, 2],
  [2, 0, 1, 0, 0],
  [2, 0, 1, 0, 1],
  [2, 0, 1, 1, 0],
  [2, 0, 1, 1, 1],
  [2, 0, 1, 1, 2],
  [2, 0, 1, 2, 0],
  [2, 0, 1, 2, 1],
  [2, 0, 1, 2, 2],
  [2, 0, 2, 0, 0],
  [2, 0, 2, 0, 1],
  [2, 0, 2, 1, 0],
  [2, 0, 2, 1, 1],
  [2, 0, 2, 1, 2],
  [2, 0, 2, 2, 0],
  [2, 0, 2, 2, 1],
  [2, 0, 2, 2, 2],
  [2, 1, 0, 0, 1],
  [2, 1, 0, 0, 2],
  [2, 1, 0, 1, 0],
  [2, 1, 0, 1, 1],
  [2, 1, 0, 2, 0],
  [2, 1, 0, 2, 1],
  [2, 1, 0, 2, 2],
  [2, 1, 1, 0, 0],
  [2, 1, 1, 0, 1],
  [2, 1, 1, 0, 2],
  [2, 1, 1, 1, 0],
  [2, 1, 1, 1, 1],
  [2, 1, 1, 2, 0],
  [2, 1, 1, 2, 1],
  [2, 1, 1, 2, 2],
  [2, 1, 2, 0, 0],
  [2, 1, 2, 0, 1],
  [2, 1, 2, 0, 2],
  [2, 1, 2, 1, 0],
  [2, 1, 2, 1, 1],
  [2, 1, 2, 2, 0],
  [2, 1, 2, 2, 1],
  [2, 1, 2, 2, 2],
  [2, 2, 0, 0, 0],
  [2, 2, 0, 0, 1],
  [2, 2, 0, 0, 2],
  [2, 2, 0, 1, 0],
  [2, 2, 0, 1, 1],
  [2, 2, 0, 1, 2],
  [2, 2, 0, 2, 0],
  [2, 2, 0, 2, 1],
  [2, 2, 1, 0, 1],
  [2, 2, 1, 0, 2],
  [2, 2, 1, 1, 0],
  [2, 2, 1, 1, 1],
  [2, 2, 1, 1, 2],
  [2, 2, 1, 2, 0],
  [2, 2, 1, 2, 1],
  [2, 2, 2, 0, 0],
  [2, 2, 2, 0, 1],
  [2, 2, 2, 0, 2],
  [2, 2, 2, 1, 0],
  [2, 2, 2, 1, 1],
  [2, 2, 2, 1, 2],
  [2, 2, 2, 2, 0],
  [2, 2, 2, 2, 1]
];

export default function SlotGameWebView() {
  const router = useRouter()
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)

  const loadGame = useCallback(async () => {
    setLoading(true)
    try {
      // 1) fetch up-to-date balance
      const user = auth.currentUser
      if (!user) throw new Error('Utilisateur non connecté')
      const snap = await getDoc(doc(db, 'Users', user.uid))
      const walletBalance = snap.exists() ? snap.data().walletBalance : 0

      // 2) load and base64-encode assets (including bet-button)
      const modules = [
        require('../../assets/games/slot/background.png'),
        require('../../assets/games/slot/slot-frame.png'),
        require('../../assets/games/slot/spin-button.png'),
        require('../../assets/games/slot/back-button.png'),
        require('../../assets/games/slot/bet-button.png'),
        require('../../assets/games/slot/symbols/bar1.png'),
        require('../../assets/games/slot/symbols/bell.png'),
        require('../../assets/games/slot/symbols/cherry.png'),
        require('../../assets/games/slot/symbols/diamond.png'),
        require('../../assets/games/slot/symbols/lemon.png'),
        require('../../assets/games/slot/symbols/orange.png'),
        require('../../assets/games/slot/symbols/plum.png'),
        require('../../assets/games/slot/symbols/seven.png'),
      ]
      const assets = await Promise.all(modules.map(m => Asset.fromModule(m).downloadAsync()))
      const b64s = await Promise.all(
        assets.map(a =>
          FileSystem.readAsStringAsync(a.localUri || a.uri, {
            encoding: FileSystem.EncodingType.Base64
          })
        )
      )
      const [bg64, frame64, spin64, back64, bet64, ...sym64] = b64s
      const symbols = ['bar', 'bell', 'cherry', 'diamond', 'lemon', 'orange', 'plum', 'seven']
      const symbolDataURIs = {}
      symbols.forEach((k, i) => {
        symbolDataURIs[k] = 'data:image/png;base64,' + sym64[i]
      })

      // 3) build full HTML with Phaser and bet-button placement
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
    <style>
        body,
        html,
        #game-container {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            background: url(data:image/png;base64,${bg64}) center/cover no-repeat;
        }

        canvas {
            display: block;
            margin: auto;
        }
    </style>
</head>

<body>
    <div id="game-container"></div>
    <script>
        // bet options and lines mapping
        const BET_OPTIONS = [10, 20, 50, 100];
        const PAYLINE_COUNTS = { 10: 5, 20: 13, 50: 28, 100: 243 };
        let currentBet = BET_OPTIONS[0];
        let activeLineCount = PAYLINE_COUNTS[currentBet];

        const symbols = ${ JSON.stringify(symbols)};
        const symbolDataURIs = ${ JSON.stringify(symbolDataURIs)};
        let tokens = ${ walletBalance };
        const PAYTABLE = {
            cherry: { 3: 10, 4: 40, 5: 80 },
            lemon: { 3: 10, 4: 40, 5: 80 },
            orange: { 3: 10, 4: 40, 5: 80 },
            plum: { 3: 10, 4: 40, 5: 80 },
            bell: { 3: 20, 4: 100, 5: 200 },
            diamond: { 3: 20, 4: 100, 5: 200 },
            seven: { 3: 50, 4: 250, 5: 500 },
            // bar est wild et ne paie pas seul
        };
        const PAYLINES = ${ JSON.stringify(PAYLINES)};
        const WEIGHTS = { bar: 2, diamond: 3, seven: 1, bell: 3, cherry: 5, lemon: 5, orange: 5, plum: 5 };
        const weighted = [];
        Object.entries(WEIGHTS).forEach(([s, w]) => {
            for (let i = 0; i < w; i++) weighted.push(s);
        });
        function getRandomSymbol() { return Phaser.Utils.Array.GetRandom(weighted); }

        let reels, symbolSize, visibleRows, spacingX, spinBtn, winGraphics, winTotalText;
        let tokenText, backBtn, betText, betBtn;
        let isSpinning = false;

        new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'game-container',
            backgroundColor: 'transparent',
            transparent: true,
            scale: { mode: Phaser.Scale.FIT, width: 720, height: 1280, autoCenter: Phaser.Scale.CENTER_BOTH },
            scene: { preload, create }
        });

        function preload() {
            this.load.image('frame', 'data:image/png;base64,${frame64}');
            this.load.image('spin', 'data:image/png;base64,${spin64}');
            this.load.image('back', 'data:image/png;base64,${back64}');
            this.load.image('betBtn', 'data:image/png;base64,${bet64}');
            symbols.forEach(k => this.load.image(k, symbolDataURIs[k]));
        }

        function create() {
            const { width, height } = this.scale;

            // display balance
            tokenText = this.add.text(width - 60, 20, 'Jetons: ' + tokens, { font: '40px Arial', fill: '#f70000' })
                .setOrigin(1, 0).setDepth(10);

            // display current bet
            betText = this.add.text(width - 60, 60, 'Bet: ' + currentBet, { font: '32px Arial', fill: '#f70000' })
                .setOrigin(1, 0).setDepth(10);

            // Bouton retour (bloqué si spinning)
            backBtn = this.add.image(70, 55, 'back')
                .setDisplaySize(120, 120)
                .setInteractive()
                .setScrollFactor(0)
                .setDepth(20);
            backBtn.on('pointerdown', () => {
                if (isSpinning) return; // lock pendant spin
                window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' }));
            });

            // reel setup
            symbolSize = Math.round(128 * 0.85);
            visibleRows = 3;
            spacingX = Math.round(120 * 1.15);
            reels = []; winGraphics = []; winTotalText = null;

            const startX = width / 2 - 2 * spacingX;
            for (let i = 0; i < 5; i++) {
                const c = this.add.container(startX + i * spacingX, height / 2);
                for (let r = 0; r < visibleRows; r++) {
                    const y = (r - 1) * symbolSize;
                    c.add(
                        this.add
                            .image(0, y, 'seven')
                            .setDisplaySize(symbolSize, symbolSize)
                    );
                }
                c.initialYs = c.list.map(ch => ch.y);
                reels.push(c);
            }
            this.add.image(width / 2, height / 2, 'frame').setDisplaySize(width, height);

            // spin button (ne se réactive pas si isSpinning=true)
            spinBtn = this.add.image(width / 2 + 150, height - 100, 'spin')
                .setDisplaySize(120, 120).setDepth(10)
                .setInteractive()
                .on('pointerdown', () => {
                    if (isSpinning) return;
                    spin.call(this);
                });
            if (tokens < currentBet) spinBtn.disableInteractive();

            // bet button (bloqué si spinning, et ne réactive pas spin en cours de spin)
            let betIndex = 0;
            betBtn = this.add.image(width / 2 - 150, height - 100, 'betBtn')
                .setDisplaySize(120, 120).setDepth(10).setInteractive()
                .on('pointerdown', () => {
                    if (isSpinning) return; // lock pendant spin
                    betIndex = (betIndex + 1) % BET_OPTIONS.length;
                    currentBet = BET_OPTIONS[betIndex];
                    activeLineCount = PAYLINE_COUNTS[currentBet];
                    betText.setText('Bet: ' + currentBet);

                    // Ne réactive le spin que si on n'est pas en train de spinner
                    if (!isSpinning && tokens >= currentBet) {
                        spinBtn.setInteractive();
                    } else {
                        spinBtn.disableInteractive();
                    }
                });
        }


        function spin() {
            if (isSpinning) return;
            if (tokens < currentBet) return;

            isSpinning = true;

            // Nettoyage visuel d'un éventuel tour précédent
            if (winTotalText) { winTotalText.destroy(); winTotalText = null; }
            winGraphics.forEach(g => g.destroy()); winGraphics = [];

            // Verrouiller tous les boutons
            spinBtn.disableInteractive();
            if (betBtn) betBtn.disableInteractive();
            if (backBtn) backBtn.disableInteractive();

            // Débiter la mise
            tokens -= currentBet;
            tokenText.setText('Jetons: ' + tokens);

            // Lancer les rouleaux
            reels.forEach((c, idx) => {
                c.prev = 0;
                const spins = Phaser.Math.Between(20, 25) + idx * 6;
                const dist = spins * symbolSize;
                this.tweens.addCounter({
                    from: 0, to: dist, duration: spins * 80, ease: 'Linear',
                    onUpdate: t => {
                        const v = t.getValue(), d = v - c.prev; c.prev = v;
                        c.list.forEach(ch => {
                            ch.y += d;
                            if (ch.y > symbolSize) {
                                ch.y -= visibleRows * symbolSize;
                                ch.setTexture(getRandomSymbol());
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
            const cx = this.scale.width / 2 - 2 * spacingX;
            const cy = this.scale.height / 2;
            let segs = [];

            PAYLINES.slice(0, activeLineCount).forEach(p => {
                const coords = p.map((r, c) => [c, r]);
                const seq = coords.map(([c, r]) => {
                    const reel = reels[c], y = reel.initialYs[r];
                    return (reel.list.find(ch => Math.abs(ch.y - y) < 1) || reel.list[r]).texture.key;
                });
                const target = seq.find(s => s !== 'bar');
                if (!target) return;
                let count = 0; for (let s of seq) { if (s === target || s === 'bar') count++; else break; }
                if (count >= 3) segs.push({ symbol: target, coords: coords.slice(0, count), count });
            });

            const map = {};
            segs.forEach(s => {
                const k = s.symbol + '|' + s.coords.map(c => c.join(',')).join(';');
                if (!map[k] || s.count > map[k].count) map[k] = s;
            });
            const toPay = Object.values(map).sort((a, b) => a.coords[0][0] - b.coords[0][0]);
            const totalWin = toPay.reduce((sum, s) => sum + ((PAYTABLE[s.symbol] || {})[s.count] || 0), 0);

            if (winTotalText) { winTotalText.destroy(); winTotalText = null; }
            winGraphics.forEach(g => g.destroy()); winGraphics = [];

            const sendResult = () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    result: { game: 'slots', wager: currentBet, payout: totalWin, lines: activeLineCount },
                    newBalance: tokens
                }));
            };

            const unlockAll = () => {
                isSpinning = false;
                // Réactiver selon l'état du solde et de la mise
                if (tokens >= currentBet) spinBtn.setInteractive(); else spinBtn.disableInteractive();
                if (betBtn) betBtn.setInteractive();
                if (backBtn) backBtn.setInteractive();
            };

            if (toPay.length > 0) {
                toPay.forEach((s, i) => {
                    this.time.delayedCall(i * 400, () => {
                        const g = this.add.graphics();
                        g.lineStyle(6, 0x00ff00, 1).beginPath();
                        s.coords.forEach(([c, r], j) => {
                            const x = cx + c * spacingX, y = cy + (r - 1) * symbolSize;
                            j === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
                        });
                        g.strokePath(); winGraphics.push(g);

                        if (i === toPay.length - 1) {
                            if (totalWin > 0) {
                                tokens += totalWin;
                                tokenText.setText('Jetons: ' + tokens);
                                winTotalText = this.add.text(
                                    this.scale.width / 2,
                                    cy - symbolSize * visibleRows + 60,
                                    '+' + totalWin + ' Jetons',
                                    { font: '40px Arial', fill: '#00ff00' }
                                ).setOrigin(0.5);
                            }
                            sendResult();
                            unlockAll();
                        }
                    });
                });
            } else {
                // aucune ligne gagnante
                sendResult();
                unlockAll();
            }
        }


    </script>
</body>

</html>
      `.trim()

      setHtml(htmlContent)
    } catch (err) {
      console.error(err)
      Alert.alert('Erreur', err.message)
      setHtml('<html><body></body></html>')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => { loadGame() }, [loadGame])
  )

  const handleMessage = async ({ nativeEvent }) => {
    try {
      const data = JSON.parse(nativeEvent.data)

      if (data.action === 'goBack') {
        router.replace('/')
        return
      }

      // ✅ Résultat d'un spin -> enregistrement scoreboard + maj solde dans UNE transaction
      if (data.result) {
        const user = auth.currentUser
        if (!user) return

        const { wager = 0, payout = 0, lines = 0, game = 'slots' } = data.result
        try {
          await recordGameResult(user.uid, {
            game,
            wager,
            payout,
            metadata: { lines }
          })
          // ❌ plus d'updateDoc(walletBalance) ici : recordGameResult s'en charge déjà
        } catch (e) {
          console.error('recordGameResult error', e)
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
  webview: { flex: 1 }
})
