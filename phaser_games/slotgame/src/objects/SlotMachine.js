import { Reel } from './Reel.js';
import { SYMBOLS, SLOT_CONFIG } from '../config/gameConfig.js';

export class SlotMachine extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.scene = scene;
    this.reels = [];
    this.isSpinning = false;
    this.balance = 1000;
    this.bet = 10;
    this.lastWin = 0;

    // Ajouter à la scène
    scene.add.existing(this);

    this.createReels();
    this.createUI();
  }

  createReels() {
    const startX = -(SLOT_CONFIG.REELS - 1) * SLOT_CONFIG.SYMBOL_SIZE / 2;

    for (let i = 0; i < SLOT_CONFIG.REELS; i++) {
      const reel = new Reel(
        this.scene,
        startX + i * SLOT_CONFIG.SYMBOL_SIZE,
        0,
        i
      );

      this.reels.push(reel);
      this.add(reel);
    }
  }

  createUI() {
    // Fond de la machine
    const background = this.scene.add.rectangle(0, 0, 600, 400, 0x1a1a1a);
    background.setStrokeStyle(4, 0xffd700);
    this.add(background);

    // Cadre des reels
    const reelFrame = this.scene.add.rectangle(0, -50, 520, 320, 0x000000, 0.3);
    reelFrame.setStrokeStyle(2, 0xffd700);
    this.add(reelFrame);

    // Bouton de spin
    this.spinButton = this.scene.add.circle(0, 150, 40, 0xff4444);
    this.spinButton.setStrokeStyle(3, 0xffffff);
    this.spinButton.setInteractive();
    this.spinButton.on('pointerdown', this.spin, this);
    this.spinButton.on('pointerover', () => {
      if (!this.isSpinning) {
        this.spinButton.setFillStyle(0xff6666);
        this.spinButton.setScale(1.1);
      }
    });
    this.spinButton.on('pointerout', () => {
      this.spinButton.setFillStyle(0xff4444);
      this.spinButton.setScale(1);
    });
    this.add(this.spinButton);

    // Texte du bouton
    const spinText = this.scene.add.text(0, 150, 'SPIN', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    spinText.setOrigin(0.5);
    this.add(spinText);

    // Interface de mise
    this.createBettingUI();
  }

  createBettingUI() {
    // Solde
    this.balanceText = this.scene.add.text(-280, -180, `Balance: $${this.balance}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.add(this.balanceText);

    // Mise
    this.betText = this.scene.add.text(-280, -150, `Bet: $${this.bet}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    });
    this.add(this.betText);

    // Boutons de mise
    const betButtons = [1, 5, 10, 25, 50];
    betButtons.forEach((amount, index) => {
      const button = this.scene.add.rectangle(
        -200 + index * 40, -120, 35, 25, 0x4444ff
      );
      button.setStrokeStyle(1, 0xffffff);
      button.setInteractive();
      button.on('pointerdown', () => this.setBet(amount));
      this.add(button);

      const buttonText = this.scene.add.text(
        -200 + index * 40, -120, `$${amount}`, {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff'
        }
      );
      buttonText.setOrigin(0.5);
      this.add(buttonText);
    });

    // Dernier gain
    this.winText = this.scene.add.text(280, -180, `Last Win: $${this.lastWin}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#00ff00',
      fontStyle: 'bold'
    });
    this.winText.setOrigin(1, 0);
    this.add(this.winText);
  }

  spin() {
    if (this.isSpinning || this.balance < this.bet) {
      return;
    }

    this.isSpinning = true;
    this.balance -= this.bet;
    this.updateUI();

    // Son de spin
    this.scene.sound.play('spin-sound', { volume: 0.5 });

    // Générer les résultats
    const results = this.generateSpinResults();

    // Lancer le spin de chaque reel
    this.reels.forEach((reel, index) => {
      const reelResults = results.map(row => row[index]);
      reel.spin(SLOT_CONFIG.SPIN_DURATION, reelResults);
    });

    // Vérifier les gains après le spin
    this.scene.time.delayedCall(
      SLOT_CONFIG.SPIN_DURATION + (SLOT_CONFIG.REELS * 200),
      () => this.checkWins(results)
    );
  }

  generateSpinResults() {
    const results = [];

    for (let row = 0; row < SLOT_CONFIG.ROWS; row++) {
      const rowResult = [];
      for (let reel = 0; reel < SLOT_CONFIG.REELS; reel++) {
        // Logique de génération basée sur les probabilités
        const random = Math.random();
        let selectedSymbol = 'cherry';
        let cumulativeProbability = 0;

        for (const [symbolName, symbolData] of Object.entries(SYMBOLS)) {
          cumulativeProbability += symbolData.rarity;
          if (random <= cumulativeProbability) {
            selectedSymbol = symbolName.toLowerCase();
            break;
          }
        }

        rowResult.push(selectedSymbol);
      }
      results.push(rowResult);
    }

    return results;
  }

  checkWins(results) {
    this.isSpinning = false;
    let totalWin = 0;
    const winningLines = [];

    // Vérifier chaque ligne de paiement
    SLOT_CONFIG.PAYLINES.forEach((payline, lineIndex) => {
      const symbols = payline.map((row, reelIndex) => results[row][reelIndex]);
      const win = this.calculateLineWin(symbols);

      if (win > 0) {
        totalWin += win;
        winningLines.push({
          line: lineIndex,
          positions: payline,
          symbols: symbols,
          win: win
        });
      }
    });

    this.lastWin = totalWin;
    this.balance += totalWin;

    if (totalWin > 0) {
      this.animateWin(winningLines);
      this.scene.sound.play('win-sound', { volume: 0.7 });

      // Communiquer le gain à React Native
      this.notifyReactNative('win', {
        amount: totalWin,
        balance: this.balance,
        winningLines: winningLines
      });
    }

    this.updateUI();
  }

  calculateLineWin(symbols) {
    // Compter les symboles identiques consécutifs depuis la gauche
    let count = 1;
    const firstSymbol = symbols[0];

    for (let i = 1; i < symbols.length; i++) {
      if (symbols[i] === firstSymbol) {
        count++;
      } else {
        break;
      }
    }

    // Au minimum 3 symboles identiques pour gagner
    if (count >= 3) {
      const symbolData = Object.values(SYMBOLS).find(
        s => s.id === firstSymbol
      );

      if (symbolData) {
        // Multiplicateur basé sur le nombre de symboles
        const multiplier = count === 3 ? 1 : count === 4 ? 3 : 10;
        return symbolData.value * multiplier;
      }
    }

    return 0;
  }

  animateWin(winningLines) {
    winningLines.forEach(line => {
      line.positions.forEach((row, reelIndex) => {
        this.reels[reelIndex].highlightWinningSymbols([row]);
      });
    });
  }

  setBet(amount) {
    if (!this.isSpinning && amount <= this.balance) {
      this.bet = amount;
      this.updateUI();
    }
  }

  updateUI() {
    this.balanceText.setText(`Balance: $${this.balance}`);
    this.betText.setText(`Bet: $${this.bet}`);
    this.winText.setText(`Last Win: $${this.lastWin}`);

    // Désactiver le bouton si pas assez d'argent
    if (this.balance < this.bet) {
      this.spinButton.setFillStyle(0x666666);
    } else {
      this.spinButton.setFillStyle(0xff4444);
    }
  }

  notifyReactNative(action, data) {
    // Communication avec React Native via postMessage
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        action: action,
        data: data
      }));
    }
  }
}
