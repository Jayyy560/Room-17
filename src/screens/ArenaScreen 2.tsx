import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../utils/theme';
import { useAuthContext } from '../hooks/useAuth';
import { useZone } from '../hooks/useZone';
import { useActivationWindow } from '../hooks/useActivationWindow';
import { activateUserInZone } from '../services/firestore';
import { Countdown } from '../components/Countdown';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const ArenaScreen: React.FC = () => {
  const { user, profile } = useAuthContext();
  const { inZone, distance, zone, error } = useZone();
  const { inWindow, countdown } = useActivationWindow();
  const [activating, setActivating] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleActivate = async () => {
    if (!user) return;
    if (!inZone) return Alert.alert('Not in zone', 'Get closer to the arena.');
    if (!inWindow) return Alert.alert('Closed', 'Activation opens at 3 PM.');
    try {
      setActivating(true);
      await activateUserInZone(user.uid, zone.id);
      Alert.alert('Arena unlocked', 'You are live with 3 signals.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActivating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20, paddingTop: 48 }}>
      <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800' }}>Arena</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 6 }}>Zone radius 100m around campus beacon.</Text>

      <View style={{ backgroundColor: theme.colors.card, padding: 14, borderRadius: 14, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
        <Text style={{ color: theme.colors.muted }}>Zone</Text>
        <Text style={{ color: theme.colors.text, fontWeight: '700', marginTop: 4 }}>{zone.id}</Text>
        <Text style={{ color: theme.colors.text, marginTop: 8 }}>
          {error ? error : inZone ? 'You are in the arena radius.' : `Distance: ${distance?.toFixed(1) || '?'} m`}
        </Text>
      </View>

      {!inWindow && <Countdown label="Next activation" value={countdown} />}

      <TouchableOpacity
        onPress={handleActivate}
        disabled={!inZone || !inWindow || activating}
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
        <Text style={{ color: theme.colors.muted, marginTop: 4 }}>You must be on campus and in the 3-5 PM window.</Text>
      </TouchableOpacity>

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
