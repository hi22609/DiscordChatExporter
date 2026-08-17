import { create } from 'zustand';
import { PITTSBURGH } from '@/constants/geo';

interface LocationState {
  coords: { lat: number; lng: number } | null;
  city: string;
  permissionGranted: boolean | null;
  isFetching: boolean;

  setCoords: (coords: { lat: number; lng: number }) => void;
  setCity: (city: string) => void;
  setPermissionGranted: (granted: boolean) => void;
  setFetching: (fetching: boolean) => void;
  getCoords: () => { lat: number; lng: number };
}

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: null,
  city: 'Pittsburgh',
  permissionGranted: null,
  isFetching: false,

  setCoords: (coords) => set({ coords }),
  setCity: (city) => set({ city }),
  setPermissionGranted: (permissionGranted) => set({ permissionGranted }),
  setFetching: (isFetching) => set({ isFetching }),

  // Falls back to Pittsburgh if no location yet
  getCoords: () => get().coords ?? PITTSBURGH,
}));
