// ia/demo.js
// Demonstration du systeme de recommandation

const { getGameRecommendations, getPersonalizedTips, analyzeUserPerformance } = require('./recommandation');

// Utilisateurs de demonstration avec differents profils
const demoUsers = [
  {
    name: 'Debutant',
    data: {
      walletBalance: 50,
      gameHistory: [
        { gameType: 'slot', result: 'loss', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { gameType: 'slot', result: 'win', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      ],
      totalWins: 1,
      totalLosses: 1
    }
  },
  {
    name: 'Intermediaire',
    data: {
      walletBalance: 200,
      gameHistory: [
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { gameType: 'slot', result: 'win', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'loss', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
      ],
      totalWins: 3,
      totalLosses: 1
    }
  },
  {
    name: 'Avance',
    data: {
      walletBalance: 500,
      gameHistory: [
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { gameType: 'slot', result: 'win', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'loss', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { gameType: 'slot', result: 'win', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }
      ],
      totalWins: 5,
      totalLosses: 1
    }
  },
  {
    name: 'Expert',
    data: {
      walletBalance: 1000,
      gameHistory: [
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { gameType: 'slot', result: 'win', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        { gameType: 'slot', result: 'win', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { gameType: 'blackjack', result: 'loss', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }
      ],
      totalWins: 7,
      totalLosses: 1
    }
  }
];

// Afficher les recommandations pour un utilisateur
function displayRecommendations(userName, userData) {
  console.log(`\nRECOMMANDATIONS POUR ${userName.toUpperCase()}`);
  console.log('='.repeat(50));

  const recommendations = getGameRecommendations(userData);

  console.log(`Score utilisateur: ${recommendations.userScore}`);
  console.log(`Niveau: ${recommendations.difficultyLevel}`);
  console.log(`Conseil general: ${recommendations.overallRecommendation}`);

  console.log('\nRecommandations par jeu:');
  Object.entries(recommendations.games).forEach(([gameType, gameData]) => {
    console.log(`\n  ${gameType === 'blackjack' ? 'B' : 'S'} ${gameData.name}`);
    console.log(`    Pertinence: ${gameData.suitability}%`);
    console.log(`    Difficulte: ${gameData.difficulty}`);
    console.log(`    Mise recommandee: ${gameData.betRange.min}€ - ${gameData.betRange.max}€`);
    console.log(`    Strategie: ${gameData.strategy}`);

    const tips = getPersonalizedTips(userData, gameType);
    console.log(`    Conseils:`);
    tips.forEach(tip => console.log(`      - ${tip}`));
  });
}

// Executer la demonstration complete
function runDemo() {
  console.log('DEMONSTRATION DU SYSTEME DE RECOMMANDATION');
  console.log('='.repeat(60));

  demoUsers.forEach(user => {
    displayRecommendations(user.name, user.data);
  });

  console.log('\nDemonstration terminee!');
}

// Tester un utilisateur specifique
function testUser(userData) {
  console.log('\nTEST D\'UN UTILISATEUR SPECIFIQUE');
  console.log('='.repeat(50));

  const score = analyzeUserPerformance(userData);
  console.log(`Score calcule: ${score}`);

  const recommendations = getGameRecommendations(userData);
  console.log(`Niveau recommande: ${recommendations.difficultyLevel}`);

  return recommendations;
}

// Comparer deux utilisateurs
function compareUsers(user1Data, user2Data) {
  console.log('\nCOMPARAISON DE DEUX UTILISATEURS');
  console.log('='.repeat(50));

  const score1 = analyzeUserPerformance(user1Data);
  const score2 = analyzeUserPerformance(user2Data);

  console.log(`Utilisateur 1 - Score: ${score1}`);
  console.log(`Utilisateur 2 - Score: ${score2}`);

  if (score1 > score2) {
    console.log('L\'utilisateur 1 a un meilleur score');
  } else if (score2 > score1) {
    console.log('L\'utilisateur 2 a un meilleur score');
  } else {
    console.log('Les deux utilisateurs ont le meme score');
  }

  return { score1, score2 };
}

module.exports = {
  runDemo,
  testUser,
  compareUsers,
  demoUsers
};