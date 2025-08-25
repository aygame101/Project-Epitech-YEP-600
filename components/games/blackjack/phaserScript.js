export const phaserScript = `
(function () {
    // Données injectées par htmlTemplate.js :
    //  - ASSET_URIS : { bg, cards, back, hit, stand, bet, backBtn, play, replay, split, double }
    //  - WALLET_BALANCE : number (solde initial)
    const CARDS_URI = ASSET_URIS.cards;
    const BACK_URI = ASSET_URIS.back;
    const HIT_URI = ASSET_URIS.hit;
    const STAND_URI = ASSET_URIS.stand;
    const BET_URI = ASSET_URIS.bet;
    const BACKBTN_URI = ASSET_URIS.backBtn;
    const PLAY_URI = ASSET_URIS.play;
    const REPLAY_URI = ASSET_URIS.replay;
    const SPLIT_URI = ASSET_URIS.split;
    const DOUBLE_URI = ASSET_URIS.double;

    // Options de mise
    const BET_OPTIONS = [10, 20, 30, 40, 50, 100, 250, 500];
    let betIndex = 0;
    let currentBet = BET_OPTIONS[betIndex];
    let tokens = WALLET_BALANCE;

    function dataURItoBlob(dataURI) {
        const parts = dataURI.split(',');
        const meta = parts[0];
        const b64 = parts[1];
        const typeMatch = meta.match(/data:(.*);base64/);
        const type = typeMatch ? typeMatch[1] : 'image/png';
        const bin = atob(b64), len = bin.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
        return new Blob([u8], { type });
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

    function cardsToShort(hand) {
        // ex: 'Ah', 'Td', 'Ks'...
        return hand.map(c => c.rank + (c.suit ? c.suit[0] : '?'));
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
        this.load.image('double', URL.createObjectURL(dataURItoBlob(DOUBLE_URI)));
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

        let dealerHoleSprite = null;
        let dealerHoleCard = null;

        const tokenText = this.add.text(width - 20, 20, 'Jetons: ' + tokens, { font: '28px Arial', fill: '#fff' }).setOrigin(1, 0);
        const betText = this.add.text(width - 20, 60, 'Mise: ' + currentBet, { font: '28px Arial', fill: '#fff' }).setOrigin(1, 0);

        const playerValueText = this.add.text(20, playerY - 50, 'Vous: \\n0', { font: '28px Arial', fill: '#fff' });
        const dealerValueText = this.add.text(20, dealerY - 50, 'croupier: \\n0', { font: '28px Arial', fill: '#fff' });

        // Bloc Split
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
            .on('pointerdown', function () {
                window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' }));
            });

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
        const doubleBtn = this.add.image(width * 0.5, height * 0.97, 'double')
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
            return { x, y, scale };
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
            return { x, y, scale };
        }

        function startSplit() {
            if (splitActive) return;
            if (tokens < currentBet) return;

            hideDouble();
            canDouble = false;

            tokens -= currentBet;
            tokenText.setText('Jetons: ' + tokens);

            betText.setText('Mise: ' + (currentBet * 2));

            splitActive = true;
            splitBtn.setVisible(false);
            splitBtn.disableInteractive();
            disableActions();

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
            function netFor(res) { return payoutFor(res) - currentBet; }
            function fmt(n) { return n > 0 ? ('+' + n) : (n < 0 ? ('-' + Math.abs(n)) : '0'); }
            function human(r) { return r === 'win' ? 'Gagnée' : (r === 'push' ? 'Égalité' : 'Perdue'); }

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
                betText.setText('Mise: ' + currentBet);
                doubleActive = false;
                backBtn.setVisible(true); backBtn.setInteractive();
                betBtn.setVisible(true); betBtn.setInteractive();
                this.scene.restart();
            }, this);

            // NEW: envoyer le résultat au RN pour scoreboard
            const meta = {
                mode: 'split',
                split: true,
                dealerValue: dealerVal,
                dealerCards: cardsToShort(dealer),
                left: {
                    result: msgLeft,
                    value: calcValue(leftHand),
                    cards: cardsToShort(leftHand)
                },
                right: {
                    result: msgRight,
                    value: calcValue(rightHand),
                    cards: cardsToShort(rightHand)
                },
                currentBet
            };

            // Wager = mise de 2 mains, payout = totalPayout (brut)
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'gameResult',
                game: 'blackjack',
                wager: currentBet * 2,
                payout: totalPayout,
                metadata: meta
            }));

            // Mise à jour du solde (comme avant)
            window.ReactNativeWebView.postMessage(JSON.stringify({ newBalance: tokens }));
        }

        // ==== DOUBLE DOWN ====
        function doubleDown() {
            if (splitActive || doubleActive) return;
            if (tokens < currentBet) return;

            tokens -= currentBet;
            tokenText.setText('Jetons: ' + tokens);

            betText.setText('Mise: ' + (currentBet * 2));

            doubleActive = true;
            hideDouble();
            disableActions();

            const c = deck.pop(); player.push(c);
            const pos = getPos(player, player.length - 1, playerY);
            this.add.image(pos.x, pos.y, 'cards', c.frame).setScale(pos.scale);
            const val = calcValue(player);
            playerValueText.setText('Vous: \\n' + val);

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

            var stake = currentBet * (doubleActive ? 2 : 1);
            var payout = 0;
            if (result === 'win') payout = stake * 2;
            else if (result === 'push') payout = stake;

            var netDelta = payout - stake;

            tokens += payout;
            tokenText.setText('Jetons: ' + tokens);

            function fmt(n) {
                return n > 0 ? ('+' + n) : (n < 0 ? ('-' + Math.abs(n)) : '0');
            }

            var label = result === 'win' ? 'Vous gagnez !' :
                result === 'push' ? 'Égalité' :
                    'Vous perdez';

            this.add.text(width / 2, height * 0.43, label + ' (' + fmt(netDelta) + ' jetons)', { font: '40px Arial', fill: '#ff0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

            var replay = this.add.image(width * 0.5, height * 0.9, 'replay')
                .setDisplaySize(180, 180)
                .setInteractive();

            replay.on('pointerdown', function () {
                betText.setText('Mise: ' + currentBet);
                doubleActive = false;
                backBtn.setVisible(true); backBtn.setInteractive();
                betBtn.setVisible(true); betBtn.setInteractive();
                this.scene.restart();
            }, this);

            // NEW: envoyer le résultat au RN pour scoreboard
            const meta = {
                mode: doubleActive ? 'double' : 'normal',
                split: false,
                result,
                currentBet,
                player: { value: calcValue(player), cards: cardsToShort(player) },
                // dealer peut être partiellement défini si fin par bust/21 côté joueur
                dealer: dealer && dealer.length ? { value: calcValue(dealer), cards: cardsToShort(dealer) } : null
            };
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'gameResult',
                game: 'blackjack',
                wager: stake,
                payout: payout,
                metadata: meta
            }));

            // Mise à jour du solde (comme avant)
            window.ReactNativeWebView.postMessage(JSON.stringify({ newBalance: tokens }));
        }
    }
})();
`
