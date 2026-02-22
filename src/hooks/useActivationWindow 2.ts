import { useEffect, useState } from 'react';
import { isInActivationWindow, nextActivationWindow } from '../utils/time';

export const useActivationWindow = () => {
  const [inWindow, setInWindow] = useState(false);
  const [nextStart, setNextStart] = useState<Date>(nextActivationWindow(new Date()));
  const [countdown, setCountdown] = useState('00:00:00');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const inWin = isInActivationWindow(now);
      setInWindow(inWin);
      const nextWin = nextActivationWindow(now);
      setNextStart(nextWin);
      const diff = nextWin.getTime() - now.getTime();
      const h = Math.floor(diff / 1000 / 3600)
        .toString()
        .padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60)
        .toString()
        .padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60)
        .toString()
        .padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { inWindow, nextStart, countdown };
};
