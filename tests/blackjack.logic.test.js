import { calcValue, canSplit, outcome, payoutFor } from './gamelogic/blackjacklogic'

describe('blackjack logic', () => {
    test('calcValue gère les As correctement', () => {
        expect(calcValue([{ rank: 'A' }, { rank: '9' }])).toBe(20)
        expect(calcValue([{ rank: 'A' }, { rank: '9' }, { rank: 'A' }])).toBe(21)
        expect(calcValue([{ rank: 'A' }, { rank: '9' }, { rank: 'K' }])).toBe(20)
    })

    test('calcValue pour figures et nombres', () => {
        expect(calcValue([{ rank: 'K' }, { rank: 'Q' }])).toBe(20)
        expect(calcValue([{ rank: '10' }, { rank: '7' }])).toBe(17)
    })

    test('canSplit règles (mêmes rangs, 10 + figure, double figure)', () => {
        expect(canSplit([{ rank: '8' }, { rank: '8' }])).toBe(true)
        expect(canSplit([{ rank: '10' }, { rank: 'K' }])).toBe(true)
        expect(canSplit([{ rank: 'Q' }, { rank: 'K' }])).toBe(true)
        expect(canSplit([{ rank: '9' }, { rank: 'K' }])).toBe(false)
    })

    test('outcome et payoutFor conformes', () => {
        expect(outcome(22, 17)).toBe('lose')
        expect(outcome(20, 22)).toBe('win')
        expect(outcome(18, 19)).toBe('lose')
        expect(outcome(19, 19)).toBe('push')

        const stake = 50
        expect(payoutFor(stake, 'win')).toBe(100)
        expect(payoutFor(stake, 'push')).toBe(50)
        expect(payoutFor(stake, 'lose')).toBe(0)
    })
})
