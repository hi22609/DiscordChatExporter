import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useShallow } from 'zustand/react/shallow';
import { useLocationStore } from '@/store/locationStore';

export function useLocationInit() {
  const { setCoords, setPermissionGranted, setFetching } = useLocationStore();

  useEffect(() => {
    requestLocation();
  }, []);

  async function requestLocation() {
    setFetching(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);

    if (granted) {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    }
    setFetching(false);
  }
}

export function useLocation() {
  return useLocationStore(
    useShallow((s) => ({
      coords: s.coords,
      city: s.city,
      permissionGranted: s.permissionGranted,
      isFetching: s.isFetching,
      getCoords: s.getCoords,
    }))
  );
}
