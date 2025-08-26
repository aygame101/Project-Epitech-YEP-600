// --- CONSTANTES ---
export const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
export const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACKS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
export const COLUMNS = [
  NUMBERS.filter(n => n !== 0 && n % 3 === 1),
  NUMBERS.filter(n => n !== 0 && n % 3 === 2),
  NUMBERS.filter(n => n !== 0 && n % 3 === 0)
];
export const DOZENS = [
  NUMBERS.filter(n => n >= 1 && n <= 12),
  NUMBERS.filter(n => n >= 13 && n <= 24),
  NUMBERS.filter(n => n >= 25 && n <= 36)
];
export const BET_TYPES = [
  { id: 'number', label: 'Numéro', payout: 35, cells: NUMBERS },
  { id: 'red', label: 'Rouge', payout: 1, cells: REDS },
  { id: 'black', label: 'Noir', payout: 1, cells: BLACKS },
  { id: 'even', label: 'Pair', payout: 1, cells: NUMBERS.filter(n => n !== 0 && n % 2 === 0) },
  { id: 'odd', label: 'Impair', payout: 1, cells: NUMBERS.filter(n => n % 2 === 1) },
  { id: 'column1', label: 'Colonne 1', payout: 2, cells: COLUMNS[0] },
  { id: 'column2', label: 'Colonne 2', payout: 2, cells: COLUMNS[1] },
  { id: 'column3', label: 'Colonne 3', payout: 2, cells: COLUMNS[2] },
  { id: 'dozen1', label: 'Douzaine 1', payout: 2, cells: DOZENS[0] },
  { id: 'dozen2', label: 'Douzaine 2', payout: 2, cells: DOZENS[1] },
  { id: 'dozen3', label: 'Douzaine 3', payout: 2, cells: DOZENS[2] },
];

// --- ÉTAT ---
export let solde = 1000;
export let historique = [];
export let bets = [];
export let lastBets = [];
export let selectedChip = 1;

// --- LOGIQUE DE MISE ---
export function totalBet() {
  return bets.reduce((sum, b) => sum + (b.amount || 0), 0);
}
export function validateBet() {
  return solde >= totalBet();
}

// --- LOGIQUE DE JEU ---
export function spinRoulette() {
  // Tirage aléatoire du numéro gagnant
  const winningNumber = Math.floor(Math.random() * 37);
  historique.push(winningNumber);
  if (historique.length > 20) historique = historique.slice(-20);

  // Calcul du gain
  const gain = calcGain(winningNumber);

  // Mise à jour du solde
  solde -= totalBet();
  solde += gain;

  // Sauvegarde des mises pour "Répéter"
  lastBets = JSON.parse(JSON.stringify(bets));
  bets = [];

  return { winningNumber, gain, solde };
}

export function calcGain(num) {
  let gain = 0;
  bets.forEach(b => {
    let bt = BET_TYPES.find(bt => bt.id === b.type);
    if (b.type === 'number' && b.value === num) gain += b.amount * 36;
    else if (bt && bt.cells.includes(num)) gain += b.amount * (bt.payout + 1);
  });
  return gain;
}

// --- Fonctions utilitaires ---
export function addBet(type, value, amount) {
  bets.push({ type, value, amount });
}

export function clearBets() {
  bets = [];
}

export function repeatBets() {
  if (lastBets.length) bets = JSON.parse(JSON.stringify(lastBets));
}

export function setSolde(newSolde) {
  solde = newSolde;
}

export function setSelectedChip(chip) {
  selectedChip = chip;
}

// --- INITIALISATION ---
import { setSolde } from './roulette.js';

let solde = typeof window.initialBalance !== 'undefined' ? window.initialBalance : 1000;
setSolde(solde);
window.addBet = addBet;