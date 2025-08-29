// utils/chatList.ts
import type { UserRow } from '../types/chat'

export function enrichWithFavorites(rows: UserRow[], favMap: Record<string, 0 | 1>): UserRow[] {
    return rows.map((r) => ({ ...r, favoris: favMap[r.uid] ?? 0 }))
}

export function sortUsers(rows: UserRow[]): UserRow[] {
    const clone = [...rows]
    clone.sort((a, b) => {
        const fa = a.favoris ? 1 : 0
        const fb = b.favoris ? 1 : 0
        if (fa !== fb) return fb - fa
        const nameA = (a.displayName ?? a.usernameLower ?? '').toLocaleLowerCase()
        const nameB = (b.displayName ?? b.usernameLower ?? '').toLocaleLowerCase()
        return nameA.localeCompare(nameB)
    })
    return clone
}

export function makeSections(sortedRows: UserRow[]) {
    const favRows = sortedRows.filter((r) => r.favoris === 1)
    const otherRows = sortedRows.filter((r) => !r.favoris)

    if (favRows.length > 0) {
        return [
            { title: '⭐ Favoris', data: favRows },
            { title: 'Tous les joueurs', data: otherRows },
        ]
    }
    return [{ title: 'Joueurs', data: sortedRows }]
}
