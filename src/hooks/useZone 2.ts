import { useEffect, useState } from 'react';
import { requestLocation, isInsideZone, zoneInfo } from '../services/location';

export const useZone = () => {
  const [inZone, setInZone] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const loc = await requestLocation();
        const { inZone: inside, distance: dist } = isInsideZone(loc.coords);
        setInZone(inside);
        setDistance(dist);
      } catch (e: any) {
        setError(e.message);
      }
    };
    check();
  }, []);

  return { inZone, distance, error, zone: zoneInfo };
};
