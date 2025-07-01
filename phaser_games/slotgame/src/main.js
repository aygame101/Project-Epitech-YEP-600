import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { GameScene } from './scenes/GameScene.js';

// Configuration des scènes
gameConfig.scene = [PreloadScene, GameScene];

// Initialisation du jeu
const game = new Phaser.Game(gameConfig);

// Export pour utilisation externe
window.PhaserGame = game;
