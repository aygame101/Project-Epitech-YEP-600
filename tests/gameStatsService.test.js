const {
    getUserGameStats,
    getRecentPerformance,
    getBestPerformances
} = require('../components/services/gameStatsService')
const { getDoc, getDocs } = require('firebase/firestore')

jest.mock('firebase/firestore', () => ({
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    Timestamp: { fromDate: jest.fn() }
}))

describe('getUserGameStats', () => {
    beforeEach(() => jest.clearAllMocks())

    it('retourne les stats par défaut si aucun historique', async () => {
        getDoc.mockResolvedValue({ exists: () => false })
        getDocs.mockResolvedValue({
            forEach: cb => {} // aucun tx
        })
        const stats = await getUserGameStats('uid')
        expect(stats.totalGames).toBe(0)
        expect(stats.totalWins).toBe(0)
        expect(stats.gameTypeStats).toEqual({})
    })

    it('calcule correctement les stats avec historique simulé', async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                gamesPlayed: 10,
                wins: 4,
                losses: 5,
                pushes: 1,
                totalWagered: 1000,
                totalPayout: 800
            })
        })
        // Simule 3 parties : win, loss, draw
        getDocs.mockResolvedValue({
            forEach: cb => {
                cb({ data: () => ({ delta: 50, game: 'slot' }) })
                cb({ data: () => ({ delta: -20, game: 'blackjack' }) })
                cb({ data: () => ({ delta: 0, game: 'roulette' }) })
            }
        })
        const stats = await getUserGameStats('uid')
        expect(stats.totalGames).toBe(10)
        expect(stats.totalWins).toBe(4)
        expect(stats.totalLosses).toBe(5)
        expect(stats.totalDraws).toBe(1)
        expect(stats.totalWinnings).toBe(800)
        expect(stats.totalLossesAmount).toBe(200)
        expect(stats.gameTypeStats.slot.gamesPlayed).toBe(1)
        expect(stats.gameTypeStats.blackjack.losses).toBe(1)
        expect(stats.gameTypeStats.roulette.draws).toBe(1)
    })
})

describe('getRecentPerformance', () => {
    beforeEach(() => jest.clearAllMocks())

    it('retourne 0 si aucune partie récente', async () => {
        getDocs.mockResolvedValue({
            forEach: cb => {}
        })
        const perf = await getRecentPerformance('uid')
        expect(perf.gamesPlayed).toBe(0)
        expect(perf.winRate).toBe(0)
    })

    it('calcule winRate sur parties simulées', async () => {
        getDocs.mockResolvedValue({
            forEach: cb => {
                cb({ data: () => ({ delta: 10 }) })
                cb({ data: () => ({ delta: -5 }) })
                cb({ data: () => ({ delta: 0 }) })
            }
        })
        const perf = await getRecentPerformance('uid')
        expect(perf.gamesPlayed).toBe(3)
        expect(perf.wins).toBe(1)
        expect(perf.losses).toBe(1)
        expect(perf.draws).toBe(1)
        expect(perf.winRate).toBeCloseTo(33.33, 1)
    })
})

describe('getBestPerformances', () => {
    beforeEach(() => jest.clearAllMocks())

    it('retourne 0 si aucun tx', async () => {
        getDocs.mockResolvedValue({
            forEach: cb => {}
        })
        const best = await getBestPerformances('uid')
        expect(best.bestWin).toBe(0)
        expect(best.bestGameType).toBe(null)
        expect(best.mostPlayedGame).toBe(null)
    })

    it('trouve le bestWin et mostPlayedGame', async () => {
        getDocs.mockResolvedValue({
            forEach: cb => {
                cb({ data: () => ({ delta: 100, game: 'slot' }) })
                cb({ data: () => ({ delta: 50, game: 'slot' }) })
                cb({ data: () => ({ delta: -10, game: 'blackjack' }) })
                cb({ data: () => ({ delta: 0, game: 'blackjack' }) })
            }
        })
        const best = await getBestPerformances('uid')
        expect(best.bestWin).toBe(100)
        expect(best.mostPlayedGame).toBe('slot')
        expect(['slot', 'blackjack']).toContain(best.bestGameType)
    })
})
