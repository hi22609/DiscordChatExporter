import { useEffect, useRef } from 'react';
import { fetchBTCPrice, fetchFearGreed } from '../utils/api';
import { useStore } from '../utils/store';

export function useLiveData() {
  const { updatePrice, updateFearGreed } = useStore();
  const timerRef = useRef(null);

  async function refresh() {
    try {
      const [price, fg] = await Promise.all([fetchBTCPrice(), fetchFearGreed()]);
      updatePrice(price);
      updateFearGreed(fg);
    } catch (e) {
      // silent — stale data shown
    }
  }

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, 60000);
    return () => clearInterval(timerRef.current);
  }, []);
}
