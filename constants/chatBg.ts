// constants/chatBg.ts
export const BG_PRESETS = [
    { code: 'solid-dark', label: 'Sombre', type: 'color' as const, value: '#1a1a2e' },
    { code: 'solid-deepblue', label: 'Bleu nuit', type: 'color' as const, value: '#0b132b' },
    { code: 'solid-graphite', label: 'Graphite', type: 'color' as const, value: '#111518' },

    { code: 'grad-midnight', label: 'Midnight', type: 'gradient' as const, value: ['#0a0f1e', '#0f2027', '#203a43', '#2c5364'] },
    { code: 'grad-violet', label: 'Violet', type: 'gradient' as const, value: ['#23074d', '#5a189a', '#d63384', '#cc5333'] },
    { code: 'grad-sunset', label: 'Sunset', type: 'gradient' as const, value: ['#f4402c', '#f86a5c', '#f9a14a', '#ffd166'] },

    { code: 'grad-galaxy', label: 'Galaxy', type: 'gradient' as const, value: ['#0b0f21', '#2b1e66', '#ff3fb4', '#00d2ff'] },
    { code: 'grad-casino', label: 'Casino', type: 'gradient' as const, value: ['#0b2e1a', '#145c34', '#1fa34a', '#0c3b22'] },
] as const

export type BgCode = typeof BG_PRESETS[number]['code']
