// src/config/optimizations.js
export const optimizationConfig = {
  // Configuration pour de meilleures performances
  render: {
    antialias: false,
    pixelArt: false,
    roundPixels: true,
    transparent: false,
    powerPreference: 'high-performance'
  },
  
  // Gestion mémoire
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
      enableBody: false // Désactiver si pas nécessaire
    }
  },
  
  // Audio optimisé
  audio: {
    disableWebAudio: false,
    context: false,
    noAudio: false
  }
};

// Fonction d'optimisation des textures
export const optimizeTextures = (scene) => {
  // Réduire la qualité des textures sur les appareils bas de gamme
  const isLowEndDevice = navigator.hardwareConcurrency < 4;
  
  if (isLowEndDevice) {
    scene.textures.each((texture) => {
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    });
  }
};

// Pool d'objets pour les symboles
export class SymbolPool {
  constructor(scene, size = 50) {
    this.scene = scene;
    this.pool = [];
    this.activeObjects = [];
    
    // Pré-créer les objets
    for (let i = 0; i < size; i++) {
      const symbol = new Symbol(scene, 0, 0, 'cherry');
      symbol.setVisible(false);
      symbol.setActive(false);
      this.pool.push(symbol);
    }
  }
  
  get(x, y, symbolKey) {
    let symbol = this.pool.pop();
    
    if (!symbol) {
      symbol = new Symbol(this.scene, x, y, symbolKey);
    } else {
      symbol.setPosition(x, y);
      symbol.changeSymbol(symbolKey);
      symbol.setVisible(true);
      symbol.setActive(true);
    }
    
    this.activeObjects.push(symbol);
    return symbol;
  }
  
  release(symbol) {
    const index = this.activeObjects.indexOf(symbol);
    if (index > -1) {
      this.activeObjects.splice(index, 1);
      symbol.setVisible(false);
      symbol.setActive(false);
      this.pool.push(symbol);
    }
  }
}