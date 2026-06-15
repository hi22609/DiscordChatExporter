import { useState, useEffect } from 'react';
import { getCountdown, ATH_DATE } from '../utils/cycle';

export function useCountdown(targetDate = ATH_DATE) {
  const [cd, setCd] = useState(getCountdown(targetDate));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(targetDate)), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  return cd;
}
