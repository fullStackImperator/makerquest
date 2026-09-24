/**
 * Rules for display names (students see each other's names in the
 * leaderboard, teachers in the journal). Used by the profile form, the
 * teacher user editor and the Better Auth hooks.
 */

// Blocked anywhere inside the name (long enough to not hit real names).
const BLOCKED_SUBSTRINGS = [
  'hitler', 'goebbels', 'gobbels', 'himmler', 'nsdap', 'siegheil', 'heilhitler',
  'holocaust', 'auschwitz', 'gaskammer', 'judenhass', 'reichsfuhrer',
  'hurensohn', 'hurenkind', 'wichser', 'fotze', 'schlampe', 'missgeburt', 'spast',
  'schwuchtel', 'kanake', 'nigger', 'nigga', 'motherfucker', 'fuck', 'arschloch',
  'penis', 'vagina', 'porno', 'bitch', 'kinderficker',
]

// Blocked only as a whole word (would otherwise match real names like "Nazif").
// Real surnames/first names such as Heil, Jude, Isis, Führer or Kot are left out on purpose.
const BLOCKED_WORDS = [
  'nazi', 'nazis', 'ss', 'kkk', 'fick', 'ficken', 'arsch', 'hure', 'neger',
  'sex', 'pisse', 'titten', 'juden', 'terrorist',
]

/** Lowercase, umlauts folded, common look-alike digits/symbols mapped to letters. */
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[8]/g, 'b')
}

/** True if the name contains an offensive or extremist term. */
export function isNameBlocked(name: string | null | undefined) {
  if (!name) return false
  const normalized = normalize(name)
  // "H i t l e r", "h.i.t.l.e.r" → "hitler"
  const squashed = normalized.replace(/[^a-z]/g, '')
  if (BLOCKED_SUBSTRINGS.some((term) => squashed.includes(term.replace(/[^a-z]/g, '')))) {
    return true
  }
  const words = normalized.split(/[^a-z]+/).filter(Boolean)
  return words.some((word) => BLOCKED_WORDS.includes(word))
}

export type NameCheck = { ok: true; name: string } | { ok: false; error: string }

/** Full check for newly entered names: real first and last name, nothing offensive. */
export function checkDisplayName(input: string): NameCheck {
  const name = input.replace(/\s+/g, ' ').trim()
  if (name.length < 3 || name.length > 80) {
    return { ok: false, error: 'Bitte gib deinen Vor- und Nachnamen ein' }
  }
  if (!/^[\p{L}][\p{L}\p{M} .'’-]*$/u.test(name)) {
    return { ok: false, error: 'Der Name darf nur Buchstaben, Leerzeichen und Bindestriche enthalten' }
  }
  const parts = name.split(' ').filter((p) => /\p{L}{2,}/u.test(p))
  if (parts.length < 2) {
    return { ok: false, error: 'Bitte gib deinen Vor- und Nachnamen ein (z. B. Mia Schneider)' }
  }
  if (isNameBlocked(name)) {
    return {
      ok: false,
      error: 'Dieser Name ist nicht erlaubt. Bitte verwende deinen echten Vor- und Nachnamen.',
    }
  }
  return { ok: true, name }
}
