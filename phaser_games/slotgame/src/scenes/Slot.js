export class Slot extends Phaser.Scene {
  constructor() {
    super('Slot');
    this.reels       = [];
    this.symbolKeys  = [];
    this.visibleRows = 3;
    this.loopCount   = 3;      // tours complets avant arrêt
    this.symbolSize  = 128;    // taille à l’écran de chaque symbole
  }

  create() {
    const { width, height } = this.scale;
    this.originalY = height / 2;

    // 1) Affiche le background plein écran
    this.add.image(width/2, height/2, 'background')
      .setDisplaySize(width, height);

    // 2) Affiche le cadre au-dessus des rouleaux
    this.add.image(width/2, height/2, 'frame');

    // 3) Prépare les clés des symboles
    this.symbolKeys = this.scene.get('Preload').symbolKeys;

    // 4) Crée 5 rouleaux
    const spacingX = 150;
    const startX   = width/2 - 2 * spacingX;
    for (let i = 0; i < 5; i++) {
      const container = this.add.container(startX + i*spacingX, this.originalY);
      for (let row = 0; row < this.visibleRows; row++) {
        const key = Phaser.Utils.Array.GetRandom(this.symbolKeys);
        const img = this.add.image(
          0,
          (row - 1) * this.symbolSize,
          key
        ).setDisplaySize(this.symbolSize, this.symbolSize);
        container.add(img);
      }
      this.reels.push(container);
    }

    // 5) Bouton Spin
    this.spinButton = this.add.image(width/2, height - 100, 'spinButton')
      .setInteractive()
      .setScale(0.5)
      .on('pointerdown', () => this.spin());
  }

  spin() {
    this.spinButton.disableInteractive();

    this.reels.forEach((container, idx) => {
      // Choix d’un décalage aléatoire dans la boucle finale
      const extraStop = Phaser.Math.Between(0, this.symbolKeys.length - 1);
      const totalSteps = this.loopCount * this.symbolKeys.length
                       + this.visibleRows
                       + extraStop;
      const distance = totalSteps * this.symbolSize;

      this.tweens.add({
        targets: container,
        y: `+=${distance}`,
        duration: 1000 + idx * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          // Remise à la position d’origine
          container.y = this.originalY;

          // Mise à jour aléatoire des textures
          container.iterate(child => {
            const newKey = Phaser.Utils.Array.GetRandom(this.symbolKeys);
            child.setTexture(newKey);
          });

          // Quand le dernier rouleau s’arrête…
          if (idx === this.reels.length - 1) {
            this.spinButton.setInteractive();
            this.showResult();
          }
        }
      });
    });
  }

  showResult() {
    // Récupère les symboles visibles par rouleau
    const results = this.reels.map(c =>
      c.list.map(img => img.texture.key)
    );
    console.log('Résultats:', results);
    // → ici : calculer vos gains selon vos paylines…
  }
}
