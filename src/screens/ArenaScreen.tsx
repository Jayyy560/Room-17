import React, { useEffect, useMemo, useState } from 'react';
import { Text, View, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../utils/theme';
import { useAuthContext } from '../hooks/useAuth';
import { useArenaContext } from '../hooks/useArena';
import { useArenaWindow } from '../hooks/useArenaWindow';
import { activateUserInArena, deactivateUserInArena, listenArenas, Arena } from '../services/firestore';
import { requestLocation, isInsideArena } from '../services/location';
import { Countdown } from '../components/Countdown';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const ArenaScreen: React.FC = () => {
  const { user, profile } = useAuthContext();
  const { arena, setArena } = useArenaContext();
  const [eligibleArenas, setEligibleArenas] = useState<Arena[]>([]);
  const [distanceMap, setDistanceMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { inWindow, countdown } = useArenaWindow(arena);
  const [activating, setActivating] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const load = async () => {
      try {
        setLoading(true);
        const loc = await requestLocation();
        unsub = listenArenas(arenas => {
          const now = new Date();
          const activeByTime = arenas.filter(a => {
            const start = a.startTime?.toDate?.() || new Date(a.startTime as any);
            const end = a.endTime?.toDate?.() || new Date(a.endTime as any);
            return a.isActive && now >= start && now <= end;
          });
          if (arena) {
            const updated = arenas.find(a => a.id === arena.id);
            if (updated) setArena(updated);
          }
          const distances: Record<string, number> = {};
          const inside = activeByTime.filter(a => {
            const { inZone, distance } = isInsideArena(loc.coords, a);
            distances[a.id] = distance;
            return inZone;
          });
          setDistanceMap(distances);
          setEligibleArenas(inside);
          if (!arena && inside.length === 1) setArena(inside[0]);
        });
      } catch (e: any) {
        setLocationError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (unsub) unsub();
    };
  }, [arena, setArena]);

  const inZone = useMemo(() => {
    if (!arena) return false;
    const distance = distanceMap[arena.id];
    return typeof distance === 'number' ? distance <= arena.radius : false;
  }, [arena, distanceMap]);

  const handleActivate = async () => {
    if (!user) return;
    if (!arena) return Alert.alert('Select arena', 'Pick an arena to activate.');
    if (!inZone) return Alert.alert('Not in zone', 'Get closer to the arena.');
    if (!inWindow) return Alert.alert('Closed', 'Arena is not active right now.');
    try {
      setActivating(true);
      await activateUserInArena(user.uid, arena.id);
      Alert.alert('Arena unlocked', 'You are live with 3 signals.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user || !arena) return;
    try {
      await deactivateUserInArena(user.uid, arena.id);
      Alert.alert('Deactivated', 'You are no longer active in this arena.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20, paddingTop: 48 }}>
      <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800' }}>Arena</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 6 }}>Select an active arena near you.</Text>

      <View style={{ backgroundColor: theme.colors.card, padding: 14, borderRadius: 14, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
        <Text style={{ color: theme.colors.muted }}>Arena</Text>
        <Text style={{ color: theme.colors.text, fontWeight: '700', marginTop: 4 }}>{arena?.name || 'Not selected'}</Text>
        <Text style={{ color: theme.colors.text, marginTop: 8 }}>
          {locationError
            ? locationError
            : !arena
              ? loading
                ? 'Checking nearby arenas...'
                : 'No arena selected.'
              : inZone
                ? 'You are in the arena radius.'
                : `Distance: ${distanceMap[arena.id]?.toFixed(1) || '?'} m`}
        </Text>
      </View>

      {eligibleArenas.length > 1 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.muted, marginBottom: 8 }}>Multiple arenas detected:</Text>
          {eligibleArenas.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setArena(item)}
              style={{
                backgroundColor: arena?.id === item.id ? theme.colors.cardAlt : theme.colors.card,
                padding: 12,
                borderRadius: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{item.radius} m radius</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!loading && eligibleArenas.length === 0 && (
        <Text style={{ color: theme.colors.muted, marginTop: 16 }}>No active arenas nearby.</Text>
      )}

      {!inWindow && <Countdown label="Next activation" value={countdown} />}

      <TouchableOpacity
        onPress={handleActivate}
        disabled={!arena || !inZone || !inWindow || activating}
        style={{
          backgroundColor: inZone && inWindow ? theme.colors.cardAlt : theme.colors.card,
          padding: 16,
          borderRadius: 24,
          marginTop: 18,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: theme.colors.buttonBorder,
        }}
      >
        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 18 }}>
          {activating ? 'Activating...' : 'Enter Arena'}
        </Text>
        <Text style={{ color: theme.colors.muted, marginTop: 4 }}>You must be inside the arena during its active window.</Text>
      </TouchableOpacity>

      {arena && profile?.activeArenaId === arena.id && (!inZone || !inWindow) && (
        <TouchableOpacity
          onPress={handleDeactivate}
          style={{ marginTop: 12, alignItems: 'center' }}
        >
          <Text style={{ color: theme.colors.warning }}>Deactivate for now</Text>
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: 'row', marginTop: 18, justifyContent: 'space-between' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Signals')}
          style={{ backgroundColor: theme.colors.cardAlt, padding: 14, borderRadius: 18, flex: 1, marginRight: 8, borderWidth: 1, borderColor: theme.colors.border }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '800', textAlign: 'center' }}>Signals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Matches')}
          style={{ backgroundColor: theme.colors.cardAlt, padding: 14, borderRadius: 18, flex: 1, marginLeft: 8, borderWidth: 1, borderColor: theme.colors.border }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '800', textAlign: 'center' }}>Matches</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        style={{ marginTop: 16, alignItems: 'center' }}
      >
        <Text style={{ color: theme.colors.accent }}>View profile & safety</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Stats</Text>
        <Text style={{ color: theme.colors.muted }}>Bravery: {profile?.braveryPoints || 0}</Text>
        <Text style={{ color: theme.colors.muted }}>Level: {profile?.level || 1}</Text>
        <Text style={{ color: theme.colors.muted }}>Signals: {profile?.signalsRemaining || 0}</Text>
      </View>
    </View>
  );
};

export default ArenaScreen;
