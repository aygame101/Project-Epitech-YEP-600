// tests/roulette.logic.test.js
import {
    REDS, BLACKS, COLUMNS, DOZENS,
    colorOf, inColumn, inDozen,
    aggregateBets, calcGainFromBets
} from './gamelogic/roulettelogic'

describe('roulette logic - sets de base', () => {
    test('couleurs: 0 est vert, 1 rouge, 2 noir', () => {
        expect(colorOf(0)).toBe('green')
        expect(colorOf(1)).toBe('red')
        expect(colorOf(2)).toBe('black')
    })

    test('colonnes: 1→1, 2→2, 3→3, 0→null', () => {
        expect(inColumn(1)).toBe(1)
        expect(inColumn(2)).toBe(2)
        expect(inColumn(3)).toBe(3)
        expect(inColumn(0)).toBeNull()
    })

    test('douzaines: 1→1, 12→1, 13→2, 24→2, 25→3, 36→3, 0→null', () => {
        expect(inDozen(1)).toBe(1)
        expect(inDozen(12)).toBe(1)
        expect(inDozen(13)).toBe(2)
        expect(inDozen(24)).toBe(2)
        expect(inDozen(25)).toBe(3)
        expect(inDozen(36)).toBe(3)
        expect(inDozen(0)).toBeNull()
    })

    test('listes REDS/BALCKS non chevauchantes et couvrent 1..36', () => {
        const sRed = new Set(REDS)
        const sBlack = new Set(BLACKS)
        for (let n = 1; n <= 36; n++) {
            expect(sRed.has(n) || sBlack.has(n)).toBe(true)
            expect(sRed.has(n) && sBlack.has(n)).toBe(false)
        }
    })

    test('COLUMNS et DOZENS couvrent correctement sans 0', () => {
        const allCols = new Set([...COLUMNS[0], ...COLUMNS[1], ...COLUMNS[2]])
        const allDoz = new Set([...DOZENS[0], ...DOZENS[1], ...DOZENS[2]])
        for (let n = 1; n <= 36; n++) {
            expect(allCols.has(n)).toBe(true)
            expect(allDoz.has(n)).toBe(true)
        }
        expect(allCols.has(0)).toBe(false)
        expect(allDoz.has(0)).toBe(false)
    })
})

describe('roulette logic - aggregateBets', () => {
    test('agrège par (type,value) et ignore amount <= 0', () => {
        const bets = [
            { type: 'red', amount: 10 },
            { type: 'red', amount: 20 },
            { type: 'number', value: 17, amount: 5 },
            { type: 'number', value: 17, amount: 0 },
            { type: 'black', amount: -10 },
        ]
        const agg = aggregateBets(bets)
        expect(agg).toEqual(
            expect.arrayContaining([
                { type: 'red', amount: 30, value: undefined },
                { type: 'number', value: 17, amount: 5 },
            ])
        )
        expect(agg.length).toBe(2)
    })
})

describe('roulette logic - calcGainFromBets (payout brut)', () => {
    test('plein (number) paie 36×', () => {
        const bets = [{ type: 'number', value: 17, amount: 10 }]
        expect(calcGainFromBets(17, bets)).toBe(360)
        expect(calcGainFromBets(16, bets)).toBe(0)
    })

    test('rouge/noir paient 2× (0 ne paie pas)', () => {
        expect(calcGainFromBets(1, [{ type: 'red', amount: 20 }])).toBe(40)
        expect(calcGainFromBets(2, [{ type: 'black', amount: 15 }])).toBe(30)
        expect(calcGainFromBets(0, [{ type: 'red', amount: 50 }])).toBe(0)
        expect(calcGainFromBets(0, [{ type: 'black', amount: 50 }])).toBe(0)
    })

    test('pair/impair (even/odd) paient 2× (0 exclu pour even)', () => {
        expect(calcGainFromBets(18, [{ type: 'even', amount: 10 }])).toBe(20)
        expect(calcGainFromBets(17, [{ type: 'odd', amount: 10 }])).toBe(20)
        expect(calcGainFromBets(0, [{ type: 'even', amount: 10 }])).toBe(0)
    })

    test('low (1–18) / high (19–36) paient 2× (0 exclu)', () => {
        expect(calcGainFromBets(5, [{ type: 'low', amount: 25 }])).toBe(50)
        expect(calcGainFromBets(25, [{ type: 'high', amount: 25 }])).toBe(50)
        expect(calcGainFromBets(0, [{ type: 'low', amount: 25 }])).toBe(0)
    })

    test('douzaines paient 3×', () => {
        expect(calcGainFromBets(12, [{ type: 'dozen', value: 1, amount: 10 }])).toBe(30)
        expect(calcGainFromBets(24, [{ type: 'dozen', value: 2, amount: 10 }])).toBe(30)
        expect(calcGainFromBets(36, [{ type: 'dozen', value: 3, amount: 10 }])).toBe(30)
        expect(calcGainFromBets(12, [{ type: 'dozen', value: 2, amount: 10 }])).toBe(0)
    })

    test('colonnes paient 3×', () => {
        // Colonne 1: n%3===1
        expect(calcGainFromBets(19, [{ type: 'column', value: 1, amount: 10 }])).toBe(30)
        // Colonne 2: n%3===2
        expect(calcGainFromBets(20, [{ type: 'column', value: 2, amount: 10 }])).toBe(30)
        // Colonne 3: n%3===0
        expect(calcGainFromBets(21, [{ type: 'column', value: 3, amount: 10 }])).toBe(30)
        // Mauvaise colonne → 0
        expect(calcGainFromBets(19, [{ type: 'column', value: 2, amount: 10 }])).toBe(0)
    })

    test('combinaisons: somme des gains de chaque pari', () => {
        const bets = [
            { type: 'red', amount: 10 },
            { type: 'odd', amount: 10 },
            { type: 'number', value: 19, amount: 5 },
            { type: 'dozen', value: 2, amount: 10 }, // 19 ∈ 2e douzaine
            { type: 'column', value: 1, amount: 10 }, // 19 ∈ colonne 1
        ]
        // rouge (2×10=20) + impair (20) + plein (5*36=180) + dozen (30) + column (30) = 280
        expect(calcGainFromBets(19, bets)).toBe(280)
    })

    test('agrégation implicite: doublons additionnés avant payout', () => {
        const bets = [
            { type: 'red', amount: 10 },
            { type: 'red', amount: 20 },
        ]
        // total sur rouge = 30 → payout 2× = 60
        expect(calcGainFromBets(1, bets)).toBe(60)
    })

    test('0: seul le plein sur 0 paie', () => {
        const bets = [
            { type: 'red', amount: 50 },
            { type: 'even', amount: 50 },
            { type: 'dozen', value: 1, amount: 50 },
            { type: 'number', value: 0, amount: 5 },
        ]
        // seul le 0 plein : 5*36 = 180
        expect(calcGainFromBets(0, bets)).toBe(180)
    })
})
