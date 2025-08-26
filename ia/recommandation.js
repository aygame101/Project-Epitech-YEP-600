// ia/recommandation.js
// Systeme de recommandation pour jeux de casino

const GAME_TYPES = {
  BLACKJACK: 'blackjack',
  SLOT: 'slot',
  ROULETTE: 'roulette'
};

const DIFFICULTY_LEVELS = {
  BEGINNER: 'Facile',
  INTERMEDIATE: 'Moyenne',
  ADVANCED: 'Difficile',
  EXPERT: 'Expert'
};

const GAME_RECOMMENDATIONS = {
  blackjack: {
    name: 'Blackjack',
    description: 'Jeu de cartes strategique avec des probabilites calculables',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    betRange: { min: 5, max: 100 },
    strategy: 'Suivre les regles de base et gerer la banque',
    tips: [
      'Toujours rester sur 17+',
      'Tirer sur 16 ou moins',
      'Doubler sur 11',
      'Eviter l\'assurance'
    ]
  },

  slot: {
    name: 'Machine a Sous',
    description: 'Jeu de hasard avec des combinaisons de symboles',
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    betRange: { min: 1, max: 50 },
    strategy: 'Gerer le budget et jouer pour le plaisir',
    tips: [
      'Definir une limite de perte',
      'Choisir des machines avec un bon RTP',
      'Jouer avec des mises moderees',
      'Prendre des pauses regulieres'
    ]
  },

  roulette: {
    name: 'Roulette',
    description: 'Jeu de table basé sur le hasard avec gestion du risque par types de mises',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    betRange: { min: 1, max: 100 },
    strategy: 'Privilégier des mises extérieures (pair/impair, rouge/noir) pour lisser la variance',
    tips: [
      'Évite la martingale : gère ton budget, fixe une perte max',
      'Privilégie les mises à forte couverture (rouge/noir, pair/impair)',
      'Prévois des sessions courtes, fais des pauses'
    ]
  }
};

function getDifficultyLevel(userScore) {
  if (userScore < 300) return DIFFICULTY_LEVELS.BEGINNER;
  if (userScore < 600) return DIFFICULTY_LEVELS.INTERMEDIATE;
  if (userScore < 900) return DIFFICULTY_LEVELS.ADVANCED;
  return DIFFICULTY_LEVELS.EXPERT;
}

