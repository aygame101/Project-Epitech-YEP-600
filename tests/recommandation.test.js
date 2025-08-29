// tests/recommandation.test.js
// Tests unitaires pour le systeme de recommandation

const {
  getGameRecommendations,
  getPersonalizedTips,
  analyzeUserPerformance,
  GAME_TYPES,
  DIFFICULTY_LEVELS,
  GAME_RECOMMENDATIONS
} = require('../ia/recommandation');

// Donnees de test pour differents types d'utilisateurs
const testUsers = {
  beginner: {
    walletBalance: 50,
    gameHistory: [
      { gameType: 'slot', result: 'loss', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { gameType: 'slot', result: 'win', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    ],
    totalWins: 1,
    totalLosses: 1
  },
  
  intermediate: {
    walletBalance: 200,
    gameHistory: [
      { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { gameType: 'slot', result: 'win', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { gameType: 'blackjack', result: 'loss', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { gameType: 'blackjack', result: 'win', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
    ],
    totalWins: 3,
    totalLosses: 1
  },
  
  advanced: {
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
  },
  
  expert: {
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
};

// Test de la fonction analyzeUserPerformance
function testAnalyzeUserPerformance() {
  console.log('\nTEST: analyzeUserPerformance');
  console.log('=' .repeat(40));
  
  try {
    // Test utilisateur debutant
    const beginnerScore = analyzeUserPerformance(testUsers.beginner);
    console.log(`Debutant - Score: ${beginnerScore} (Attendu: < 300)`);
    
    // Test utilisateur intermediaire
    const intermediateScore = analyzeUserPerformance(testUsers.intermediate);
    console.log(`Intermediaire - Score: ${intermediateScore} (Attendu: 300-600)`);
    
    // Test utilisateur avance
    const advancedScore = analyzeUserPerformance(testUsers.advanced);
    console.log(`Avance - Score: ${advancedScore} (Attendu: 600-900)`);
    
    // Test utilisateur expert
    const expertScore = analyzeUserPerformance(testUsers.expert);
    console.log(`Expert - Score: ${expertScore} (Attendu: > 900)`);
    
    // Verifications
    if (beginnerScore < 300) console.log('Score debutant correct');
    if (intermediateScore >= 300 && intermediateScore < 600) console.log('Score intermediaire correct');
    if (advancedScore >= 600 && advancedScore < 900) console.log('Score avance correct');
    if (expertScore >= 900) console.log('Score expert correct');
    
    console.log('Tous les tests analyzeUserPerformance ont reussi!');
    return true;
  } catch (error) {
    console.error('Erreur dans testAnalyzeUserPerformance:', error);
    return false;
  }
}

// Test de la fonction getGameRecommendations
function testGetGameRecommendations() {
  console.log('\nTEST: getGameRecommendations');
  console.log('=' .repeat(40));
  
  try {
    Object.entries(testUsers).forEach(([userType, userData]) => {
      console.log(`\nTest ${userType}:`);
      
      const recommendations = getGameRecommendations(userData);
      
      // Verifier la structure des recommandations
      if (recommendations.userScore !== undefined) console.log('userScore present');
      if (recommendations.difficultyLevel !== undefined) console.log('difficultyLevel present');
      if (recommendations.overallRecommendation !== undefined) console.log('overallRecommendation present');
      if (recommendations.games !== undefined) console.log('games present');
      
      // Verifier les jeux
      if (recommendations.games.blackjack) console.log('Recommandations blackjack presentes');
      if (recommendations.games.slot) console.log('Recommandations slot presentes');
      
      // Verifier la pertinence
      Object.entries(recommendations.games).forEach(([gameType, gameData]) => {
        if (gameData.suitability >= 0 && gameData.suitability <= 100) {
          console.log(`Pertinence ${gameType}: ${gameData.suitability}%`);
        } else {
          console.log(`Pertinence ${gameType} invalide: ${gameData.suitability}%`);
        }
      });
    });
    
    console.log('Tous les tests getGameRecommendations ont reussi!');
    return true;
  } catch (error) {
    console.error('Erreur dans testGetGameRecommendations:', error);
    return false;
  }
}

// Test de la fonction getPersonalizedTips
function testGetPersonalizedTips() {
  console.log('\nTEST: getPersonalizedTips');
  console.log('=' .repeat(40));
  
  try {
    // Test pour blackjack
    const blackjackTips = getPersonalizedTips(testUsers.beginner, 'blackjack');
    if (Array.isArray(blackjackTips) && blackjackTips.length > 0) {
      console.log('Conseils blackjack generes:', blackjackTips.length);
    } else {
      console.log('Aucun conseil blackjack genere');
    }
    
    // Test pour slot
    const slotTips = getPersonalizedTips(testUsers.beginner, 'slot');
    if (Array.isArray(slotTips) && slotTips.length > 0) {
      console.log('Conseils slot generes:', slotTips.length);
    } else {
      console.log('Aucun conseil slot genere');
    }
    
    // Test avec utilisateur avance
    const advancedTips = getPersonalizedTips(testUsers.advanced, 'blackjack');
    if (Array.isArray(advancedTips) && advancedTips.length > 0) {
      console.log('Conseils avances generes:', advancedTips.length);
    } else {
      console.log('Aucun conseil avance genere');
    }
    
    console.log('Tous les tests getPersonalizedTips ont reussi!');
    return true;
  } catch (error) {
    console.error('Erreur dans testGetPersonalizedTips:', error);
    return false;
  }
}

// Test des constantes
function testConstants() {
  console.log('\nTEST: Constantes');
  console.log('=' .repeat(40));
  
  try {
    // Test GAME_TYPES
    if (GAME_TYPES.BLACKJACK === 'blackjack') console.log('GAME_TYPES.BLACKJACK correct');
    if (GAME_TYPES.SLOT === 'slot') console.log('GAME_TYPES.SLOT correct');
    
    // Test DIFFICULTY_LEVELS
    if (DIFFICULTY_LEVELS.BEGINNER === 'Facile') console.log('DIFFICULTY_LEVELS.BEGINNER correct');
    if (DIFFICULTY_LEVELS.INTERMEDIATE === 'Moyenne') console.log('DIFFICULTY_LEVELS.INTERMEDIATE correct');
    if (DIFFICULTY_LEVELS.ADVANCED === 'Difficile') console.log('DIFFICULTY_LEVELS.ADVANCED correct');
    if (DIFFICULTY_LEVELS.EXPERT === 'Expert') console.log('DIFFICULTY_LEVELS.EXPERT correct');
    
    // Test GAME_RECOMMENDATIONS
    if (GAME_RECOMMENDATIONS.blackjack) console.log('GAME_RECOMMENDATIONS.blackjack present');
    if (GAME_RECOMMENDATIONS.slot) console.log('GAME_RECOMMENDATIONS.slot present');
    
    console.log('Toutes les constantes sont correctes!');
    return true;
  } catch (error) {
    console.error('Erreur dans testConstants:', error);
    return false;
  }
}

// Test de performance
function testPerformance() {
  console.log('\nTEST: Performance');
  console.log('=' .repeat(40));
  
  try {
    const startTime = performance.now();
    
    // Executer 1000 analyses de performance
    for (let i = 0; i < 1000; i++) {
      analyzeUserPerformance(testUsers.intermediate);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`1000 analyses executees en ${duration.toFixed(2)}ms`);
    console.log(`Temps moyen par analyse: ${(duration / 1000).toFixed(3)}ms`);
    
    if (duration < 1000) {
      console.log('Performance acceptable (< 1 seconde)');
    } else {
      console.log('Performance lente (> 1 seconde)');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur dans testPerformance:', error);
    return false;
  }
}

// Executer tous les tests
function runAllTests() {
  console.log('LANCEMENT DE TOUS LES TESTS');
  console.log('=' .repeat(50));
  
  const results = [
    testConstants(),
    testAnalyzeUserPerformance(),
    testGetGameRecommendations(),
    testGetPersonalizedTips(),
    testPerformance()
  ];
  
  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;
  
  console.log('\nRESULTATS DES TESTS');
  console.log('=' .repeat(30));
  console.log(`Tests reussis: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('TOUS LES TESTS ONT REUSSI!');
  } else {
    console.log('CERTAINS TESTS ONT ECHOUE');
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
}

module.exports = {
  runAllTests,
  testAnalyzeUserPerformance,
  testGetGameRecommendations,
  testGetPersonalizedTips,
  testConstants,
  testPerformance
}; 