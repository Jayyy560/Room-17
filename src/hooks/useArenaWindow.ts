import { useEffect, useState } from 'react';
import { msToCountdown, isWithinTimeRange } from '../utils/time';
import { Arena } from '../services/firestore';

export const useArenaWindow = (arena: Arena | null) => {
  const [inWindow, setInWindow] = useState(false);
  const [countdown, setCountdown] = useState('00:00:00');

  useEffect(() => {
    const tick = () => {
      if (!arena) {
        setInWindow(false);
        setCountdown('00:00:00');
        return;
      }
      const now = new Date();
      const start = arena.startTime?.toDate?.() || new Date(arena.startTime as any);
      const end = arena.endTime?.toDate?.() || new Date(arena.endTime as any);
      setInWindow(isWithinTimeRange(now, start, end));
      if (now < start) {
        setCountdown(msToCountdown(start.getTime() - now.getTime()));
      } else {
        setCountdown('00:00:00');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [arena?.id, arena?.startTime, arena?.endTime]);

  return { inWindow, countdown };
};
