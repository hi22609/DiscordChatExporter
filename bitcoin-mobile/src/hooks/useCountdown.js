import { useState, useEffect } from 'react';
import { getCountdown, getNextEvent } from '../utils/cycle';

export function useCountdown(targetDate = getNextEvent().date) {
  const [cd, setCd] = useState(getCountdown(targetDate));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(targetDate)), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  return cd;
}
