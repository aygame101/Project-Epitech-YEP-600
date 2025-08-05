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

            // 2) load and base64-encode assets
            const modules = [
                require('../../assets/games/blackjack/cards.png'),
                require('../../assets/games/blackjack/button-hit.png'),
                require('../../assets/games/blackjack/button-stand.png'),
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
            const [cards64, hit64, stand64] = b64s.map(b => 'data:image/png;base64,' + b)


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

        #game-container {
            position: relative;
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
        const CARDS_URI = '${cards64}';
        const HIT_URI = '${hit64}';
        const STAND_URI = '${stand64}';
        const BET_AMOUNT = 10;           // mise fixe
        let tokens = ${ walletBalance };

        // utilitaire pour convertir dataURI en Blob
        function dataURItoBlob(dataURI) {
            const [meta, b64] = dataURI.split(',');
            const type = meta.match(/data:(.*);base64/)[1];
            const bin = atob(b64);
            const len = bin.length;
            const u8 = new Uint8Array(len);
            for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
            return new Blob([u8], { type });
        }

        // calcule la meilleure valeur <=21 pour une main
        function calcValue(hand) {
            let sum = 0, aces = 0;
            hand.forEach(c => {
                const r = c.rank;
                if (r === 'J' || r === 'Q' || r === 'K') sum += 10;
                else if (r === 'A') { sum += 11; aces++; }
                else sum += parseInt(r);
            });
            // dégrader les As de 11→1 si bust
            while (sum > 21 && aces > 0) { sum -= 10; aces--; }
            return sum;
        }

        new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'game-container',
            width: 800, height: 600,
            backgroundColor: 'transparent',
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            scene: { preload, create }
        });

        function preload() {
            // on charge faces + boutons
            this.load.spritesheet('cards', URL.createObjectURL(dataURItoBlob(CARDS_URI)), {
                frameWidth: 140, frameHeight: 190
            });
            this.load.image('hit', URL.createObjectURL(dataURItoBlob(HIT_URI)));
            this.load.image('stand', URL.createObjectURL(dataURItoBlob(STAND_URI)));
        }

        function create() {
            // mélange du deck
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            let deck = [];
            suits.forEach((s, i) => ranks.forEach((r, j) =>
                deck.push({ suit: s, rank: r, frame: i * 13 + j })
            ));
            Phaser.Utils.Array.Shuffle(deck);

            // préparer mains
            const player = [deck.pop(), deck.pop()];
            const dealer = [deck.pop(), deck.pop()];

            // prélever la mise
            tokens -= BET_AMOUNT;

            // affichage solde et mise
            const tokenText = this.add.text(780, 20, 'Jetons: ' + tokens, {
                font: '28px Arial', fill: '#fff'
            }).setOrigin(1, 0);
            this.add.text(20, 20, 'Mise: ' + BET_AMOUNT, {
                font: '28px Arial', fill: '#fff'
            });

            // dessiner mains
            const startX = 100, startY = 400, spacing = 160;
            player.forEach((c, i) =>
                this.add.image(startX + i * spacing, startY, 'cards', c.frame).setScale(0.6)
            );
            dealer.forEach((c, i) =>
                this.add.image(startX + i * spacing, 100, 'cards', c.frame).setScale(0.6)
            );

            // boutons Hit / Stand
            const hitBtn = this.add.image(650, 500, 'hit').setInteractive();
            const standBtn = this.add.image(650, 580, 'stand').setInteractive();

            hitBtn.on('pointerdown', onHit, this);
            standBtn.on('pointerdown', onStand, this);

            // gestion du Hit
            function onHit() {
                const card = deck.pop();
                player.push(card);
                let i = player.length - 1;
                this.add.image(startX + i * spacing, startY, 'cards', card.frame).setScale(0.6);
                const val = calcValue(player);
                if (val > 21) {
                    // joueur bust
                    endRound('lose');
                }
            }

            // gestion du Stand
            function onStand() {
                // croupier tire jusqu'à 17+
                let valD = calcValue(dealer);
                let i = dealer.length;
                while (valD < 17) {
                    const card = deck.pop();
                    dealer.push(card);
                    this.add.image(startX + i * spacing, 100, 'cards', card.frame).setScale(0.6);
                    valD = calcValue(dealer);
                    i++;
                }
                // comparer
                const valP = calcValue(player);
                if (valD > 21 || valP > valD) endRound('win');
                else if (valP < valD) endRound('lose');
                else endRound('push');
            }

            // fin de manche
            function endRound(result) {
                hitBtn.disableInteractive();
                standBtn.disableInteractive();
                let message;
                if (result === 'win') {
                    tokens += BET_AMOUNT * 2;  // gain net = + mise
                    message = 'Vous gagnez !';
                } else if (result === 'push') {
                    tokens += BET_AMOUNT;      // retour de la mise
                    message = 'Égalité';
                } else {
                    message = 'Vous perdez';
                }
                tokenText.setText('Jetons: ' + tokens);
                // afficher le message
                this.add.text(400, 300, message, {
                    font: '48px Arial', fill: '#ff0', stroke: '#000', strokeThickness: 4
                }).setOrigin(0.5);

                // prévenir React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    newBalance: tokens
                }));
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
