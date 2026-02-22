import { useEffect, useState } from 'react';
import { Arena } from '../services/firestore';
import { requestLocation, isInsideArena } from '../services/location';

export const useZone = (arena: Arena | null) => {
  const [inZone, setInZone] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      if (!arena) {
        setInZone(false);
        setDistance(null);
        return;
      }
      try {
        const loc = await requestLocation();
        const { inZone: inside, distance: dist } = isInsideArena(loc.coords, arena);
        setInZone(inside);
        setDistance(dist);
      } catch (e: any) {
        setError(e.message);
      }
    };
    check();
  }, [arena?.id]);

  return { inZone, distance, error };
};
