export class Preload extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('frame',      'assets/slot-frame.png');
    this.load.image('spinButton', 'assets/spin-button.png');

    // 2) Symboles (fichiers 1024×1024 dans assets/symbols/)
    this.symbolKeys = [
      'bar','bell','cherry','diamond',
      'lemon','orange','plum','seven'
    ];
    this.symbolKeys.forEach(key =>
      this.load.image(key, `assets/symbols/${key}.png`)
    );
  }

  create() {
    this.scene.start('Slot');
  }
}
