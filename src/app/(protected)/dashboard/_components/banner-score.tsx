'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Zap, Shield, Trophy, BookOpen, ArrowUpRight, ArrowDown, Camera, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUploadThing } from '@/lib/uploadthing'
import { updateMyAvatar } from '@/app/(protected)/profil/_actions/update-my-profile'
import { getLevelName } from '@/lib/levelNames'
import { CARD, CARD_INNER, FONT, NEON, NEON_CARD, TEXT, neonCard } from './glass-styles'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserBadge {
  badge: { id: string; name: string; imageUrl: string; createdAt?: Date; updatedAt?: Date }
}
type SessionUser = { id: string; name: string | null; image: string | null }
type UserScoreBannerProps = {
  usr: SessionUser
  userBadges: UserBadge[]
  allFaecher: { id: string; name: string }[]
  userFachExperience: { fachId: string; experience: number; level: number | null }[]
  totalXP: number
}

// ── PlayerProfile ──────────────────────────────────────────────────────────────

type PlayerProfileProps = { usr: SessionUser; totalXP: number; activeCount: number; completedCount: number }

export function PlayerProfile({ usr, totalXP, activeCount, completedCount }: PlayerProfileProps) {
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

  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const { startUpload, isUploading: avatarBusy } = useUploadThing('profileImage', {
    onUploadError: (error) => {
      toast.error(error.message || 'Upload fehlgeschlagen')
    },
  })

  const onAvatarFile = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const uploaded = await startUpload([file])
    if (fileRef.current) fileRef.current.value = ''
    const url = uploaded?.[0]?.serverData?.url ?? uploaded?.[0]?.ufsUrl
    if (!url) return
    const result = await updateMyAvatar(url)
    if (!result.success) return void toast.error(result.error)
    toast.success('Profilbild aktualisiert')
    router.refresh()
  }

  const scrollAndSwitch = (tab: string) => {
    window.dispatchEvent(new CustomEvent('dash-tab', { detail: tab }))
    document.getElementById('quests-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ ...neonCard('fuchsia'), padding: '1.5rem' }} className={`h-full flex flex-col ${NEON_CARD}`}>

      {/* Section label */}
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] mb-4"
         style={{ color: TEXT.muted, fontFamily: FONT }}>
        <Shield className="h-3 w-3" />
        Spielerprofil
      </p>

      <div className="flex flex-col items-center gap-4 text-center flex-1">
        {/* Avatar — click to upload a new picture */}
        <div className="relative">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
            className="group/avatar relative block rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300"
            aria-label="Profilbild ändern"
            title="Profilbild ändern"
          >
          <Avatar
            className="w-32 h-32"
            style={{ background: '#1a2d3d', boxShadow: `0 0 0 4px ${NEON.fuchsia.solid}, 0 0 28px ${NEON.fuchsia.glow}` }}
          >
            <AvatarImage src={usr.image ?? undefined} alt={displayName} />
            <AvatarFallback
              className="text-4xl font-bold"
              style={{ background: '#1a2d3d', color: '#ffffff', fontFamily: FONT }}
            >
              {initial}
            </AvatarFallback>
          </Avatar>
            <span
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white transition-opacity ${avatarBusy ? 'opacity-100' : 'opacity-0 group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100'}`}
              aria-hidden
            >
              {avatarBusy ? <Loader2 className="size-7 animate-spin" /> : <Camera className="size-7" />}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onAvatarFile(e.target.files)}
          />
          {/* LV chip */}
          <div
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold rounded-full px-2.5 py-0.5"
            style={{ background: NEON.fuchsia.solid, color: NEON.fuchsia.ink, boxShadow: `0 0 10px ${NEON.fuchsia.glow}`, fontFamily: FONT }}
          >
            LV. {playerLevel}
          </div>
        </div>

        <div className="pt-1.5 w-full">
          <p className="font-bold text-lg leading-tight truncate" style={{ color: TEXT.primary, fontFamily: FONT }}>
            {displayName}
          </p>
          <span
            className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-widest rounded-full px-3 py-0.5"
            style={{ color: '#459ea1', background: 'rgba(69,158,161,0.09)', border: '1px solid rgba(69,158,161,0.18)', fontFamily: FONT }}
          >
            {playerLevelName}
          </span>
        </div>
      </div>

      {/* XP bar */}
      <div className="mt-5 space-y-2">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#c97c18', fontFamily: FONT }}>
            <Zap className="h-3.5 w-3.5" />
            {totalXP.toLocaleString('de-DE')} XP
          </span>
          <span className="text-[10px]" style={{ color: TEXT.faint, fontFamily: FONT }}>
            +{xpToNextLevel.toLocaleString('de-DE')} → Lv.{playerLevel + 1}
          </span>
        </div>
        <div className="relative h-2 rounded-full" style={{ background: NEON.yellow.soft }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: `${progressToNextLevel}%`,
              background: `linear-gradient(90deg, ${NEON.orange.solid}, ${NEON.yellow.solid})`,
              boxShadow: `0 0 10px ${NEON.yellow.glow}`,
            }}
          />
        </div>
      </div>

      {/* Quest stat links */}
      <div
        className="mt-4 pt-4 grid grid-cols-2"
        style={{ borderTop: '1px solid rgba(100,160,220,0.15)' }}
      >
        <button
          onClick={() => scrollAndSwitch('active')}
          className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg hover:bg-black/4 transition-colors cursor-pointer"
        >
          <span className="text-2xl font-bold tabular-nums" style={{ color: '#459ea1', fontFamily: FONT }}>
            {activeCount}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-widest" style={{ color: TEXT.muted, fontFamily: FONT }}>
            Aktive Quests <ArrowDown className="h-2.5 w-2.5" />
          </span>
        </button>

        <button
          onClick={() => scrollAndSwitch('completed')}
          className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg hover:bg-black/4 transition-colors cursor-pointer"
          style={{ borderLeft: '1px solid rgba(100,160,220,0.15)' }}
        >
          <span className="text-2xl font-bold tabular-nums" style={{ color: '#1a9060', fontFamily: FONT }}>
            {completedCount}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-widest" style={{ color: TEXT.muted, fontFamily: FONT }}>
            Abgeschlossen <ArrowDown className="h-2.5 w-2.5" />
          </span>
        </button>
      </div>
    </div>
  )
}

// ── AchievementsShowcase ───────────────────────────────────────────────────────

type AchievementsShowcaseProps = { userBadges: UserBadge[] }

export function AchievementsShowcase({ userBadges }: AchievementsShowcaseProps) {
  return (
    <div style={{ ...CARD, padding: '1.25rem 1.5rem' }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
           style={{ color: TEXT.muted, fontFamily: FONT }}>
          <Trophy className="h-3 w-3" />
          Deine Erfolge
        </p>
        <Link href="/badges">
          <span className="flex items-center gap-1 text-[10px] font-semibold hover:underline"
                style={{ color: TEXT.muted, fontFamily: FONT }}>
            Alle Erfolge <ArrowUpRight className="h-3 w-3" />
          </span>
        </Link>
      </div>

      {userBadges.length === 0 ? (
        <div className="flex items-center gap-4 py-4">
          <div className="p-3 rounded-2xl shrink-0" style={{ background: 'rgba(201,124,24,0.07)', border: '1px solid rgba(201,124,24,0.14)' }}>
            <Trophy className="h-7 w-7" style={{ color: 'rgba(201,124,24,0.28)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: TEXT.muted, fontFamily: FONT }}>Vitrinenschrank noch leer</p>
            <p className="text-xs mt-0.5" style={{ color: TEXT.faint }}>Schließe Quests ab, um Abzeichen zu verdienen</p>
          </div>
        </div>
      ) : (
        /* Horizontal scroll row — like the reference */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {userBadges.map(({ badge }) => (
            <Link key={badge.id} href={`/badges/${badge.id}`}>
              <div
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                style={{ ...CARD_INNER }}
              >
                <div
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: 'rgba(201,124,24,0.10)', border: '1px solid rgba(201,124,24,0.20)' }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={badge.imageUrl} alt={badge.name} />
                    <AvatarFallback className="text-sm font-bold bg-transparent" style={{ color: '#c97c18' }}>✦</AvatarFallback>
                  </Avatar>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:text-amber-600 transition-colors"
                     style={{ color: TEXT.secondary, fontFamily: FONT }}>
                    {badge.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Fach colour maps ───────────────────────────────────────────────────────────

export const fachIcons: Record<string, string> = {
  Mathe: '🧮', Biologie: '🧬', Deutsch: '📚', Englisch: '🗣️',
  Gesellschaft: '🌍', Informatik: '💻', Kunst: '🎨',
  Makerspace: '🛠️', 'NW/T': '🔬', Physik: '⚛️',
}

const fachColor: Record<string, { dot: string; bar: string; pill: string; pillBg: string }> = {
  Mathe:        { dot: '#38bdf8', bar: '#38bdf8', pill: '#0369a1', pillBg: 'rgba(56,189,248,0.10)'  },
  Biologie:     { dot: '#34d399', bar: '#34d399', pill: '#047857', pillBg: 'rgba(52,211,153,0.10)'  },
  Deutsch:      { dot: '#fb923c', bar: '#fb923c', pill: '#c2410c', pillBg: 'rgba(251,146,60,0.10)'  },
  Englisch:     { dot: '#60a5fa', bar: '#60a5fa', pill: '#1d4ed8', pillBg: 'rgba(96,165,250,0.10)'  },
  Gesellschaft: { dot: '#2dd4bf', bar: '#2dd4bf', pill: '#0f766e', pillBg: 'rgba(45,212,191,0.10)'  },
  Informatik:   { dot: '#c084fc', bar: '#c084fc', pill: '#7e22ce', pillBg: 'rgba(192,132,252,0.10)' },
  Kunst:        { dot: '#f472b6', bar: '#f472b6', pill: '#be185d', pillBg: 'rgba(244,114,182,0.10)' },
  Makerspace:   { dot: '#fbbf24', bar: '#fbbf24', pill: '#b45309', pillBg: 'rgba(251,191,36,0.10)'  },
  'NW/T':       { dot: '#22d3ee', bar: '#22d3ee', pill: '#0e7490', pillBg: 'rgba(34,211,238,0.10)'  },
  Physik:       { dot: '#a78bfa', bar: '#a78bfa', pill: '#6d28d9', pillBg: 'rgba(167,139,250,0.10)' },
}
const defaultFachColor = { dot: '#94a3b8', bar: '#94a3b8', pill: '#475569', pillBg: 'rgba(148,163,184,0.10)' }

// backward-compat exports
export const fachAccent: Record<string, { border: string; bar: string; track: string; glow: string }> = {
  Mathe:        { border: 'border-l-blue-400',    bar: 'from-blue-400 to-sky-300',      track: 'bg-blue-400/10',    glow: 'bg-blue-400/5'    },
  Biologie:     { border: 'border-l-emerald-400', bar: 'from-emerald-400 to-green-300', track: 'bg-emerald-400/10', glow: 'bg-emerald-400/5' },
  Deutsch:      { border: 'border-l-orange-400',  bar: 'from-orange-400 to-amber-300',  track: 'bg-orange-400/10',  glow: 'bg-orange-400/5'  },
  Englisch:     { border: 'border-l-sky-400',     bar: 'from-sky-400 to-blue-300',      track: 'bg-sky-400/10',     glow: 'bg-sky-400/5'     },
  Gesellschaft: { border: 'border-l-teal-400',    bar: 'from-teal-400 to-teal-200',     track: 'bg-teal-400/10',    glow: 'bg-teal-400/5'    },
  Informatik:   { border: 'border-l-purple-400',  bar: 'from-purple-400 to-violet-300', track: 'bg-purple-400/10',  glow: 'bg-purple-400/5'  },
  Kunst:        { border: 'border-l-pink-400',    bar: 'from-pink-400 to-rose-300',     track: 'bg-pink-400/10',    glow: 'bg-pink-400/5'    },
  Makerspace:   { border: 'border-l-amber-400',   bar: 'from-amber-400 to-yellow-300',  track: 'bg-amber-400/10',   glow: 'bg-amber-400/5'   },
  'NW/T':       { border: 'border-l-cyan-400',    bar: 'from-cyan-400 to-teal-300',     track: 'bg-cyan-400/10',    glow: 'bg-cyan-400/5'    },
  Physik:       { border: 'border-l-violet-400',  bar: 'from-violet-400 to-purple-300', track: 'bg-violet-400/10',  glow: 'bg-violet-400/5'  },
}
export const defaultFachAccent = { border: 'border-l-slate-400', bar: 'from-slate-400 to-slate-300', track: 'bg-slate-400/10', glow: 'bg-slate-400/5' }

// ── FachPanel ─────────────────────────────────────────────────────────────────

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
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] mb-3 px-1"
         style={{ color: TEXT.muted, fontFamily: FONT }}>
        <BookOpen className="h-3 w-3" />
        Deine Fächer
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
          const c = fachColor[fach.name] ?? defaultFachColor

          return (
            <div
              key={fach.id}
              style={{ ...CARD, padding: '0.875rem 1rem' }}
              className="transition-transform duration-150 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT.primary, fontFamily: FONT }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                  {fach.name}
                </span>
                <span
                  className="text-[9px] font-bold rounded-full px-2 py-0.5 shrink-0"
                  style={{ color: c.pill, background: c.pillBg, border: `1px solid ${c.dot}30`, fontFamily: FONT }}
                >
                  Lv. {level}
                </span>
              </div>

              <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: `${c.dot}18` }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(levelProgress, 0)}%`, background: c.bar }}
                />
              </div>

              <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: TEXT.faint, fontFamily: FONT }}>
                <span>{experience} XP</span>
                <span>+{fachXpToNext} XP → Lv.{level + 1}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── backward compat ───────────────────────────────────────────────────────────

export const UserScoreBanner = ({ usr, userBadges, totalXP }: UserScoreBannerProps) => (
  <div className="max-w-6xl mx-auto space-y-4">
    <PlayerProfile usr={usr} totalXP={totalXP} activeCount={0} completedCount={0} />
    <AchievementsShowcase userBadges={userBadges} />
  </div>
)
