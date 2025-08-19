// components/games/BlackjackGameWebView.js

import React, { useState, useCallback } from 'react'
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import { Asset } from 'expo-asset'
import * as FileSystem from 'expo-file-system'
import { useRouter } from 'expo-router'
import { auth, db } from '../../config/firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useFocusEffect } from '@react-navigation/native'

export default function BlackjackGameWebView() {
    const router = useRouter()
    const [html, setHtml] = useState('')
    const [loading, setLoading] = useState(true)

    const loadGame = useCallback(async () => {
        setLoading(true)
        try {
            // 1) Récupérer le solde utilisateur
            const user = auth.currentUser
            if (!user) throw new Error('Utilisateur non connecté')
            const snap = await getDoc(doc(db, 'Users', user.uid))
            const walletBalance = snap.exists() ? snap.data().walletBalance : 0

            // 2) Charger et encoder les images en Base64
            const modules = [
                require('../../assets/games/blackjack/table-background.png'),
                require('../../assets/games/blackjack/cards_spritesheetX2.png'),
                require('../../assets/games/blackjack/red_backX2.png'),
                require('../../assets/games/blackjack/button-hit.png'),
                require('../../assets/games/blackjack/button-stand.png'),
                require('../../assets/games/blackjack/bet-button.png'),
                require('../../assets/games/blackjack/back-button.png'),
                require('../../assets/games/blackjack/play-button.png'),
                require('../../assets/games/blackjack/replay-button.png'),
                require('../../assets/games/blackjack/split-button.png'),
                require('../../assets/games/blackjack/double-button.png'), // NEW
            ]
            const assets = await Promise.all(modules.map(m => Asset.fromModule(m).downloadAsync()))
            const b64s = await Promise.all(
                assets.map(a =>
                    FileSystem.readAsStringAsync(a.localUri || a.uri, {
                        encoding: FileSystem.EncodingType.Base64
                    })
                )
            )
            const [
                bg64,
                cards64,
                back64,
                hit64,
                stand64,
                bet64,
                backBtn64,
                play64,
                replay64,
                split64,
                double64
            ] = b64s.map(b => 'data:image/png;base64,' + b)

            // 3) Construire l’HTML complet
            const htmlContent = `
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
    <title>Blackjack</title>
    <style>
        body,
        html,
        #game-container {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            background:url(${bg64}) center/cover no-repeat;
        }

        canvas {
            display: block;
        }
    </style>
</head>

<body>
    <div id="game-container"></div>
    <script>
        const CARDS_URI = '${cards64}';
        const BACK_URI = '${back64}';
        const HIT_URI = '${hit64}';
        const STAND_URI = '${stand64}';
        const BET_URI = '${bet64}';
        const BACKBTN_URI = '${backBtn64}';
        const PLAY_URI = '${play64}';
        const REPLAY_URI = '${replay64}';
        const SPLIT_URI = '${split64}';
        const DOUBLE_URI = '${double64}';

        // Options de mise
        const BET_OPTIONS = [10, 20, 30, 40, 50, 100, 250, 500];
        let betIndex = 0;
        let currentBet = BET_OPTIONS[betIndex];
        let tokens = ${ walletBalance };

        function dataURItoBlob(dataURI) {
            const parts = dataURI.split(',');
            const meta = parts[0];
            const b64 = parts[1];
            const typeMatch = meta.match(/data:(.*);base64/);
            const type = typeMatch ? typeMatch[1] : 'image/png';
            const bin = atob(b64), len = bin.length;
            const u8 = new Uint8Array(len);
            for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
            return new Blob([u8], { type: type });
        }

        function calcValue(hand) {
            let sum = 0, aces = 0;
            hand.forEach(function (c) {
                if (c.rank === 'J' || c.rank === 'Q' || c.rank === 'K') sum += 10;
                else if (c.rank === 'A') { sum += 11; aces++; }
                else sum += parseInt(c.rank);
            });
            while (sum > 21 && aces > 0) { sum -= 10; aces--; }
            return sum;
        }

        new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'game-container',
            width: 720, height: 1280,
            backgroundColor: 'transparent',
            transparent: true,
            render: { antialias: true, antialiasGL: true, pixelArt: false },
            scale: {
                mode: Phaser.Scale.FIT,
                width: 720, height: 1280,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                resolution: window.devicePixelRatio
            },
            scene: { preload: preload, create: create }
        });

        function preload() {
            this.load.spritesheet('cards', URL.createObjectURL(dataURItoBlob(CARDS_URI)), { frameWidth: 320, frameHeight: 528 });
            this.load.image('back', URL.createObjectURL(dataURItoBlob(BACK_URI)));
            this.load.image('hit', URL.createObjectURL(dataURItoBlob(HIT_URI)));
            this.load.image('stand', URL.createObjectURL(dataURItoBlob(STAND_URI)));
            this.load.image('bet', URL.createObjectURL(dataURItoBlob(BET_URI)));
            this.load.image('backBtn', URL.createObjectURL(dataURItoBlob(BACKBTN_URI)));
            this.load.image('play', URL.createObjectURL(dataURItoBlob(PLAY_URI)));
            this.load.image('replay', URL.createObjectURL(dataURItoBlob(REPLAY_URI)));
            this.load.image('split', URL.createObjectURL(dataURItoBlob(SPLIT_URI)));
            this.load.image('double', URL.createObjectURL(dataURItoBlob(DOUBLE_URI))); // NEW
        }

        function create() {
            const sc = this.scale;
            const width = sc.width, height = sc.height;
            const FRAME_H = 528;
            const maxPerRow = 3;
            const spacingX = width / (maxPerRow + 1);
            const paddingY = 10;
            let playerY = height * 0.55;
            let dealerY = height * 0.22;

            // Carte fermée du croupier
            let dealerHoleSprite = null;
            let dealerHoleCard = null;

            // Texte solde & mise
            const tokenText = this.add.text(width - 20, 20, 'Jetons: ' + tokens, { font: '28px Arial', fill: '#fff' }).setOrigin(1, 0);
            const betText = this.add.text(width - 20, 60, 'Mise: ' + currentBet, { font: '28px Arial', fill: '#fff' }).setOrigin(1, 0);

            // Valeur mains
            const playerValueText = this.add.text(20, playerY - 50, 'Vous: \\n0', { font: '28px Arial', fill: '#fff' });
            const dealerValueText = this.add.text(20, dealerY - 50, 'croupier: \\n0', { font: '28px Arial', fill: '#fff' });

            // Bloc Split (caché par défaut)
            const splitInfo = this.add.container(20, playerY - 120).setVisible(false).setDepth(50);
            const youBlockTitle = this.add.text(0, 0, 'Vous :', { font: '26px Arial', fill: '#fff' });
            const leftValueBlock = this.add.text(0, 0, ['Gauche :', '0'], { font: '22px Arial', fill: '#fff', align: 'left', lineSpacing: 4 });
            const rightValueBlock = this.add.text(0, 0, ['Droite :', '0'], { font: '22px Arial', fill: '#fff', align: 'left', lineSpacing: 4 });
            splitInfo.add([youBlockTitle, leftValueBlock, rightValueBlock]);
            function layoutSplitInfo() {
                leftValueBlock.setY(youBlockTitle.height + 6);
                rightValueBlock.setY(leftValueBlock.y + leftValueBlock.height + 6);
            }
            layoutSplitInfo();

            // Bouton retour
            const backBtn = this.add.image(60, 60, 'backBtn')
                .setDisplaySize(100, 100)
                .setInteractive()
                .on('pointerdown', function () { window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' })); });

            // Bouton mise
            const betBtn = this.add.image(width / 2, height / 2.5, 'bet')
                .setDisplaySize(300, 300)
                .setInteractive()
                .on('pointerdown', function () {
                    betIndex = (betIndex + 1) % BET_OPTIONS.length;
                    currentBet = BET_OPTIONS[betIndex];
                    betText.setText('Mise: ' + currentBet);
                    updatePlayState();
                });

            // Bouton JOUER
            const playBtn = this.add.image(width * 0.5, height * 0.9, 'play').setDisplaySize(450, 300);
            function updatePlayState() {
                if (tokens >= currentBet) { playBtn.setInteractive(); playBtn.setAlpha(1); }
                else { playBtn.disableInteractive(); playBtn.setAlpha(0.5); }
            }
            updatePlayState();
            playBtn.on('pointerdown', startGame, this);

            // Hit/Stand (cachés)
            const hitBtn = this.add.image(width * 0.28, height * 0.9, 'hit').setDisplaySize(200, 200).setInteractive().setVisible(false).setDepth(2);
            const standBtn = this.add.image(width * 0.735, height * 0.9, 'stand').setDisplaySize(200, 200).setInteractive().setVisible(false).setDepth(2);
            function disableActions() { hitBtn.disableInteractive(); standBtn.disableInteractive(); hitBtn.setAlpha(0.5); standBtn.setAlpha(0.5); }
            function enableActions() { hitBtn.setInteractive(); standBtn.setInteractive(); hitBtn.setAlpha(1); standBtn.setAlpha(1); }

            // SPLIT
            let splitActive = false;
            let leftHand = [], rightHand = [];
            let activeHand = 0;
            let leftBaseX = null, rightBaseX = null;
            let leftBaseY = null, rightBaseY = null;
            const SPLIT_SCALE = 0.5;
            const SPLIT_OVERLAP = 0.7;
            const RIGHT_SHIFT = 175;

            const splitBtn = this.add.image(width * 0.5, height * 0.82, 'split')
                .setDisplaySize(260, 160)
                .setVisible(false)
                .setDepth(1);

            function canSplit(hand) {
                if (!hand || hand.length !== 2) return false;
                const r1 = hand[0].rank, r2 = hand[1].rank;
                function isFace(r) { return r === 'J' || r === 'Q' || r === 'K'; }
                if (r1 === r2) return true;
                if ((r1 === '10' && isFace(r2)) || (r2 === '10' && isFace(r1))) return true;
                if (isFace(r1) && isFace(r2)) return true;
                return false;
            }

            // DOUBLE
            let doubleActive = false;
            let canDouble = false;
            const doubleBtn = this.add.image(width * 0.5, height * 0.97, 'double') // image 'double-button.png'
                .setDisplaySize(260, 160)
                .setVisible(false)
                .setDepth(2);
            function showDouble() {
                if (!splitActive && !doubleActive && tokens >= currentBet) {
                    doubleBtn.setVisible(true).setInteractive();
                }
            }
            function hideDouble() {
                doubleBtn.setVisible(false).disableInteractive();
            }

            // Deck
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            let deck = [];
            for (let i = 0; i < suits.length; i++) {
                for (let j = 0; j < ranks.length; j++) {
                    deck.push({ suit: suits[i], rank: ranks[j], frame: i * 13 + j });
                }
            }
            Phaser.Utils.Array.Shuffle(deck);

            let player = [], dealer = [];
            let playerSprites = [];

            function getPos(hand, idx, baseY) {
                const rows = Math.ceil(hand.length / maxPerRow);
                const row = Math.floor(idx / maxPerRow);
                const col = idx % maxPerRow;
                const scale = 0.5 * Math.max(0.4, 1 - 0.1 * (rows - 1));
                const y = baseY + (row - (rows - 1) / 2) * (FRAME_H * scale + paddingY);
                const x = spacingX * (col + 1) + 40;
                return { x: x, y: y, scale: scale };
            }

            function startGame() {
                if (!playBtn.active) return;

                backBtn.setVisible(false); backBtn.disableInteractive();
                betBtn.setVisible(false); betBtn.disableInteractive();

                playBtn.destroy();
                tokens -= currentBet;
                tokenText.setText('Jetons: ' + tokens);

                const seq = [
                    { hand: player, baseY: playerY, faceDown: false },
                    { hand: dealer, baseY: dealerY, faceDown: false },
                    { hand: player, baseY: playerY, faceDown: false },
                    { hand: dealer, baseY: dealerY, faceDown: true }
                ];
                for (let idx = 0; idx < seq.length; idx++) {
                    (function (step, idxLocal) {
                        this.time.delayedCall(500 * idxLocal, function () {
                            const card = deck.pop();
                            step.hand.push(card);
                            const pos = getPos(step.hand, step.hand.length - 1, step.baseY);
                            const key = step.faceDown ? 'back' : 'cards';
                            const frame = step.faceDown ? undefined : card.frame;
                            const sprite = this.add.image(pos.x, pos.y, key, frame).setScale(pos.scale);

                            if (step.hand === player && !step.faceDown && step.hand.length <= 2) {
                                playerSprites[step.hand.length - 1] = sprite;
                            }
                            if (step.hand === player) {
                                if (step.hand.length === 1) { leftBaseX = pos.x; leftBaseY = pos.y; }
                                if (step.hand.length === 2) { rightBaseX = pos.x + RIGHT_SHIFT; rightBaseY = pos.y; }
                            }
                            if (step.hand === dealer && step.faceDown) {
                                dealerHoleSprite = sprite;
                                dealerHoleCard = card;
                            }

                            if (!step.faceDown) {
                                if (step.hand === player) playerValueText.setText('Vous: \\n' + calcValue(player));
                                else dealerValueText.setText('croupier: \\n' + calcValue(dealer));
                                if (calcValue(step.hand) === 21) {
                                    endRound.call(this, step.hand === player ? 'win' : 'lose');
                                    return;
                                }
                            }

                            if (idxLocal === seq.length - 1) {
                                // distribution terminée
                                hitBtn.setVisible(true);
                                standBtn.setVisible(true);
                                enableActions();

                                // DOUBLE dispo uniquement jeu normal, 2 cartes, <21, solde OK
                                canDouble = (!splitActive && player.length === 2 && calcValue(player) < 21 && tokens >= currentBet);
                                if (canDouble) { showDouble(); } else { hideDouble(); }

                                // SPLIT dispo si mains compatibles
                                if (canSplit(player) && tokens >= currentBet) {
                                    splitBtn.setVisible(true);
                                    splitBtn.setInteractive().on('pointerdown', startSplit, this);
                                } else {
                                    splitBtn.setVisible(false);
                                    if (typeof splitBtn.removeAllListeners === 'function') splitBtn.removeAllListeners();
                                    splitBtn.disableInteractive();
                                }
                            }
                        }, [], this);
                    }).call(this, seq[idx], idx);
                }
            }

            function getPosSplit(hand, idx, side) {
                const baseX = (side === 0) ? leftBaseX : rightBaseX;
                const baseY = (side === 0) ? leftBaseY : rightBaseY;
                const scale = SPLIT_SCALE;
                const stepY = FRAME_H * scale * (1 - SPLIT_OVERLAP) + paddingY;
                const x = baseX;
                const y = baseY + idx * stepY;
                return { x: x, y: y, scale: scale };
            }

            function startSplit() {
                if (splitActive) return;
                if (tokens < currentBet) return;

                // Désactiver DOUBLE en split
                hideDouble();
                canDouble = false;

                // Débit de la 2e mise
                tokens -= currentBet;
                tokenText.setText('Jetons: ' + tokens);

                // Affiche 2× la mise pendant la manche
                betText.setText('Mise: ' + (currentBet * 2));

                splitActive = true;
                splitBtn.setVisible(false);
                splitBtn.disableInteractive();
                disableActions();

                // Bloc split visible
                playerValueText.setVisible(false);
                splitInfo.setVisible(true);
                layoutSplitInfo();

                const leftAnchor = getPosSplit(leftHand, 0, 0);
                const rightAnchor = getPosSplit(rightHand, 0, 1);

                if (playerSprites[0]) playerSprites[0].setPosition(leftAnchor.x, leftAnchor.y).setScale(leftAnchor.scale);
                if (playerSprites[1]) playerSprites[1].setPosition(rightAnchor.x, rightAnchor.y).setScale(rightAnchor.scale);

                leftHand = [player[0]];
                rightHand = [player[1]];
                activeHand = 0;

                leftValueBlock.setText(['Gauche :', String(calcValue(leftHand))]);
                rightValueBlock.setText(['Droite :', String(calcValue(rightHand))]);
                layoutSplitInfo();

                this.time.delayedCall(400, function () {
                    const c = deck.pop(); leftHand.push(c);
                    const pos = getPosSplit(leftHand, leftHand.length - 1, 0);
                    this.add.image(pos.x, pos.y, 'cards', c.frame).setScale(pos.scale);
                    const v = calcValue(leftHand);
                    leftValueBlock.setText(['Gauche :', String(v)]);
                    layoutSplitInfo();
                    if (v >= 21) {
                        nextHandOrDealer.call(this);
                    } else {
                        enableActions();
                    }
                }, [], this);
            }

            function hitSplit() {
                disableActions();
                const hand = activeHand === 0 ? leftHand : rightHand;
                const side = activeHand;
                const c = deck.pop(); hand.push(c);
                const pos = getPosSplit(hand, hand.length - 1, side);
                this.add.image(pos.x, pos.y, 'cards', c.frame).setScale(pos.scale);
                const v = calcValue(hand);
                if (side === 0) leftValueBlock.setText(['Gauche :', String(v)]);
                else rightValueBlock.setText(['Droite :', String(v)]);
                layoutSplitInfo();
                if (v >= 21) {
                    nextHandOrDealer.call(this);
                } else {
                    enableActions();
                }
            }

            function standSplit() {
                disableActions();
                nextHandOrDealer.call(this);
            }

            function nextHandOrDealer() {
                if (activeHand === 0) {
                    activeHand = 1;
                    if (rightHand.length === 1) {
                        const c = deck.pop(); rightHand.push(c);
                        const pos = getPosSplit(rightHand, rightHand.length - 1, 1);
                        this.add.image(pos.x, pos.y, 'cards', c.frame).setScale(pos.scale);
                        const v = calcValue(rightHand);
                        rightValueBlock.setText(['Droite :', String(v)]);
                        layoutSplitInfo();
                        if (v >= 21) {
                            nextHandOrDealer.call(this);
                        } else {
                            enableActions();
                        }
                    } else {
                        const v2 = calcValue(rightHand);
                        rightValueBlock.setText(['Droite :', String(v2)]);
                        layoutSplitInfo();
                        if (v2 < 21) enableActions();
                    }
                    return;
                }
                playDealerAndSettle.call(this);
            }

            function playDealerAndSettle() {
                disableActions();

                if (dealerHoleSprite && dealerHoleCard) {
                    dealerHoleSprite.setTexture('cards', dealerHoleCard.frame);
                }

                let valD = calcValue(dealer);
                dealerValueText.setText('croupier: \\n' + valD);
                const draw = function () {
                    if (valD < 17) {
                        const c = deck.pop(); dealer.push(c);
                        const pos = getPos(dealer, dealer.length - 1, dealerY);
                        this.add.image(pos.x, pos.y, 'cards', c.frame).setScale(pos.scale);
                        valD = calcValue(dealer);
                        dealerValueText.setText('croupier: \\n' + valD);
                        this.time.delayedCall(500, draw, [], this);
                    } else {
                        settleSplit.call(this, valD);
                    }
                }.bind(this);
                this.time.delayedCall(500, draw, [], this);
            }

            function settleSplit(dealerVal) {
                const hands = [leftHand, rightHand];
                let msgLeft = '', msgRight = '';

                function payoutFor(res) {
                    return res === 'win' ? (currentBet * 2)
                        : res === 'push' ? currentBet
                            : 0;
                }
                function netFor(res) {
                    return payoutFor(res) - currentBet;
                }
                function fmt(n) {
                    return n > 0 ? ('+' + n) : (n < 0 ? ('-' + Math.abs(n)) : '0');
                }
                function human(r) {
                    return r === 'win' ? 'Gagnée' : (r === 'push' ? 'Égalité' : 'Perdue');
                }

                for (let i = 0; i < hands.length; i++) {
                    const h = hands[i];
                    const v = calcValue(h);
                    let res = '';
                    if (v > 21) res = 'lose';
                    else if (dealerVal > 21 || v > dealerVal) res = 'win';
                    else if (v < dealerVal) res = 'lose';
                    else res = 'push';
                    if (i === 0) msgLeft = res; else msgRight = res;
                }

                const leftPayout = payoutFor(msgLeft);
                const rightPayout = payoutFor(msgRight);
                const totalPayout = leftPayout + rightPayout;
                const leftNet = netFor(msgLeft);
                const rightNet = netFor(msgRight);
                const totalNet = leftNet + rightNet;

                tokens += totalPayout;
                tokenText.setText('Jetons: ' + tokens);

                this.add.text(
                    width / 2, height * 0.43,
                    'Main gauche: ' + human(msgLeft) + ' (' + fmt(leftNet) + ')  |  ' +
                    'Main droite: ' + human(msgRight) + ' (' + fmt(rightNet) + ')\\n' +
                    'Total: ' + fmt(totalNet) + ' jetons',
                    { font: '28px Arial', fill: '#ff0', stroke: '#000', strokeThickness: 4, align: 'center' }
                ).setOrigin(0.5);

                const replay = this.add.image(width * 0.5, height * 0.9, 'replay')
                    .setDisplaySize(180, 180)
                    .setInteractive();

                replay.on('pointerdown', function () {
                    // Reset affichage mise
                    betText.setText('Mise: ' + currentBet);
                    // Reset état double
                    doubleActive = false;

                    backBtn.setVisible(true); backBtn.setInteractive();
                    betBtn.setVisible(true); betBtn.setInteractive();
                    this.scene.restart();
                }, this);

                window.ReactNativeWebView.postMessage(JSON.stringify({ newBalance: tokens }));
            }

            // ==== DOUBLE DOWN ====
            function doubleDown() {
                if (splitActive || doubleActive) return;
                if (tokens < currentBet) return;

                // Débit de la 2e mise
                tokens -= currentBet;
                tokenText.setText('Jetons: ' + tokens);

                // UI de mise à 2× jusqu'à la fin de la manche
                betText.setText('Mise: ' + (currentBet * 2));

                doubleActive = true;
                hideDouble();
                disableActions();

                // Tirer UNE carte pour le joueur
                const c = deck.pop(); player.push(c);
                const pos = getPos(player, player.length - 1, playerY);
                this.add.image(pos.x, pos.y, 'cards', c.frame).setScale(pos.scale);
                const val = calcValue(player);
                playerValueText.setText('Vous: \\n' + val);

                // Puis jouer le croupier (comme un STAND)
                if (dealerHoleSprite && dealerHoleCard) {
                    dealerHoleSprite.setTexture('cards', dealerHoleCard.frame);
                }

                let valD = calcValue(dealer);
                dealerValueText.setText('croupier: \\n' + valD);

                const draw = function () {
                    if (valD < 17) {
                        const dc = deck.pop(); dealer.push(dc);
                        const dpos = getPos(dealer, dealer.length - 1, dealerY);
                        this.add.image(dpos.x, dpos.y, 'cards', dc.frame).setScale(dpos.scale);
                        valD = calcValue(dealer);
                        dealerValueText.setText('croupier: \\n' + valD);
                        this.time.delayedCall(500, draw, [], this);
                    } else {
                        const valP = calcValue(player);
                        if (valD > 21 || valP > valD) endRound.call(this, 'win');
                        else if (valP < valD) endRound.call(this, 'lose');
                        else endRound.call(this, 'push');
                    }
                }.bind(this);
                this.time.delayedCall(500, draw, [], this);
            }
            doubleBtn.on('pointerdown', function () { doubleDown.call(this); }, this);

            // ==== Handlers HIT / STAND ====
            hitBtn.on('pointerdown', function () {
                if (splitActive) { hitSplit.call(this); return; }

                // Après un HIT normal, le double n'est plus possible
                hideDouble(); canDouble = false;

                const card = deck.pop(); player.push(card);
                const pos = getPos(player, player.length - 1, playerY);
                this.add.image(pos.x, pos.y, 'cards', card.frame).setScale(pos.scale);
                const val = calcValue(player);
                playerValueText.setText('Vous: \\n' + val);
                if (val >= 21) endRound.call(this, val === 21 ? 'win' : 'lose');
            }, this);

            standBtn.on('pointerdown', function () {
                if (splitActive) { standSplit.call(this); return; }

                // Après un STAND normal, cacher double
                hideDouble(); canDouble = false;

                if (dealerHoleSprite && dealerHoleCard) {
                    dealerHoleSprite.setTexture('cards', dealerHoleCard.frame);
                }

                let valD = calcValue(dealer);
                dealerValueText.setText('croupier: \\n' + valD);
                if (valD === 21) { endRound.call(this, 'lose'); return; }
                const draw = function () {
                    if (valD < 17) {
                        const c = deck.pop(); dealer.push(c);
                        const pos = getPos(dealer, dealer.length - 1, dealerY);
                        this.add.image(pos.x, pos.y, 'cards', c.frame).setScale(pos.scale);
                        valD = calcValue(dealer);
                        dealerValueText.setText('croupier: \\n' + valD);
                        this.time.delayedCall(500, draw, [], this);
                    } else {
                        const valP = calcValue(player);
                        if (valD > 21 || valP > valD) endRound.call(this, 'win');
                        else if (valP < valD) endRound.call(this, 'lose');
                        else endRound.call(this, 'push');
                    }
                }.bind(this);
                this.time.delayedCall(500, draw, [], this);
            }, this);

            function endRound(result) {
                hitBtn.disableInteractive();
                standBtn.disableInteractive();

                // Montant réellement engagé : 1× mise (normal) ou 2× mise (après double)
                var stake = currentBet * (doubleActive ? 2 : 1);

                // Payout brut (stake*2 si win, stake si push, 0 sinon)
                var payout = 0;
                if (result === 'win') payout = stake * 2;
                else if (result === 'push') payout = stake;

                // Net vs. stake engagé
                var netDelta = payout - stake;

                tokens += payout;
                tokenText.setText('Jetons: ' + tokens);

                function fmt(n) {
                    return n > 0 ? ('+' + n) : (n < 0 ? ('-' + Math.abs(n)) : '0');
                }

                var label =
                    result === 'win' ? 'Vous gagnez !' :
                        result === 'push' ? 'Égalité' :
                            'Vous perdez';

                this.add.text(width / 2, height * 0.43, label + ' (' + fmt(netDelta) + ' jetons)', { font: '40px Arial', fill: '#ff0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

                var replay = this.add.image(width * 0.5, height * 0.9, 'replay')
                    .setDisplaySize(180, 180)
                    .setInteractive();

                replay.on('pointerdown', function () {
                    // Reset affichage mise + état double
                    betText.setText('Mise: ' + currentBet);
                    doubleActive = false;

                    backBtn.setVisible(true); backBtn.setInteractive();
                    betBtn.setVisible(true); betBtn.setInteractive();
                    this.scene.restart();
                }, this);

                window.ReactNativeWebView.postMessage(JSON.stringify({ newBalance: tokens }));
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

    useFocusEffect(useCallback(() => { loadGame() }, [loadGame]))

    const handleMessage = async ({ nativeEvent }) => {
        try {
            const data = JSON.parse(nativeEvent.data)
            if (data.action === 'goBack') {
                router.replace('/')
            } else if (typeof data.newBalance === 'number') {
                const user = auth.currentUser
                if (user) {
                    await updateDoc(doc(db, 'Users', user.uid), { walletBalance: data.newBalance })
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
