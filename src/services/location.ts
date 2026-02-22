import * as Location from 'expo-location';
import { getDistanceMeters } from '../utils/haversine';
import { Arena } from './firestore';

export const requestLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  return Location.getCurrentPositionAsync({});
};

export const isInsideArena = (coords: { latitude: number; longitude: number }, arena: Arena) => {
  const distance = getDistanceMeters(
    coords.latitude,
    coords.longitude,
    arena.latitude,
    arena.longitude
  );
  return { inZone: distance <= arena.radius, distance };
};
