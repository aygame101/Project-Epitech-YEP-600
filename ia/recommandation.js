import { rules } from './rules.js';

// Détection des comportements
function detectHighLosses(playerStats, threshold = 100) {
  return playerStats.total_losses > threshold;
}

function detectHighWins(playerStats, threshold = 200) {
  return playerStats.total_wins > threshold;
}

function detectAbandons(playerStats, abandonRate = 0.4) {
  if (playerStats.games_played === 0) return false;
  return playerStats.games_abandoned / playerStats.games_played > abandonRate;
}

function detectLowGames(playerStats, threshold = 50) {
  return playerStats.games_played < threshold;
}



const Recommandations_joueurs = {
  welcome: {
    message: "Bienvenue sur notre plateforme de jeux ! Nous sommes là pour t'aider à trouver le jeu qui te convient le mieux.",
    suggestion: "Slot_machine",
  },
  losses: {
    message: "On dirait que tu perds souvent. Essaie un jeu à faible risque comme le blackjack simplifié.",
    suggestion: "blackjack_simplifie",
  },
  wins: {
    message: "Tu es un joueur expérimenté ! Tu pourrais essayer des jeux plus complexes comme le poker.",
    suggestion: "Roulette",
  },
  abandons: {
    message: "Tu as tendance à abandonner souvent. Peut-être que tu devrais essayer des jeux plus courts ou moins complexes.",
    suggestion: "Roulette",
  },
  activity: {
    message: "Tu n'as pas beaucoup joué récemment. Essaie un nouveau jeu pour te remettre dans le bain.",
    suggestion: "slot_machine",
  },
  no_activity:{
    message: "Tu n'as pas encore joué. Découvre nos jeux pour commencer l'aventure !",
    suggestion: "slot_machine",
  },
}

const recommendations_repeat = {
  slotRepeat: {
    message: "Tu as déjà joué à ce jeu. Essaie quelque chose de nouveau !",
    suggestion: "blackjack_simplifie",
  },
  blackjackRepeat: {
    message: "Tu as déjà joué à ce jeu. Essaie quelque chose de nouveau !",
    suggestion: "slot_machine",
  },
  rouletteRepeat: {
    message: "Tu as déjà joué à ce jeu. Essaie quelque chose de nouveau !",
    suggestion: "blackjack_simplifiee",
  },
  pokerRepeat: {
    message: "Tu as déjà joué à ce jeu. Essaie quelque chose de nouveau !",
    suggestion: "slot_machine",
  },

};


function recommendAction(playerStats) {
  if (detectHighLosses(playerStats)) {
    return Recommandations_joueurs.losses;
  } else if (detectHighWins(playerStats)) {
    return Recommandations_joueurs.wins;
  } else if (detectAbandons(playerStats)) {
    return Recommandations_joueurs.abandons;
  } else if (detectLowGames(playerStats)) {
    return Recommandations_joueurs.activity;
  } else {
    return Recommandations_joueurs.welcome;
  }
}

function recommendForNewUser() {
  return Recommandations_joueurs.welcome;
}
function runRecommendationForUser(userId) {
  const user = UsersDB[userId];
  if (!user) {
    console.log("Utilisateur introuvable.");
    return;
  }

  const recommendation = recommendAction(user);

  console.log(` Hello ${user.userName}.`);
  console.log(`Il vous reste : ${user.walletBalance} €.`);
  console.log(recommendation.message);
  console.log("Suggestion :", recommendation.suggestion);
};

runRecommendationForUser("xyz456");