// constants/games.ts
export type GameItem = { label: string; screen: string }

export const GAMES: GameItem[] = [
    { label: '🎰 Machines à Sous 🎰', screen: 'games/defslot' },
    { label: '🃏 Blackjack 🃏', screen: 'games/blackjack' },
    { label: '𖥕 Roulette 𖥕', screen: 'games/roulette' },
]