function analyzeUserPerformance(userData) {
  let score = 0;

  // Score base sur le solde du portefeuille
  if (userData.walletBalance) {
    score += Math.min(userData.walletBalance * 0.1, 200);
  }

  // Score base sur l'historique des jeux
  if (userData.gameHistory && userData.gameHistory.length > 0) {
    const recentGames = userData.gameHistory.slice(-10);
    const wins = recentGames.filter(game => game.result === 'win').length;
    const totalGames = recentGames.length;

    if (totalGames > 0) {
      const winRate = (wins / totalGames) * 100;
      score += winRate * 2;
    }

    score += totalGames * 5;
  }

  // Score base sur la frequence de jeu
  if (userData.gameHistory) {
    const gamesThisWeek = userData.gameHistory.filter(game => {
      const gameDate = new Date(game.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return gameDate > weekAgo;
    }).length;

    score += gamesThisWeek * 10;
  }

  // Score base sur la progression du joueur
  if (userData.totalWins && userData.totalLosses) {
    const totalGames = userData.totalWins + userData.totalLosses;
    if (totalGames > 0) {
      const progression = (userData.totalWins / totalGames) * 100;
      score += progression;
    }
  }

  return Math.round(score);
}

function calculateGameSuitability(gameType, userData, userScore) {
  let suitability = 50;

  if (gameType === GAME_TYPES.BLACKJACK) {
    // Blackjack favorise les joueurs avec une bonne strategie
    if (userData.gameHistory) {
      const blackjackGames = userData.gameHistory.filter(game => game.gameType === 'blackjack');
      if (blackjackGames.length > 0) {
        const blackjackWins = blackjackGames.filter(game => game.result === 'win').length;
        const blackjackWinRate = (blackjackWins / blackjackGames.length) * 100;
        suitability += blackjackWinRate - 50;
      }
    }

    // Ajuster selon le niveau de difficulte
    if (userScore > 600) suitability += 20;
    else if (userScore < 300) suitability -= 15;
  }

  if (gameType === GAME_TYPES.SLOT) {
    // Les slots sont plus accessibles aux debutants
    if (userScore < 400) suitability += 25;
    else if (userScore > 700) suitability -= 10;

    // Ajuster selon l'experience
    if (userData.gameHistory) {
      const slotGames = userData.gameHistory.filter(game => game.gameType === 'slot');
      if (slotGames.length > 5) suitability += 15;
    }
  }

  if (gameType === GAME_TYPES.ROULETTE) {
    // Joueurs intermédiaires/budget moyen : favorise la roulette
    if (userScore >= 300 && userScore <= 800) suitability += 15
    // Si l’historique contient de la roulette, ajuste via "win rate"
    if (userData.gameHistory) {
      const r = userData.gameHistory.filter(g => String(g.gameType).toLowerCase() === 'roulette')
      if (r.length > 0) {
        const wins = r.filter(g => g.result === 'win').length
        const rate = (wins / r.length) * 100
        suitability += (rate - 50) / 2 // impact plus doux que BJ
      }
    }
  }

  return Math.max(0, Math.min(100, suitability));
}

function generateOverallRecommendation(userScore) {
  if (userScore < 300) {
    return "Vous debutez dans les jeux de casino. Commencez par des jeux simples comme les machines a sous avec de petites mises pour vous familiariser avec l'environnement.";
  } else if (userScore < 600) {
    return "Vous avez une experience moderee. Essayez le blackjack avec des strategies de base et continuez a pratiquer pour ameliorer vos competences.";
  } else if (userScore < 900) {
    return "Vous etes un joueur experimente. Concentrez-vous sur la gestion de la banque et l'optimisation de vos strategies pour maximiser vos gains.";
  } else {
    return "Vous etes un expert ! Vous maitrisez parfaitement les jeux. Maintenez votre niveau et partagez vos connaissances avec les autres joueurs.";
  }
}

function getGameRecommendations(userData) {
  const userScore = analyzeUserPerformance(userData);
  const difficultyLevel = getDifficultyLevel(userScore);

  const games = {};

  // Generer des recommandations pour chaque type de jeu
  Object.keys(GAME_RECOMMENDATIONS).forEach(gameType => {
    const suitability = calculateGameSuitability(gameType, userData, userScore);
    const gameInfo = GAME_RECOMMENDATIONS[gameType];

    games[gameType] = {
      ...gameInfo,
      suitability: Math.round(suitability),
      difficulty: gameInfo.difficulty
    };
  });

  return {
    userScore,
    difficultyLevel,
    overallRecommendation: generateOverallRecommendation(userScore),
    games
  };
}

function getPersonalizedTips(userData, gameType) {
  const tips = [];

  if (gameType === GAME_TYPES.BLACKJACK) {
    if (userData.walletBalance < 100) {
      tips.push("Commencez avec de petites mises pour preserver votre capital");
    }
    if (userData.gameHistory && userData.gameHistory.length < 5) {
      tips.push("Pratiquez d'abord avec des jeux gratuits pour apprendre les regles");
    }
    tips.push("Memorisez la strategie de base du blackjack");
    tips.push("Evitez de prendre l'assurance, c'est rarement profitable");
  }

  if (gameType === GAME_TYPES.SLOT) {
    if (userData.walletBalance < 50) {
      tips.push("Choisissez des machines avec des mises minimales basses");
    }
    tips.push("Definissez une limite de perte avant de commencer");
    tips.push("Prenez des pauses regulieres pour eviter la fatigue");
    tips.push("Jouez pour le plaisir, pas pour gagner de l'argent");
  }

  if (gameType === GAME_TYPES.ROULETTE) {
    if (userData.walletBalance < 100) tips.push('Reste sur des mises extérieures à faible variance (1–5)')
    tips.push('Fixe une limite de pertes et de temps de jeu')
    tips.push('Évite d’augmenter la mise après une perte (anti-martingale)')
  }

  return tips;
}

module.exports = {
  getGameRecommendations,
  getPersonalizedTips,
  analyzeUserPerformance,
  GAME_TYPES,
  DIFFICULTY_LEVELS,
  GAME_RECOMMENDATIONS
};