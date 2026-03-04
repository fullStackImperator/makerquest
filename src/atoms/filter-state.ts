// atoms/filter-state.ts
import { DifficultyLevel } from '@/generated/enums'
import { create } from 'zustand'

interface FilterState {
  currentCategoryId: string | null
  currentFachId: string | null
  currentKlassenstufe: number | null
  currentSchwierigkeit: DifficultyLevel | null
  setCategoryId: (id: string | null) => void
  setFachId: (id: string | null) => void
  setKlassenstufe: (klassenstufe: number | null) => void
  setSchwierigkeit: (schwierigkeit: DifficultyLevel | null) => void
}

export const useProjectStore = create<FilterState>((set) => ({
  currentCategoryId: null,
  currentFachId: null,
  currentKlassenstufe: null,
  currentSchwierigkeit: null,
  setCategoryId: (id) => set({ currentCategoryId: id }),
  setFachId: (id) => set({ currentFachId: id }),
  setKlassenstufe: (klassenstufe) => set({ currentKlassenstufe: klassenstufe }),
  setSchwierigkeit: (schwierigkeit) =>
    set({ currentSchwierigkeit: schwierigkeit }),
}))
