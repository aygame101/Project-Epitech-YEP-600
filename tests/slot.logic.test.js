import { evaluateGrid } from './gamelogic/slotlogic'

const PAYTABLE = {
    cherry: { 3: 10, 4: 40, 5: 80 },
    bell: { 3: 20, 4: 100, 5: 200 },
    seven: { 3: 50, 4: 250, 5: 500 },
}
const WILD = 'bar'

test('paye une ligne 3-en-ligne avec wilds au début', () => {
    // colonne => 0..4, ligne => 0..2
    const grid = [
        ['bar', 'x', 'x'],
        ['cherry', 'x', 'x'],
        ['cherry', 'x', 'x'],
        ['x', 'x', 'x'],
        ['x', 'x', 'x'],
    ]
    // ligne milieu (row=0 pour col0..4)
    const paylines = [[0, 0, 0, 0, 0]]
    const res = evaluateGrid(grid, paylines, PAYTABLE, { wild: WILD })
    expect(res.total).toBe(10)
    expect(res.wins[0]).toEqual(expect.objectContaining({ symbol: 'cherry', count: 3 }))
})

test('ne paie pas si cassure avant 3', () => {
    const grid = [
        ['bar', 'x', 'x'],
        ['cherry', 'x', 'x'],
        ['bell', 'x', 'x'], // casse la suite au 3e
        ['cherry', 'x', 'x'],
        ['x', 'x', 'x'],
    ]
    const paylines = [[0, 0, 0, 0, 0]]
    const res = evaluateGrid(grid, paylines, PAYTABLE, { wild: WILD })
    expect(res.total).toBe(0)
    expect(res.wins.length).toBe(0)
})
