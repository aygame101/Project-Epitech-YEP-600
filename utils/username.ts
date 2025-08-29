// utils/username.ts
export const normalizeUsername = (s: string) => s.trim().toLowerCase()
export const isValidUsername = (s: string) => /^[a-z0-9_]{3,20}$/.test(s)
