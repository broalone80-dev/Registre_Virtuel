// Registre Virtuel — Palette de couleurs mobile
export const colors = {
    // Primaires
    primary: '#3b82f6',
    primaryDark: '#1e40af',
    primaryLight: '#93c5fd',

    // Accents
    accent: '#f97316',
    accentDark: '#c2410c',

    // Fond (dark mode)
    background: '#0f172a',
    surface: '#1e293b',
    surfaceLight: '#334155',
    card: '#1e293b',

    // Texte
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',

    // Statuts
    success: '#22c55e',
    successBg: 'rgba(34, 197, 94, 0.12)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.12)',
    danger: '#ef4444',
    dangerBg: 'rgba(239, 68, 68, 0.12)',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.12)',

    // Bordures
    border: 'rgba(148, 163, 184, 0.12)',
    borderLight: 'rgba(148, 163, 184, 0.06)',

    // Blanc
    white: '#ffffff',
    black: '#000000',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};

export const typography = {
    h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '700' },
    body: { fontSize: 15, fontWeight: '400' },
    bodySmall: { fontSize: 13, fontWeight: '400' },
    caption: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
    button: { fontSize: 15, fontWeight: '700' },
};

export default { colors, spacing, borderRadius, typography };
