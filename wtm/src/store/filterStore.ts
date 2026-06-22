import { create } from 'zustand';
import type { FilterState, MoveCategory } from '@/types/app';

interface FilterStoreState extends FilterState {
  setCategory: (category: MoveCategory | null) => void;
  setRadius: (meters: number) => void;
  setTimeWindow: (window: FilterState['timeWindow']) => void;
  reset: () => void;
}

const defaults: FilterState = {
  category: null,
  radiusMeters: 8047,
  timeWindow: '24h',
};

export const useFilterStore = create<FilterStoreState>((set) => ({
  ...defaults,
  setCategory: (category) => set({ category }),
  setRadius: (radiusMeters) => set({ radiusMeters }),
  setTimeWindow: (timeWindow) => set({ timeWindow }),
  reset: () => set(defaults),
}));
