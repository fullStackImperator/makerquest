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
