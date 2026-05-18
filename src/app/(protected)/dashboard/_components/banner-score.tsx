'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Zap, Shield, ChevronUp, Trophy, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { getLevelName } from '@/lib/levelNames'

// ── Types ────────────────────────────────────────────────────────────────────

interface UserBadge {
  badge: {
    id: string
    name: string
    imageUrl: string
    createdAt?: Date
    updatedAt?: Date
  }
}

type SessionUser = {
  id: string
  name: string | null
  image: string | null
}

// kept for backward compat
type UserScoreBannerProps = {
  usr: SessionUser
  userBadges: UserBadge[]
  allFaecher: { id: string; name: string }[]
  userFachExperience: { fachId: string; experience: number; level: number | null }[]
  totalXP: number
}

// ── PlayerProfile ────────────────────────────────────────────────────────────

type PlayerProfileProps = { usr: SessionUser; totalXP: number }

export function PlayerProfile({ usr, totalXP }: PlayerProfileProps) {
  const playerLevel = Math.floor(Math.sqrt(totalXP / 120))
  const playerLevelName = getLevelName(playerLevel)
  const currentLevelXP = 120 * playerLevel * playerLevel
  const nextLevelXP = 120 * (playerLevel + 1) * (playerLevel + 1)
  const progressToNextLevel = Math.max(
    2,
    Math.min(100, ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100),
  )
  const xpToNextLevel = nextLevelXP - totalXP
  const displayName = usr.name ?? 'Anonym'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="panel shadowhard rounded-2xl border border-border/60 p-5 h-full">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative shrink-0">
          <div className="p-[3px] rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-700 shadow-lg shadow-emerald-500/30">
            <Avatar className="w-28 h-28 border-2 border-background">
              <AvatarImage src={usr.image ?? undefined} alt={displayName} />
              <AvatarFallback className="text-4xl font-bold">{initial}</AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full px-2.5 py-1 shadow-md shadow-emerald-500/40 whitespace-nowrap">
            <Shield className="h-2.5 w-2.5" />
            Lv.&nbsp;{playerLevel}
          </div>
        </div>
        <div className="w-full min-w-0 pt-2">
          <p className="font-bold text-xl leading-tight truncate">{displayName}</p>
          <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 rounded px-1.5 py-0.5">
            {playerLevelName}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-amber-500">
            <Zap className="h-3.5 w-3.5" />
            {totalXP.toLocaleString('de-DE')} XP
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <ChevronUp className="h-3.5 w-3.5 text-emerald-500" />
            {xpToNextLevel.toLocaleString('de-DE')} bis Lv.{playerLevel + 1}
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-muted/60 overflow-hidden border border-border/40">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700"
            style={{ width: `${progressToNextLevel}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ── AchievementsShowcase ─────────────────────────────────────────────────────

type AchievementsShowcaseProps = { userBadges: UserBadge[] }

export function AchievementsShowcase({ userBadges }: AchievementsShowcaseProps) {
  return (
    <div className="panel shadowhard rounded-2xl border border-amber-500/25 p-6 h-full bg-gradient-to-br from-amber-500/5 via-transparent to-transparent relative overflow-hidden">
      {/* Decorative shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-500">
          <Trophy className="h-4 w-4" />
          Errungenschaften
        </h2>
        <span className="text-xs font-bold bg-amber-500/15 border border-amber-500/30 rounded-full px-3 py-1 text-amber-600 dark:text-amber-400">
          {userBadges.length} {userBadges.length === 1 ? 'Abzeichen' : 'Abzeichen'} verdient
        </span>
      </div>

      {userBadges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
          <div className="relative">
            <Trophy className="h-14 w-14 text-amber-500/15" />
          </div>
          <p className="font-semibold text-muted-foreground">Dein Vitrinenschrank ist noch leer</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs">
            Schließe Quests und Lernpfade ab, um seltene Abzeichen zu verdienen!
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {userBadges.map(({ badge }) => (
            <Link key={badge.id} href={`/badges/${badge.id}`}>
              <div className="group relative flex flex-col items-center gap-2 hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                {/* Glow halo */}
                <div className="absolute -inset-2 bg-amber-400/20 rounded-3xl blur-xl scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-400 pointer-events-none" />
                {/* Badge frame */}
                <div className="relative w-[88px] h-[88px] rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border-2 border-amber-300/80 shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/50 group-hover:border-amber-200 transition-all duration-300 flex items-center justify-center overflow-hidden">
                  <Avatar className="h-[68px] w-[68px]">
                    <AvatarImage src={badge.imageUrl} alt={badge.name} />
                    <AvatarFallback className="text-2xl font-bold text-amber-800 bg-transparent">✦</AvatarFallback>
                  </Avatar>
                  {/* Top shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none rounded-2xl" />
                  {/* Bottom depth */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-700/25 to-transparent pointer-events-none" />
                </div>
                <p className="text-[11px] font-medium text-center leading-tight max-w-[88px] text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                  {badge.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FachMastery (used in tabs) ───────────────────────────────────────────────

export const fachIcons: Record<string, string> = {
  Mathe: '🧮', Biologie: '🧬', Deutsch: '📚', Englisch: '🗣️',
  Gesellschaft: '🌍', Informatik: '💻', Kunst: '🎨',
  Makerspace: '🛠️', 'NW/T': '🔬', Physik: '⚛️',
}

export const fachAccent: Record<string, { border: string; bar: string; track: string; glow: string }> = {
  Mathe:        { border: 'border-l-blue-500',   bar: 'from-blue-600 to-blue-400',     track: 'bg-blue-500/20',   glow: 'bg-blue-500/10' },
  Biologie:     { border: 'border-l-green-500',  bar: 'from-green-600 to-emerald-400', track: 'bg-green-500/20',  glow: 'bg-green-500/10' },
  Deutsch:      { border: 'border-l-orange-500', bar: 'from-orange-500 to-amber-400',  track: 'bg-orange-500/20', glow: 'bg-orange-500/10' },
  Englisch:     { border: 'border-l-sky-500',    bar: 'from-sky-500 to-cyan-400',      track: 'bg-sky-500/20',    glow: 'bg-sky-500/10' },
  Gesellschaft: { border: 'border-l-teal-500',   bar: 'from-teal-500 to-teal-300',     track: 'bg-teal-500/20',   glow: 'bg-teal-500/10' },
  Informatik:   { border: 'border-l-purple-500', bar: 'from-purple-600 to-violet-400', track: 'bg-purple-500/20', glow: 'bg-purple-500/10' },
  Kunst:        { border: 'border-l-pink-500',   bar: 'from-pink-500 to-rose-400',     track: 'bg-pink-500/20',   glow: 'bg-pink-500/10' },
  Makerspace:   { border: 'border-l-amber-500',  bar: 'from-amber-500 to-yellow-400',  track: 'bg-amber-500/20',  glow: 'bg-amber-500/10' },
  'NW/T':       { border: 'border-l-cyan-500',   bar: 'from-cyan-500 to-teal-400',     track: 'bg-cyan-500/20',   glow: 'bg-cyan-500/10' },
  Physik:       { border: 'border-l-violet-500', bar: 'from-violet-600 to-purple-400', track: 'bg-violet-500/20', glow: 'bg-violet-500/10' },
}
export const defaultFachAccent = { border: 'border-l-slate-500', bar: 'from-slate-500 to-slate-400', track: 'bg-slate-500/20', glow: 'bg-slate-500/10' }

// ── FachPanel ────────────────────────────────────────────────────────────────

type FachPanelProps = {
  allFaecher: { id: string; name: string }[]
  userFachExperience: { fachId: string; experience: number; level: number | null }[]
}

export function FachPanel({ allFaecher, userFachExperience }: FachPanelProps) {
  const xpMap = userFachExperience.reduce(
    (acc, curr) => { acc[curr.fachId] = curr; return acc },
    {} as Record<string, { experience: number; level: number | null }>,
  )

  return (
    <div className="panel shadowhard rounded-2xl border border-border/60 p-5">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        <BookOpen className="h-3.5 w-3.5" />
        Fach-Meisterschaften
      </h3>
      <div className="space-y-2">
        {allFaecher.map((fach) => {
          const data = xpMap[fach.id]
          const experience = data?.experience ?? 0
          const level = data?.level ?? 1
          const fachCurrentXP = 12 * level * level
          const fachNextXP = 12 * (level + 1) * (level + 1)
          const levelProgress = Math.max(
            0,
            Math.min(100, ((experience - fachCurrentXP) / (fachNextXP - fachCurrentXP)) * 100),
          )
          const fachXpToNext = fachNextXP - experience
          const accent = fachAccent[fach.name] ?? defaultFachAccent

          return (
            <div
              key={fach.id}
              className={`rounded-lg border border-border/50 border-l-4 ${accent.border} ${accent.glow} px-3 py-2.5 space-y-1.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1.5 truncate">
                  <span>{fachIcons[fach.name]}</span>
                  {fach.name}
                </span>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 shrink-0 ml-2">
                  Lv.{level}
                </span>
              </div>
              <div className={`relative h-2.5 rounded-full ${accent.track} overflow-hidden border border-white/5`}>
                <div
                  className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${accent.bar} transition-all duration-700 shadow-sm`}
                  style={{ width: `${Math.max(levelProgress, 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{experience} XP</span>
                <span>+{fachXpToNext} XP bis Lv.{level + 1}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── UserScoreBanner (backward compat) ────────────────────────────────────────

export const UserScoreBanner = ({ usr, userBadges, totalXP }: UserScoreBannerProps) => (
  <div className="max-w-6xl mx-auto space-y-4">
    <PlayerProfile usr={usr} totalXP={totalXP} />
    <AchievementsShowcase userBadges={userBadges} />
  </div>
)
