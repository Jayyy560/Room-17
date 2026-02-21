import * as Location from 'expo-location';
import { getDistanceMeters } from '../utils/haversine';

const ZONE = {
  id: 'campus-zone-1',
  latitude: 30.1742433,
  longitude: 77.3068033,
  radius: 100,
};

export const requestLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  return Location.getCurrentPositionAsync({});
};

export const isInsideZone = (coords: { latitude: number; longitude: number }) => {
  const distance = getDistanceMeters(
    coords.latitude,
    coords.longitude,
    ZONE.latitude,
    ZONE.longitude
  );
  return { inZone: distance <= ZONE.radius, distance, zone: ZONE };
};

export const zoneInfo = ZONE;
