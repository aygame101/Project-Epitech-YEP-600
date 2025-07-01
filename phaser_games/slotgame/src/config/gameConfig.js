export const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'phaser-game',
  backgroundColor: '#2c3e50',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 240
    },
    max: {
      width: 1600,
      height: 1200
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

export const SYMBOLS = {
  CHERRY: { id: 'cherry', value: 10, rarity: 0.2 },
  LEMON: { id: 'lemon', value: 15, rarity: 0.18 },
  ORANGE: { id: 'orange', value: 20, rarity: 0.16 },
  PLUM: { id: 'plum', value: 25, rarity: 0.14 },
  BELL: { id: 'bell', value: 50, rarity: 0.12 },
  BAR: { id: 'bar', value: 100, rarity: 0.1 },
  SEVEN: { id: 'seven', value: 500, rarity: 0.06 },
  DIAMOND: { id: 'diamond', value: 1000, rarity: 0.04 }
};

export const SLOT_CONFIG = {
  REELS: 5,
  ROWS: 3,
  SYMBOL_SIZE: 100,
  SPIN_DURATION: 2000,
  PAYLINES: [
    [1,1,1,1,1], // Ligne du milieu
    [0,0,0,0,0], // Ligne du haut
    [2,2,2,2,2], // Ligne du bas
    [0,1,2,1,0], // V inversé
    [2,1,0,1,2]  // V normal
  ]
};
