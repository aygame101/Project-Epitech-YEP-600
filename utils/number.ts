// utils/number.ts
export function formatJets(n: number) {
    try {
        return `${Intl.NumberFormat('fr-FR').format(n)} jets`
    } catch {
        return `${n} jets`
    }
}
