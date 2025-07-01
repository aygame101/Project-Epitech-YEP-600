export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Barre de progression
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222);
    progressBox.fillRect(240, 270, 320, 50);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    // Chargement des assets
    this.load.image('background', 'assets/images/background.jpg');
    this.load.image('slot-frame', 'assets/images/slot-frame.png');
    this.load.image('spin-button', 'assets/images/spin-button.png');

    // Symboles
    Object.keys(SYMBOLS).forEach(symbol => {
      this.load.image(symbol.toLowerCase(), `assets/images/symbols/${symbol.toLowerCase()}.png`);
    });

    // Sons
    this.load.audio('spin-sound', 'assets/sounds/spin.mp3');
    this.load.audio('win-sound', 'assets/sounds/win.mp3');
    this.load.audio('reel-stop', 'assets/sounds/reel-stop.mp3');

    // Mise à jour de la barre de progression
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create() {
    this.scene.start('GameScene');
  }
}
