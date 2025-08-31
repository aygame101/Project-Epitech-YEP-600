// components/games/blackjack/logic.js
export function calcValue(hand) {
    let sum = 0, aces = 0
    for (const c of hand) {
        if (['J', 'Q', 'K'].includes(c.rank)) sum += 10
        else if (c.rank === 'A') { sum += 11; aces++ }
        else sum += parseInt(c.rank, 10)
    }
    while (sum > 21 && aces > 0) { sum -= 10; aces-- }
    return sum
}

export function canSplit(hand) {
    if (!hand || hand.length !== 2) return false
    const [r1, r2] = [hand[0].rank, hand[1].rank]
    const face = r => ['J', 'Q', 'K'].includes(r)
    if (r1 === r2) return true
    if ((r1 === '10' && face(r2)) || (r2 === '10' && face(r1))) return true
    if (face(r1) && face(r2)) return true
    return false
}

export function outcome(playerVal, dealerVal) {
    if (playerVal > 21) return 'lose'
    if (dealerVal > 21) return 'win'
    if (playerVal > dealerVal) return 'win'
    if (playerVal < dealerVal) return 'lose'
    return 'push'
}

// retour “payout brut” comme dans ton script (stake doublé si win, rendu si push)
export function payoutFor(stake, result) {
    if (result === 'win') return stake * 2
    if (result === 'push') return stake
    return 0
}
