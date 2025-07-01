export class Symbol extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, symbolKey) {
    super(scene, x, y, symbolKey);

    this.scene = scene;
    this.symbolKey = symbolKey;
    this.isAnimating = false;

    // Ajouter à la scène
    scene.add.existing(this);

    // Configuration
    this.setDisplaySize(SLOT_CONFIG.SYMBOL_SIZE, SLOT_CONFIG.SYMBOL_SIZE);
    this.setOrigin(0.5, 0.5);

    // Effets visuels
    this.setInteractive();
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onHoverOut, this);
  }

  onHover() {
    if (!this.isAnimating) {
      this.setTint(0xcccccc);
      this.setScale(1.1);
    }
  }

  onHoverOut() {
    if (!this.isAnimating) {
      this.clearTint();
      this.setScale(1);
    }
  }

  animateWin() {
    this.isAnimating = true;

    // Animation de victoire
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Power2',
      onComplete: () => {
        this.isAnimating = false;
        this.setScale(1);
      }
    });

    // Effet de brillance
    this.scene.tweens.add({
      targets: this,
      alpha: 0.7,
      duration: 150,
      yoyo: true,
      repeat: 4
    });
  }

  changeSymbol(newSymbolKey) {
    this.symbolKey = newSymbolKey;
    this.setTexture(newSymbolKey);
  }
}
