# Epi Gamble

## FR — Vue d'ensemble
Epi Gamble est une application mobile de casino social (aucun argent réel). L’app comprend trois jeux (Machines à sous, Blackjack, Roulette), un chat texte, un bonus quotidien avec Pile ou Face (double ou rien), un leaderboard global (classement par jetons) et des statistiques joueur.

- **Stack** : React Native (TypeScript/JavaScript), Phaser (jeux via WebView/script), Firebase (Auth, Firestore, Cloud Functions, Storage).
- **Plateformes** : iOS et Android.
- **Lancement** : `npx expo start`

## FR — Prérequis
- Node.js LTS
- Expo CLI (via `npx`)
- Compte Firebase (projet configuré : Auth activé, Firestore, Storage, Cloud Functions)
- Fichier de configuration Firebase côté app (variables d’environnement ou fichier de config)

## FR — Installation & lancement
1. Installer les dépendances :
   `npm install`
2. Configurer Firebase (voir `app/firebaseConfig.ts` ou variables d’environnement).
3. Démarrer :
   `npx expo start`
4. Scanner le QR code (Expo Go) ou lancer un émulateur.

## FR — Structure (exemple)
```
/components
  /games
    /roulette/phaserScript.js
    /slot/...
    /blackjack/...

## FR — Bonnes pratiques UX
- Cibles tactiles ≥ 44×44 pt ; hiérarchie claire ; feedback press.
- Clavier iOS : `keyboardDismissMode="on-drag"`, `keyboardShouldPersistTaps="handled"`.
- Chat : auto-scroll, saisie stable, limites de longueur.
- Chargements sobres et transitions douces lors des updates Firestore.

---

## EN — Overview
Epi Gamble is a social casino mobile app (no real money). It includes three games (Slots, Blackjack, Roulette), a text chat, a daily bonus with Heads-or-Tails (double or nothing), a global leaderboard (by tokens), and player statistics.

- **Stack**: React Native (TypeScript/JavaScript), Phaser (games via WebView/script), Firebase (Auth, Firestore, Cloud Functions, Storage).
- **Platforms**: iOS and Android.
- **Start**: `npx expo start`

## EN — Requirements
- Node.js LTS
- Expo CLI (via `npx`)
- Firebase project (Auth enabled, Firestore, Storage, Cloud Functions)
- App Firebase config (env vars or config file)

## EN — Setup & Run
1. Install dependencies:
   `npm install`
2. Configure Firebase (see `app/firebaseConfig.ts` or environment variables).
3. Run:
   `npx expo start`
4. Scan the QR code (Expo Go) or use an emulator.

## EN — Example structure
```
/components
  /games
    /roulette/phaserScript.js      // Phaser script injected as a string
    /slot/...
    /blackjack/...

## EN — UX notes
- Touch targets ≥ 44×44 pt; clear visual hierarchy; pressed feedback.
- iOS keyboard: `keyboardDismissMode="on-drag"`, `keyboardShouldPersistTaps="handled"`.
- Chat: auto-scroll, stable input, message length limits.
- Subtle loading and transitions on Firestore updates.