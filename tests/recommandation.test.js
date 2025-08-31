// tests/recommandation.test.js
// Tests unitaires pour le système de recommandation (version Jest)

const {
  getGameRecommendations,
  getPersonalizedTips,
  analyzeUserPerformance,
  GAME_TYPES,
  DIFFICULTY_LEVELS,
  GAME_RECOMMENDATIONS
} = require('../ia/recommandation')

// Polyfill performance.now() pour Node
const { performance } = require('perf_hooks')
global.performance = global.performance || performance

// Données de test pour différents types d'utilisateurs
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
}

describe('Constantes', () => {
  test('GAME_TYPES expose les types attendus', () => {
    expect(GAME_TYPES).toEqual(
      expect.objectContaining({
        BLACKJACK: 'blackjack',
        SLOT: 'slot'
      })
    )
  })

  test('DIFFICULTY_LEVELS expose 4 niveaux lisibles', () => {
    // On vérifie la structure (clés) et que les valeurs sont des strings
    expect(DIFFICULTY_LEVELS).toEqual(
      expect.objectContaining({
        BEGINNER: expect.any(String),
        INTERMEDIATE: expect.any(String),
        ADVANCED: expect.any(String),
        EXPERT: expect.any(String),
      })
    )
    // Si tu utilises des libellés FR, décommente cette ligne :
    expect(Object.values(DIFFICULTY_LEVELS)).toEqual(
      expect.arrayContaining(['Facile', 'Moyenne', 'Difficile', 'Expert'])
    )
  })

  test('GAME_RECOMMENDATIONS contient au moins blackjack et slot', () => {
    expect(GAME_RECOMMENDATIONS).toEqual(
      expect.objectContaining({
        blackjack: expect.anything(),
        slot: expect.anything(),
      })
    )
  })
})

describe('analyzeUserPerformance', () => {
  test('classe débutant < 300', () => {
    const score = analyzeUserPerformance(testUsers.beginner)
    expect(score).toBeLessThan(300)
  })

  test('classe intermédiaire entre 300 et 600', () => {
    const score = analyzeUserPerformance(testUsers.intermediate)
    expect(score).toBeGreaterThanOrEqual(300)
    expect(score).toBeLessThan(600)
  })

  test('ordre des scores: beginner < intermediate < advanced ≤ expert', () => {
    const sBegin = analyzeUserPerformance(testUsers.beginner)
    const sInter = analyzeUserPerformance(testUsers.intermediate)
    const sAdv   = analyzeUserPerformance(testUsers.advanced)
    const sExp   = analyzeUserPerformance(testUsers.expert)

    expect(sBegin).toBeLessThan(sInter)
    expect(sInter).toBeLessThan(sAdv)
    expect(sAdv).toBeLessThanOrEqual(sExp)
  })
})


describe('getGameRecommendations', () => {
  const users = Object.entries(testUsers)

  test.each(users)('structure de retour correcte pour %s', (_label, userData) => {
    const r = getGameRecommendations(userData)
    expect(r).toEqual(
      expect.objectContaining({
        userScore: expect.any(Number),
        difficultyLevel: expect.any(String),
        overallRecommendation: expect.any(String),
        games: expect.objectContaining({
          blackjack: expect.any(Object),
          slot: expect.any(Object),
        }),
      })
    )
  })

  test.each(users)('pertinence 0..100 pour chaque jeu - %s', (_label, userData) => {
    const r = getGameRecommendations(userData)
    for (const game of Object.values(r.games)) {
      expect(game.suitability).toBeGreaterThanOrEqual(0)
      expect(game.suitability).toBeLessThanOrEqual(100)
    }
  })
})

describe('getPersonalizedTips', () => {
  test('renvoie une liste pour blackjack (beginner)', () => {
    const tips = getPersonalizedTips(testUsers.beginner, 'blackjack')
    expect(Array.isArray(tips)).toBe(true)
    if (tips.length) {
      for (const t of tips) expect(typeof t).toBe('string')
    }
  })

  test('renvoie une liste pour slot (beginner)', () => {
    const tips = getPersonalizedTips(testUsers.beginner, 'slot')
    expect(Array.isArray(tips)).toBe(true)
    if (tips.length) {
      for (const t of tips) expect(typeof t).toBe('string')
    }
  })

  test('renvoie une liste pour blackjack (advanced)', () => {
    const tips = getPersonalizedTips(testUsers.advanced, 'blackjack')
    expect(Array.isArray(tips)).toBe(true)
    if (tips.length) {
      for (const t of tips) expect(typeof t).toBe('string')
    }
  })
})

describe('Performance', () => {
  test('1000 analyses en < 2s', () => {
    const t0 = performance.now()
    for (let i = 0; i < 1000; i++) analyzeUserPerformance(testUsers.intermediate)
    const dt = performance.now() - t0
    expect(dt).toBeLessThan(2000)
  })
})
