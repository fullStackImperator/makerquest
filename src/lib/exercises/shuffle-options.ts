/** Deterministic shuffle — same order on server and client (avoids hydration mismatch). */
export function shuffleOptionsWithSeed<T>(items: T[], seed: string): T[] {
  const arr = [...items]
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  for (let i = arr.length - 1; i > 0; i--) {
    h = (Math.imul(1103515245, h) + 12345) | 0
    const j = (h >>> 0) % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
