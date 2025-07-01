import { SlotMachine } from '../objects/SlotMachine.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Fond d'écran
    this.add.image(400, 300, 'background');

    // Créer la slot machine
    this.slotMachine = new SlotMachine(this, 400, 300);

    // Configuration de la communication avec React Native
    this.setupReactNativeCommunication();

    // Effets de particules pour les gains
    this.createParticleEffects();
  }

  setupReactNativeCommunication() {
    // Écouter les messages de React Native
    window.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleReactNativeMessage(message);
      } catch (error) {
        console.error('Erreur parsing message:', error);
      }
    });
  }

  handleReactNativeMessage(message) {
    switch (message.action) {
      case 'updateBalance':
        this.slotMachine.balance = message.data.balance;
        this.slotMachine.updateUI();
        break;
      case 'setBet':
        this.slotMachine.setBet(message.data.amount);
        break;
      case 'spin':
        this.slotMachine.spin();
        break;
    }
  }

  createParticleEffects() {
    // Effet de pièces pour les gros gains
    this.coinEmitter = this.add.particles(400, 200, 'coin', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.3, end: 0 },
      lifespan: 1000,
      emitting: false
    });
  }

  triggerWinEffect(amount) {
    if (amount > 100) {
      this.coinEmitter.start();
      this.time.delayedCall(2000, () => {
        this.coinEmitter.stop();
      });
    }
  }
}
