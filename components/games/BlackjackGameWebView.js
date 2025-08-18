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
                require('../../assets/games/blackjack/cards_spritesheetX2.png'),
                require('../../assets/games/blackjack/red_backX2.png'),
                require('../../assets/games/blackjack/button-hit.png'),
                require('../../assets/games/blackjack/button-stand.png'),
                require('../../assets/games/blackjack/bet-button.png'),
                require('../../assets/games/blackjack/back-button.png'),
            ]
            const assets = await Promise.all(modules.map(m => Asset.fromModule(m).downloadAsync()))
            const b64s = await Promise.all(
                assets.map(a =>
                    FileSystem.readAsStringAsync(a.localUri || a.uri, {
                        encoding: FileSystem.EncodingType.Base64
                    })
                )
            )
            const [cards64, back64, hit64, stand64, bet64, backBtn64] = b64s.map(
                b => 'data:image/png;base64,' + b
            )

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
            background: #006600;
        }

        canvas {
            display: block;
        }
    </style>
</head>

<body>
    <div id="game-container"></div>
    <script>
        // Data-URIs
        const CARDS_URI = '${cards64}'
        const BACK_URI = '${back64}'
        const HIT_URI = '${hit64}'
        const STAND_URI = '${stand64}'
        const BET_URI = '${bet64}'
        const BACKBTN_URI = '${backBtn64}'

        // Options de mise
        const BET_OPTIONS = [10, 20, 30, 40, 50, 100, 250, 500]
        let betIndex = 0
        let currentBet = BET_OPTIONS[betIndex]
        let tokens = ${ walletBalance }

        // Convertit dataURI → Blob
        function dataURItoBlob(dataURI) {
            const [meta, b64] = dataURI.split(',')
            const type = meta.match(/data:(.*);base64/)[1]
            const bin = atob(b64), len = bin.length
            const u8 = new Uint8Array(len)
            for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i)
            return new Blob([u8], { type })
        }

        // Calcule valeur d'une main ≤21
        function calcValue(hand) {
            let sum = 0, aces = 0
            hand.forEach(c => {
                if (['J', 'Q', 'K'].includes(c.rank)) sum += 10
                else if (c.rank === 'A') { sum += 11; aces++ }
                else sum += parseInt(c.rank)
            })
            while (sum > 21 && aces > 0) { sum -= 10; aces-- }
            return sum
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
            scene: { preload, create }
        })

        function preload() {
            this.load.spritesheet('cards',
                URL.createObjectURL(dataURItoBlob(CARDS_URI)),
                { frameWidth: 320, frameHeight: 528 }
            )
            this.load.image('back', URL.createObjectURL(dataURItoBlob(BACK_URI)))
            this.load.image('hit', URL.createObjectURL(dataURItoBlob(HIT_URI)))
            this.load.image('stand', URL.createObjectURL(dataURItoBlob(STAND_URI)))
            this.load.image('bet', URL.createObjectURL(dataURItoBlob(BET_URI)))
            this.load.image('backBtn', URL.createObjectURL(dataURItoBlob(BACKBTN_URI)))
        }

        function create() {
            const { width, height } = this.scale
            const FRAME_H = 528
            const maxPerRow = 3
            const spacingX = width / (maxPerRow + 1)
            const paddingY = 10
            let playerY = height * 0.66
            let dealerY = height * 0.22

            // Texte solde & mise
            const tokenText = this.add.text(width - 20, 20, 'Jetons: ' + tokens, {
                font: '28px Arial', fill: '#fff'
            }).setOrigin(1, 0)
            const betText = this.add.text(width - 20, 60, 'Mise: ' + currentBet, {
                font: '28px Arial', fill: '#fff'
            }).setOrigin(1, 0)

            // Valeur mains
            const playerValueText = this.add.text(20, playerY - 50, 'Vous: \\n0', {
                font: '28px Arial', fill: '#fff'
            })
            const dealerValueText = this.add.text(20, dealerY - 50, 'croupier: \\n0', {
                font: '28px Arial', fill: '#fff'
            })

            // Bouton retour
            this.add.image(60, 60, 'backBtn')
                .setDisplaySize(100, 100)
                .setInteractive()
                .on('pointerdown', () => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' }))
                })

            // Bouton mise
            const betBtn = this.add.image(width * 0.2, height * 0.9, 'bet')
                .setDisplaySize(100, 100)
                .setInteractive()
                .on('pointerdown', () => {
                    betIndex = (betIndex + 1) % BET_OPTIONS.length
                    currentBet = BET_OPTIONS[betIndex]
                    betText.setText('Mise: ' + currentBet)
                })

            // Bouton jouer
            const playBtn = this.add.text(width / 2, height / 2, 'JOUER', {
                font: '40px Arial', fill: '#0f0', backgroundColor: '#000'
            }).setOrigin(0.5).setPadding(10)
                .setInteractive()
                .on('pointerdown', startGame, this)

            // Hit/Stand (cachés)
            const hitBtn = this.add.image(width * 0.3, height * 0.9, 'hit')
                .setDisplaySize(100, 100).setInteractive().setVisible(false)
            const standBtn = this.add.image(width * 0.7, height * 0.9, 'stand')
                .setDisplaySize(100, 100).setInteractive().setVisible(false)

            // Prépare deck
            const suits = ['hearts', 'diamonds', 'clubs', 'spades']
            const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
            let deck = []
            suits.forEach((s, i) => ranks.forEach((r, j) => deck.push({ suit: s, rank: r, frame: i * 13 + j })))
            Phaser.Utils.Array.Shuffle(deck)

            let player = [], dealer = []

            // calcule pos & scale
            function getPos(hand, idx, baseY) {
                const rows = Math.ceil(hand.length / maxPerRow)
                const row = Math.floor(idx / maxPerRow)
                const col = idx % maxPerRow
                const scale = 0.5 * Math.max(0.4, 1 - 0.1 * (rows - 1))
                const y = baseY + (row - (rows - 1) / 2) * (FRAME_H * scale + paddingY)
                const x = spacingX * (col + 1) + 40
                return { x, y, scale }
            }

            // démarre la distribution
            function startGame() {
                if (!playBtn.active) return
                playBtn.destroy()
                betBtn.disableInteractive()
                tokens -= currentBet
                tokenText.setText('Jetons: ' + tokens)

                const seq = [
                    { hand: player, baseY: playerY, faceDown: false },
                    { hand: dealer, baseY: dealerY, faceDown: false },
                    { hand: player, baseY: playerY, faceDown: false },
                    { hand: dealer, baseY: dealerY, faceDown: true },
                ]
                seq.forEach((step, idx) => {
                    this.time.delayedCall(500 * idx, () => {
                        const card = deck.pop()
                        step.hand.push(card)
                        const pos = getPos(step.hand, step.hand.length - 1, step.baseY)
                        const key = step.faceDown ? 'back' : 'cards'
                        const frame = step.faceDown ? undefined : card.frame
                        this.add.image(pos.x, pos.y, key, frame).setScale(pos.scale)
                        if (!step.faceDown) {
                            if (step.hand === player)
                                playerValueText.setText('Vous: \\n' + calcValue(player))
                            else
                                dealerValueText.setText('croupier: \\n' + calcValue(dealer))
                            // auto-win si 21
                            if (calcValue(step.hand) === 21) {
                                endRound.call(this, step.hand === player ? 'win' : 'lose')
                                return
                            }
                        }
                        if (idx === seq.length - 1) {
                            hitBtn.setVisible(true)
                            standBtn.setVisible(true)
                        }
                    }, [], this)
                })
            }

            hitBtn.on('pointerdown', () => {
                const card = deck.pop(); player.push(card)
                const pos = getPos(player, player.length - 1, playerY)
                this.add.image(pos.x, pos.y, 'cards', card.frame).setScale(pos.scale)
                const val = calcValue(player)
                playerValueText.setText('Vous: \\n' + val)
                if (val >= 21) {
                    endRound.call(this, val === 21 ? 'win' : 'lose')
                }
            })

            standBtn.on('pointerdown', () => {
                // découvrir le dos
                this.children.list
                    .filter(c => c.texture.key === 'back')
                    .forEach(c => c.setTexture('cards', dealer[1].frame))
                let valD = calcValue(dealer)
                dealerValueText.setText('croupier: \\n' + valD)
                if (valD === 21) {
                    endRound.call(this, 'lose')
                    return
                }
                // tirage
                const draw = () => {
                    if (valD < 17) {
                        const c = deck.pop(); dealer.push(c)
                        const pos = getPos(dealer, dealer.length - 1, dealerY)
                        this.add.image(pos.x, pos.y, 'cards', c.frame).setScale(pos.scale)
                        valD = calcValue(dealer)
                        dealerValueText.setText('croupier: \\n' + valD)
                        this.time.delayedCall(500, draw, [], this)
                    } else {
                        const valP = calcValue(player)
                        if (valD > 21 || valP > valD) endRound.call(this, 'win')
                        else if (valP < valD) endRound.call(this, 'lose')
                        else endRound.call(this, 'push')
                    }
                }
                this.time.delayedCall(500, draw, [], this)
            })

            function endRound(result) {
                hitBtn.disableInteractive()
                standBtn.disableInteractive()
                let gain = 0
                if (result === 'win') gain = currentBet * 2
                else if (result === 'push') gain = currentBet
                tokens += gain
                tokenText.setText('Jetons: ' + tokens)

                const msg = result === 'win' ? 'Vous gagnez !' :
                    result === 'push' ? 'Égalité' : 'Vous perdez'
                this.add.text(width / 2, height * 0.5, msg, {
                    font: '40px Arial', fill: '#ff0',
                    stroke: '#000', strokeThickness: 4
                }).setOrigin(0.5)

                // bouton Rejouer
                const replay = this.add.text(width / 2, height * 0.65, 'REJOUER', {
                    font: '32px Arial', fill: '#0f0', backgroundColor: '#000'
                }).setOrigin(0.5).setPadding(8).setInteractive()
                replay.on('pointerdown', () => this.scene.restart())

                window.ReactNativeWebView.postMessage(JSON.stringify({
                    newBalance: tokens
                }))
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
