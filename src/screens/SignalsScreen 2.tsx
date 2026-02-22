import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../utils/theme';
import { useAuthContext } from '../hooks/useAuth';
import { useActivationWindow } from '../hooks/useActivationWindow';
import { listenActiveUsers, listenIncomingSignals, sendSignal, UserProfile } from '../services/firestore';
import { zoneInfo } from '../services/location';
import { UserCard } from '../components/UserCard';
import { MatchAnimation } from '../components/MatchAnimation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

const SignalsScreen: React.FC = () => {
  const { user, profile } = useAuthContext();
  const { inWindow } = useActivationWindow();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [anim, setAnim] = useState(false);
  const [incomingSignals, setIncomingSignals] = useState<any[]>([]);
  const [justSent, setJustSent] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const isAttractedToGender = (p: UserProfile | null, otherGender?: string | null) => {
    if (!p || !otherGender) return false;
    const gender = p.gender?.toLowerCase();
    const sexuality = (p.sexuality || 'Straight') as UserProfile['sexuality'];
    const target = otherGender.toLowerCase();
    switch (sexuality) {
      case 'Straight':
        return gender === 'male' ? target === 'female' : target === 'male';
      case 'Bisexual':
        return target === 'male' || target === 'female';
      case 'Lesbian':
        return target === 'female';
      case 'Gay':
        return target === 'male';
      default:
        return true;
    }
  };

  const matchesPreference = (target: UserProfile) => {
    const myGender = profile?.gender;
    const targetGender = target.gender;
    if (!myGender || !targetGender) return false;
    const iLikeThem = isAttractedToGender(profile, targetGender);
    const theyLikeMe = isAttractedToGender(target, myGender);
    return iLikeThem && theyLikeMe;
  };

  useEffect(() => {
    const unsub = listenActiveUsers(zoneInfo.id, setUsers as any);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = listenIncomingSignals(user.uid, setIncomingSignals);
    return unsub;
  }, [user]);

  const handleSignal = async (target: UserProfile) => {
    if (!user || !profile) return;
    if (!inWindow) return Alert.alert('Closed', 'Signals are open 3–5 PM only.');
    if ((profile.signalsRemaining || 0) <= 0) return Alert.alert('Out of signals', 'Activate again next window.');
    if (profile.blockedUserIds?.includes(target.uid)) return;
    try {
      await sendSignal(user.uid, target.uid);
      setAnim(true);
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2000);
      setTimeout(() => setAnim(false), 1500);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20, paddingTop: 48 }}>
      <MatchAnimation visible={anim} />
      <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '800' }}>Signals</Text>
      {justSent && (
        <View style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Signal sent</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>We’ll notify you if it’s mutual.</Text>
        </View>
      )}
      {incomingSignals.length > 0 && (
        <View style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Incoming signals</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
            {incomingSignals.length} new signal{incomingSignals.length === 1 ? '' : 's'} from{' '}
            {incomingSignals
              .slice(0, 3)
              .map(s => s.senderName)
              .join(', ')}
            {incomingSignals.length > 3 ? '…' : ''}
          </Text>
        </View>
      )}
      <Text style={{ color: theme.colors.muted, marginTop: 4 }}>Active in your zone: {zoneInfo.id}</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 4 }}>Signals left: {profile?.signalsRemaining || 0}</Text>

      <FlatList
        data={users.filter(
          u =>
            u.uid !== user?.uid &&
            !(profile?.blockedUserIds || []).includes(u.uid) &&
            matchesPreference(u)
        )}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <View>
            <UserCard name={item.name} promptAnswer={item.promptAnswer} photoURL={item.photoURL} />
            <TouchableOpacity
              disabled={!inWindow}
              onPress={() => handleSignal(item as any)}
              style={{
                backgroundColor: theme.colors.cardAlt,
                padding: 12,
                borderRadius: 20,
                marginBottom: 10,
                borderWidth: 2,
                borderColor: theme.colors.buttonBorder,
                opacity: inWindow ? 1 : 0.5,
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '800', textAlign: 'center' }}>
                {inWindow ? 'Send Signal' : 'Window closed'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: theme.colors.muted, marginTop: 20 }}>No one active yet.</Text>}
        contentContainerStyle={{ paddingTop: 14 }}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('Matches')}
        style={{ backgroundColor: theme.colors.cardAlt, padding: 12, borderRadius: 20, marginTop: 10, borderWidth: 2, borderColor: theme.colors.buttonBorder }}
      >
        <Text style={{ color: theme.colors.text, fontWeight: '800', textAlign: 'center' }}>Go to Matches</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignalsScreen;
