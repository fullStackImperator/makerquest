import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'
import { FONT, NEON, NEON_CARD, TEXT, neonCard } from './glass-styles'

type ProgressCardProps = {
  playerLevel: number
  playerLevelName: string
  totalXP: number
  progressToNextLevel: number
  xpToNextLevel: number
  coursesInProgressCount: number
}

export function ProgressCard({
  playerLevel,
  playerLevelName,
  totalXP,
  progressToNextLevel,
  xpToNextLevel,
  coursesInProgressCount,
}: ProgressCardProps) {
  const R = 70
  const CIRC = 2 * Math.PI * R
  const offset = CIRC * (1 - progressToNextLevel / 100)

  const motivationText =
    coursesInProgressCount > 0
      ? `Du hast ${coursesInProgressCount} aktive Quest${coursesInProgressCount > 1 ? 's' : ''} – mach weiter so!`
      : `Schließe eine Quest ab, um dein nächstes Level zu erreichen.`

  return (
    <div
      style={{ ...neonCard('cyan'), padding: '2rem' }}
      className={`relative overflow-hidden h-full flex flex-col justify-between ${NEON_CARD}`}
    >
      {/* Decorative dots */}
      <span className="absolute top-8 right-[42%] w-2.5 h-2.5 rounded-full" style={{ background: NEON.fuchsia.solid, boxShadow: `0 0 10px ${NEON.fuchsia.glow}` }} />
      <span className="absolute bottom-14 right-[38%] w-2 h-2 rounded-full" style={{ background: NEON.yellow.solid, boxShadow: `0 0 10px ${NEON.yellow.glow}` }} />
      <span className="absolute top-1/2 right-[40%] w-1.5 h-1.5 rounded-full" style={{ background: NEON.lime.solid, boxShadow: `0 0 8px ${NEON.lime.glow}` }} />

      {/* Left: text content */}
      <div className="max-w-[52%]">
        {/* Section label pill */}
        <span
          className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] rounded-full px-3 py-1 mb-5"
          style={{ color: NEON.fuchsia.ink, background: NEON.fuchsia.soft, border: `1px solid ${NEON.fuchsia.solid}`, fontFamily: FONT }}
        >
          Dein Fortschritt
        </span>

        <h2
          className="text-3xl font-extrabold leading-tight mb-4"
          style={{ color: TEXT.primary, fontFamily: FONT }}
        >
          Jeder Schritt<br />
          <span style={{ color: '#459ea1' }}>bringt dich weiter.</span>
        </h2>

        <p className="text-sm leading-relaxed mb-6" style={{ color: TEXT.muted, fontFamily: FONT }}>
          {motivationText} Du bist auf einem guten Weg — noch{' '}
          <span style={{ color: TEXT.secondary, fontWeight: 600 }}>
            {xpToNextLevel.toLocaleString('de-DE')} XP
          </span>{' '}
          bis Level {playerLevel + 1}.
        </p>

        <Link href="/quests">
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:shadow-[0_0_24px_rgba(163,230,53,0.7)] active:scale-95"
            style={{ background: NEON.lime.solid, color: NEON.lime.ink, boxShadow: `0 0 14px ${NEON.lime.soft}`, fontFamily: FONT }}
          >
            Weiterlernen
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>

      {/* Right: circular XP chart */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2">
        <div className="relative w-44 h-44">
          <svg width="176" height="176" viewBox="0 0 176 176" className="rotate-[-90deg]">
            {/* Track */}
            <circle
              cx="88" cy="88" r={R}
              fill="none"
              stroke={NEON.cyan.soft}
              strokeWidth="7"
            />
            {/* Progress */}
            <circle
              cx="88" cy="88" r={R}
              fill="none"
              stroke={NEON.cyan.solid}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 6px ${NEON.cyan.glow})` }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Zap className="h-5 w-5 mb-1" style={{ color: '#0891b2' }} />
            <p
              className="text-2xl font-bold leading-tight tabular-nums"
              style={{ color: TEXT.primary, fontFamily: FONT }}
            >
              {totalXP.toLocaleString('de-DE')}
            </p>
            <p
              className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
              style={{ color: TEXT.faint, fontFamily: FONT }}
            >
              XP Gesamt
            </p>
          </div>
        </div>

        {/* Level badge below chart */}
        <div className="flex justify-center mt-2">
          <span
            className="text-[10px] font-bold rounded-full px-3 py-0.5"
            style={{ color: NEON.cyan.ink, background: NEON.cyan.solid, boxShadow: `0 0 12px ${NEON.cyan.glow}`, fontFamily: FONT }}
          >
            {playerLevelName} · Lv. {playerLevel}
          </span>
        </div>
      </div>
    </div>
  )
}
