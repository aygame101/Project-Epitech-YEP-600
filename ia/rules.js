export const rules = {
  highLosses: {
    threshold: 100,
    condition: (stats) => stats.total_losses > 100,
    suggestion: {
      message: "On dirait que tu perds souvent. Essaie un jeu à faible risque comme le blackjack simplifié.",
      game: "blackjack_simplifie",
    },
  },
  highWins: {
    threshold: 200,
    condition: (stats) => stats.total_wins > 200,
    suggestion: {
      message: "Tu es un joueur expérimenté ! Tu pourrais essayer des jeux plus complexes comme le poker.",
      game: "roulette",
    },
  },
  highAbandons: {
    abandonRate: 0.4,
    condition: (stats) => {
      if (stats.games_played === 0) return false;
      return stats.games_abandoned / stats.games_played > 0.4;
    },
    suggestion: {
      message: "Tu as tendance à abandonner souvent. Peut-être que tu devrais essayer des jeux plus courts ou moins complexes.",
      game: "roulette",
    },
  },
  lowActivity: {
    threshold: 50,
    condition: (stats) => stats.games_played < 50 && stats.games_played > 0,
    suggestion: {
      message: "Tu n'as pas beaucoup joué récemment. Essaie un nouveau jeu pour te remettre dans le bain.",
      game: "slot_machine",
    },
  },
  noActivity: {
    condition: (stats) => stats.games_played === 0,
    suggestion: {
      message: "Tu n'as pas encore joué. Découvre nos jeux pour commencer l'aventure !",
      game: "slot_machine",
    },
  },
  repeatSlot: {
    condition: (lastGame) => lastGame === "slot_machine",
    suggestion: {
      message: "Tu as déjà joué à ce jeu. Essaie quelque chose de nouveau !",
      game: "blackjack_simplifie",
    },
  },
  repeatBlackjack: {
    condition: (lastGame) => lastGame === "blackjack_simplifie",
    suggestion: {
      message: "Tu as déjà joué à ce jeu. Essaie quelque chose de nouveau !",
      game: "slot_machine",
    },
  },
  repeatRoulette: {
    condition: (lastGame) => lastGame === "roulette",
    suggestion: {
      message: "Tu as déjà joué à ce jeu. Essaie quelque chose de nouveau !",
      game: "blackjack_simplifiee",
    },
  },
  repeatPoker: {
    condition: (lastGame) => lastGame === "poker",
    suggestion: {
      message: "Tu as déjà joué à ce jeu. Essaie quelque chose de nouveau !",
      game: "slot_machine",
    },
  },
};

