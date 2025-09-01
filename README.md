# EpiGamble

## Français

### Description
EpiGamble est une application mobile de type casino développée avec React Native et Expo. Elle propose plusieurs mini-jeux (machine à sous, blackjack, roulette), un système de bonus quotidien, un chat intégré et un classement basé sur les gains des joueurs. Le projet utilise Firebase pour l'authentification, la base de données en temps réel et les fonctions cloud.

### Fonctionnalités principales
- Machine à sous avec animations et gains aléatoires
- Blackjack avec logique de mise et calcul des scores
- Roulette avec paris et résultats visuels
- Bonus quotidien avec un système de pile ou face (double ou rien)
- Classement (scoreboard)
- Statistiques du joueur (victoires, défaites, ratio)
- Chat intégré entre utilisateurs
- Persistance et sécurité des données via Firebase

### Prérequis
- Node.js LTS
- Expo CLI (installé via npx)
- Compte Firebase configuré (Auth, Firestore, Storage, Functions)

### Installation et lancement
1. Cloner ce dépôt
```bash
git clone https://github.com/aygame101/Project-Epitech-YEP-600.git
cd Project-Epitech-YEP-600
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer l'application en mode développement
```bash
npx expo start
```

4. Scanner le QR code avec l'application Expo Go (iOS/Android) ou lancer un émulateur.

### Structure du projet
```
/components       # Composants React Native et écrans de jeux
/components/games # Logique et rendu des jeux (slot, blackjack, roulette)
/config           # Configuration Firebase et fonctions utilitaires
/constants        # Constantes globales (types de jeux, niveaux, UI)
/hooks            # Hooks personnalisés (gestion clavier, etc.)
/tests            # Tests unitaires et d'intégration avec Jest
/assets           # Images, sons, ressources graphiques
app.json          # Configuration Expo
```

### Tests
Les tests sont écrits avec Jest et react-test-renderer.
Pour exécuter les tests :
```bash
npm test
```

### Sécurité
- Aucun argent réel n'est utilisé, il s'agit d'un projet éducatif
- Les données sensibles sont protégées via les règles Firebase
- Les identifiants Firebase doivent être fournis via un fichier de configuration ou des variables d'environnement

---

## English

### Description
EpiGamble is a social casino mobile application developed with React Native and Expo. It provides several mini-games (slot machine, blackjack, roulette), a daily bonus system, an integrated chat, and a global leaderboard based on players' earnings. The project uses Firebase for authentication, real-time database, and cloud functions.

### Key Features
- Slot machine with animations and random winnings
- Blackjack with betting logic and score calculation
- Roulette with betting options and visual results
- Daily bonus with a coin flip (double or nothing)
- Global leaderboard
- Player statistics (wins, losses, ratio)
- Integrated chat between users
- Data persistence and security with Firebase

### Requirements
- Node.js LTS
- Expo CLI (via npx)
- Firebase project configured (Auth, Firestore, Storage, Functions)

### Installation and Run
1. Clone the repository
```bash
git clone https://github.com/aygame101/Project-Epitech-YEP-600.git
cd Project-Epitech-YEP-600
```

2. Install dependencies
```bash
npm install
```

3. Run the app in development mode
```bash
npx expo start
```

4. Scan the QR code with the Expo Go app (iOS/Android) or run an emulator.

### Project Structure
```
/components       # React Native components and game screens
/components/games # Game logic and rendering (slot, blackjack, roulette)
/config           # Firebase configuration and utility functions
/constants        # Global constants (game types, levels, UI)
/hooks            # Custom hooks (keyboard handling, etc.)
/tests            # Unit and integration tests with Jest
/assets           # Images, sounds, graphic assets
app.json          # Expo configuration
```

### Tests
Tests are written with Jest and react-test-renderer.
To run the tests:
```bash
npm test
```

### Security
- No real money is used, this is an educational project
- Sensitive data is protected through Firebase rules
- Firebase credentials must be provided via a config file or environment variables
