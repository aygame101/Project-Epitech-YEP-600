// utils/withTimeout.ts
export function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ])
}
