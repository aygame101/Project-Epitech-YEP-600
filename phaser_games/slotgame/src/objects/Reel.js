import { Symbol } from './Symbol.js';
import { SYMBOLS, SLOT_CONFIG } from '../config/gameConfig.js';

export class Reel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, reelIndex) {
    super(scene, x, y);

    this.scene = scene;
    this.reelIndex = reelIndex;
    this.symbols = [];
    this.isSpinning = false;
    this.spinSpeed = 0;
    this.targetSymbols = [];

    // Ajouter à la scène
    scene.add.existing(this);

    this.createReel();
    this.createMask();
  }

  createReel() {
    // Créer plus de symboles pour l'effet de défilement
    const totalSymbols = SLOT_CONFIG.ROWS + 4; // Symboles visibles + buffer

    for (let i = 0; i < totalSymbols; i++) {
      const symbolKeys = Object.keys(SYMBOLS);
      const randomSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)].toLowerCase();

      const symbol = new Symbol(
        this.scene,
        0,
        (i - 2) * SLOT_CONFIG.SYMBOL_SIZE,
        randomSymbol
      );

      this.symbols.push(symbol);
      this.add(symbol);
    }
  }

  createMask() {
    // Masque pour cacher les symboles hors zone visible
    const maskHeight = SLOT_CONFIG.ROWS * SLOT_CONFIG.SYMBOL_SIZE;
    const mask = this.scene.make.graphics();
    mask.fillStyle(0xffffff);
    mask.fillRect(
      this.x - SLOT_CONFIG.SYMBOL_SIZE / 2,
      this.y - maskHeight / 2,
      SLOT_CONFIG.SYMBOL_SIZE,
      maskHeight
    );

    this.setMask(mask.createGeometryMask());
  }

  spin(duration, targetSymbols) {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.targetSymbols = targetSymbols;
    this.spinSpeed = 20; // Vitesse initiale

    // Animation de décélération
    this.scene.tweens.add({
      targets: this,
      spinSpeed: 0,
      duration: duration + (this.reelIndex * 200), // Décalage pour chaque reel
      ease: 'Power3.easeOut',
      onUpdate: this.updateSpin.bind(this),
      onComplete: this.stopSpin.bind(this)
    });
  }

  updateSpin() {
    if (!this.isSpinning) return;

    // Déplacer tous les symboles vers le bas
    this.symbols.forEach(symbol => {
      symbol.y += this.spinSpeed;

      // Repositionner les symboles qui sortent de l'écran
      if (symbol.y > SLOT_CONFIG.SYMBOL_SIZE * 2.5) {
        symbol.y -= SLOT_CONFIG.SYMBOL_SIZE * this.symbols.length;

        // Changer le symbole aléatoirement pendant le spin
        if (this.spinSpeed > 5) {
          const symbolKeys = Object.keys(SYMBOLS);
          const randomSymbol = symbolKeys[Math.floor(Math.random() * symbolKeys.length)].toLowerCase();
          symbol.changeSymbol(randomSymbol);
        }
      }
    });
  }

  stopSpin() {
    this.isSpinning = false;
    this.spinSpeed = 0;

    // Positionner les symboles finaux
    this.setFinalSymbols();

    // Son d'arrêt
    this.scene.sound.play('reel-stop', { volume: 0.3 });

    // Effet visuel d'arrêt
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.95,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  setFinalSymbols() {
    // Positionner les 3 symboles visibles avec les résultats finaux
    for (let i = 0; i < SLOT_CONFIG.ROWS; i++) {
      if (this.targetSymbols && this.targetSymbols[i]) {
        this.symbols[i + 2].changeSymbol(this.targetSymbols[i]);
        this.symbols[i + 2].y = (i - 1) * SLOT_CONFIG.SYMBOL_SIZE;
      }
    }
  }

  getVisibleSymbols() {
    return this.symbols.slice(2, 2 + SLOT_CONFIG.ROWS).map(symbol => symbol.symbolKey);
  }

  highlightWinningSymbols(positions) {
    positions.forEach(pos => {
      if (pos >= 0 && pos < SLOT_CONFIG.ROWS) {
        this.symbols[pos + 2].animateWin();
      }
    });
  }
}
