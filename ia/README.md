# 🎯 Système de Recommandation pour Jeux

Ce système analyse les performances des utilisateurs et génère des recommandations personnalisées pour les jeux de casino.

## ✨ Fonctionnalités

- **Analyse des performances** basée sur le solde, l'historique et la progression
- **Recommandations personnalisées** pour chaque type de jeu
- **Niveaux de difficulté** adaptatifs (Facile, Moyenne, Difficile, Expert)
- **Conseils stratégiques** spécifiques à chaque jeu
- **Calcul de pertinence** pour chaque recommandation

## 🔍 Facteurs d'Analyse

### Score Utilisateur
- **Solde du portefeuille** (20% du score max)
- **Historique des jeux** (taux de victoire, fréquence)
- **Progression du joueur** (ratio victoires/défaites)
- **Activité récente** (7 derniers jours)

### Niveaux de Difficulté
- **Facile** : Score < 300 (Débutants)
- **Moyenne** : Score 300-600 (Intermédiaires)
- **Difficile** : Score 600-900 (Avancés)
- **Expert** : Score > 900 (Experts)

## 🎮 Jeux Supportés

### Blackjack
- **Difficulté** : Moyenne
- **Mise recommandée** : 5€ - 100€
- **Stratégie** : Règles de base et gestion de la banque
- **Conseils** : Éviter l'assurance, doubler sur 11

### Machine à Sous
- **Difficulté** : Facile
- **Mise recommandée** : 1€ - 50€
- **Stratégie** : Gestion du budget et plaisir
- **Conseils** : Limites de perte, pauses régulières

## 🚀 Installation

```bash
# Cloner le projet
git clone [url-du-projet]

# Installer les dépendances
npm install

# Configurer Firebase
cp config/firebaseConfig.example.js config/firebaseConfig.js
# Éditer avec vos clés Firebase
```

## 📱 Utilisation

### Composant React Native
```javascript
import { GameRecommendationComponent } from './components/GameRecommendationComponent';

// Utilisation dans votre app
<GameRecommendationComponent />
```

### Service de Statistiques
```javascript
import { getUserGameStats, recordGameResult } from './routes/gameStatsService';

// Enregistrer un résultat de jeu
await recordGameResult(userId, {
  gameType: 'blackjack',
  result: 'win',
  betAmount: 10,
  winnings: 20
});

// Récupérer les statistiques
const stats = await getUserGameStats(userId);
```

### API de Recommandation
```javascript
import { getGameRecommendations, getPersonalizedTips } from './ia/recommandation';

// Obtenir des recommandations
const recommendations = getGameRecommendations(userData);

// Conseils personnalisés
const tips = getPersonalizedTips(userData, 'blackjack');
```

## 🏗️ Architecture

```
ia/
├── recommandation.js          # Moteur de recommandation
├── demo.js                    # Démonstrations et tests
└── README.md                  # Documentation

components/
├── GameDashboard.tsx          # Tableau de bord principal
├── GameRecommendationComponent.tsx # Composant de recommandation
├── routes/
│   ├── gameStatsService.js    # Service des statistiques
│   ├── firebaseService.js     # Service Firebase
│   └── userOperations.js      # Opérations utilisateur
└── styles/
    ├── GameDashboard.styles.js
    ├── GameRecommendationComponent.styles.js
    └── index.js
```

## 🔥 Services Firebase

### Collections
- **users** : Profils utilisateur
- **userGameStats** : Statistiques de jeu
- **gameHistory** : Historique des parties

### Fonctions Cloud
- **dailyBonus** : Bonus quotidien automatique

## 📊 Structure des Données

### Données Utilisateur
```javascript
{
  userId: string,
  username: string,
  email: string,
  walletBalance: number,
  createdAt: timestamp
}
```

### Statistiques de Jeu
```javascript
{
  totalGames: number,
  totalWins: number,
  totalLosses: number,
  totalDraws: number,
  totalWinnings: number,
  totalLossesAmount: number,
  averageWin: number,
  averageLoss: number,
  gameTypeStats: {
    [gameType]: {
      gamesPlayed: number,
      wins: number,
      losses: number,
      draws: number,
      winRate: number
    }
  }
}
```

## 🧪 Tests et Démonstration

### Démo Interactive
```javascript
import { runDemo, testUser, compareUsers } from './ia/demo';

// Lancer la démo complète
runDemo();

// Tester un utilisateur
const userData = { walletBalance: 500, gameHistory: [...] };
testUser(userData);

// Comparer deux utilisateurs
compareUsers(user1Data, user2Data);
```

### Tests Automatisés
```bash
# Lancer les tests
npm test

# Tests spécifiques
node test-runner.js
```

## 🎨 Personnalisation

### Ajouter un Nouveau Jeu
```javascript
// Dans recommandation.js
const GAME_RECOMMENDATIONS = {
  // ... jeux existants
  poker: {
    name: 'Poker',
    description: 'Jeu de cartes stratégique',
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    betRange: { min: 10, max: 200 },
    strategy: 'Gestion de la main et bluff',
    tips: ['Apprendre les mains', 'Gérer la position']
  }
};
```

### Modifier les Algorithmes
```javascript
// Dans recommandation.js
function analyzeUserPerformance(userData) {
  let score = 0;
  
  // Ajouter vos propres facteurs
  if (userData.vipLevel) {
    score += userData.vipLevel * 50;
  }
  
  // ... reste de la logique
  return score;
}
```

## 🔮 Améliorations Futures

- [ ] **Machine Learning** pour des recommandations plus précises
- [ ] **Analyse des tendances** et prédictions
- [ ] **Intégration de plus de jeux** (Roulette, Poker, etc.)
- [ ] **Système de badges** et récompenses
- [ ] **Analytics avancés** pour les développeurs
- [ ] **API REST** pour intégration externe

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation Firebase

---

**Développé avec ❤️ pour améliorer l'expérience des joueurs de casino** 