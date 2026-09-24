import type { CSSProperties } from 'react'

// Soft desaturated teal gradient — the page background
export const BG_GRADIENT = [
  'radial-gradient(ellipse 80% 70% at 72% 6%,  rgba(218,238,245,0.95) 0%, transparent 65%)',
  'radial-gradient(ellipse 55% 80% at 4%  94%,  rgba(196,218,230,0.85) 0%, transparent 55%)',
  'radial-gradient(ellipse 60% 50% at 45% 55%,  rgba(208,228,238,0.50) 0%, transparent 60%)',
  '#cce0e9',
].join(', ')

// Solid white card — no glass, proper shadow
export const CARD = {
  background: '#e2eeef',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: '16px',
  boxShadow: '0 1px 3px rgba(80,120,150,0.07), 0 4px 24px rgba(80,120,150,0.08)',
}

// Lighter surface for items nested inside a CARD
export const CARD_INNER = {
  background: 'rgba(255,255,255,0.58)',
  border: '1px solid rgba(255,255,255,0.75)',
  borderRadius: '12px',
  boxShadow: '0 1px 4px rgba(80,120,150,0.05)',
}

export const FONT = 'var(--font-jakarta)'

export const TEXT = {
  primary:   '#1a2d3d',
  secondary: '#4e6878',
  muted:     '#7e98a8',
  faint:     '#aabecb',
}

// Kept for backward compat — no longer a shell, just equals CARD
export const SHELL = CARD

// ── Neon accents ──────────────────────────────────────────────────────────────
// Solid fills, borders and glows only — text stays dark for contrast.

export const NEON = {
  cyan:    { solid: '#22d3ee', ink: '#083344', glow: 'rgba(34,211,238,0.45)',  soft: 'rgba(34,211,238,0.18)',  tint: 'rgba(34,211,238,0.14)' },
  fuchsia: { solid: '#e879f9', ink: '#4a044e', glow: 'rgba(232,121,249,0.45)', soft: 'rgba(232,121,249,0.18)', tint: 'rgba(232,121,249,0.13)' },
  lime:    { solid: '#a3e635', ink: '#1a2e05', glow: 'rgba(163,230,53,0.50)',  soft: 'rgba(163,230,53,0.22)',  tint: 'rgba(163,230,53,0.18)' },
  yellow:  { solid: '#fde047', ink: '#422006', glow: 'rgba(253,224,71,0.55)',  soft: 'rgba(253,224,71,0.25)',  tint: 'rgba(253,224,71,0.20)' },
  orange:  { solid: '#fb923c', ink: '#431407', glow: 'rgba(251,146,60,0.45)',  soft: 'rgba(251,146,60,0.18)',  tint: 'rgba(251,146,60,0.14)' },
} as const

export type NeonColor = keyof typeof NEON

type NeonVars = CSSProperties & Record<`--${string}`, string>

/**
 * Neon surface for a card: tinted background plus CSS variables consumed by
 * NEON_CARD. Border and shadow are left to that class, since
 * inline styles would override the hover state.
 */
export function neonSurface(
  hex: string,
  glow: string,
  tint: string,
  base: { background: string; borderRadius: string } = CARD,
): NeonVars {
  return {
    background: `linear-gradient(135deg, ${tint} 0%, transparent 60%), ${base.background}`,
    borderRadius: base.borderRadius,
    '--neon': hex,
    '--neon-border': `${hex}80`,
    '--neon-glow': glow,
  }
}

export function neonCard(color: NeonColor, base?: { background: string; borderRadius: string }) {
  const n = NEON[color]
  return neonSurface(n.solid, n.glow, n.tint, base)
}

/** Static neon card: neon border with a soft resting glow. */
export const NEON_CARD =
  'border border-[var(--neon-border)] shadow-[0_1px_3px_rgba(80,120,150,0.07),0_0_22px_-6px_var(--neon-glow)]'
