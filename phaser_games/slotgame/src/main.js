import { Preload } from './scenes/Preload.js';
import { Slot }    from './scenes/Slot.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [ Preload, Slot ]
};

new Phaser.Game(config);
