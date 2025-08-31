// components/games/roulette/logic.js

// Jeu européen (1 zéro)
export const NUMBERS = Array.from({ length: 37 }, (_, i) => i)

export const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
export const BLACKS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]

// Colonnes: (1ère: n%3===1), (2ème: n%3===2), (3ème: n%3===0) — hors 0
export const COLUMNS = [
    NUMBERS.filter(n => n !== 0 && n % 3 === 1),
    NUMBERS.filter(n => n !== 0 && n % 3 === 2),
    NUMBERS.filter(n => n !== 0 && n % 3 === 0),
]

// Douzaines: 1–12, 13–24, 25–36
export const DOZENS = [
    NUMBERS.filter(n => n >= 1 && n <= 12),
    NUMBERS.filter(n => n >= 13 && n <= 24),
    NUMBERS.filter(n => n >= 25 && n <= 36),
]

export function colorOf(n) {
    if (n === 0) return 'green'
    if (REDS.includes(n)) return 'red'
    return 'black'
}

export function inColumn(n) {
    if (n === 0) return null
    const idx = (n % 3) || 3
    return idx // 1..3
}

export function inDozen(n) {
    if (n === 0) return null
    if (n >= 1 && n <= 12) return 1
    if (n >= 13 && n <= 24) return 2
    if (n >= 25 && n <= 36) return 3
    return null
}

// Normalise et agrège les mises (comme l’agg du script Phaser)
export function aggregateBets(bets = []) {
    const out = {}
    for (const b of bets) {
        if (!b || typeof b !== 'object') continue
        const type = b.type
        const value = b.value
        const amount = Number(b.amount) || 0
        if (amount <= 0) continue
        const key = `${type}:${value ?? ''}`
        out[key] = out[key] || { type, value, amount: 0 }
        out[key].amount += amount
    }
    return Object.values(out)
}

/**
 * Calcule le **payout brut** comme dans ton script Phaser:
 *  - plein (number): 36×
 *  - rouge/noir/pair/impair/bas/haut: 2×
 *  - colonne/douzaine: 3×
 * @param {number} winningNumber
 * @param {Array<{type:string,value?:number,amount:number}>} bets (agrégées ou non)
 * @returns {number} total des gains (brut)
 */
export function calcGainFromBets(winningNumber, bets = []) {
    const list = aggregateBets(bets)
    let gain = 0

    for (const b of list) {
        const a = Number(b.amount) || 0
        if (a <= 0) continue

        switch (b.type) {
            case 'number':
                if (Number(b.value) === winningNumber) gain += a * 36
                break
            case 'red':
                if (REDS.includes(winningNumber)) gain += a * 2
                break
            case 'black':
                if (BLACKS.includes(winningNumber)) gain += a * 2
                break
            case 'even':
                if (winningNumber !== 0 && winningNumber % 2 === 0) gain += a * 2
                break
            case 'odd':
                if (winningNumber % 2 === 1) gain += a * 2
                break
            case 'low':
                if (winningNumber >= 1 && winningNumber <= 18) gain += a * 2
                break
            case 'high':
                if (winningNumber >= 19 && winningNumber <= 36) gain += a * 2
                break
            case 'column': {
                const col = inColumn(winningNumber)
                if (col && Number(b.value) === col) gain += a * 3
                break
            }
            case 'dozen': {
                const doz = inDozen(winningNumber)
                if (doz && Number(b.value) === doz) gain += a * 3
                break
            }
            default:
                // types inconnus ignorés
                break
        }
    }

    return gain
}
