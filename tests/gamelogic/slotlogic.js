// evaluate un écran de 5x3: grid[col][row] -> 'cherry','bar',...
export function evaluateGrid(grid, paylines, paytable, { wild = 'bar' } = {}) {
    const wins = []
    let total = 0

    for (const line of paylines) {
        // line: ex [1,1,1,1,1] = 5 cases, chaque valeur est la row (0..2) pour chaque col 0..4
        const seq = line.map((row, col) => grid[col][row])
        const target = seq.find(s => s !== wild)
        if (!target) continue

        let count = 0
        for (const s of seq) {
            if (s === target || s === wild) count++
            else break
        }
        if (count >= 3) {
            const amount = (paytable[target] && paytable[target][count]) || 0
            if (amount > 0) {
                total += amount
                wins.push({ symbol: target, count, line })
            }
        }
    }
    return { total, wins }
}
