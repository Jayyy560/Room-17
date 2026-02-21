import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../utils/theme';
import { useAuthContext } from '../hooks/useAuth';
import { blockUser, reportUser } from '../services/firestore';
import { signOut } from '../services/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

const ProfileScreen: React.FC = () => {
  const { profile } = useAuthContext();
  const [targetId, setTargetId] = useState('');
  const [reportReason, setReportReason] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleBlock = async () => {
    if (!profile || !targetId.trim()) return;
    await blockUser(profile.uid, targetId.trim());
    Alert.alert('Blocked', 'User hidden from you.');
    setTargetId('');
  };

  const handleReport = async () => {
    if (!profile || !targetId.trim() || !reportReason.trim()) return;
    await reportUser(profile.uid, targetId.trim(), reportReason.trim());
    Alert.alert('Reported', 'Safety team notified.');
    setTargetId('');
    setReportReason('');
  };

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] as any });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20, paddingTop: 48 }}>
      <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '800' }}>Profile</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 8 }}>Bravery: {profile?.braveryPoints || 0}</Text>
      <Text style={{ color: theme.colors.muted }}>Level: {profile?.level || 1}</Text>
      <Text style={{ color: theme.colors.muted }}>Signals remaining: {profile?.signalsRemaining || 0}</Text>

      <View style={{ marginTop: 20 }}>
        <Text style={{ color: theme.colors.text, marginBottom: 6 }}>User ID to block/report</Text>
        <TextInput
          value={targetId}
          onChangeText={setTargetId}
          placeholder="uid"
          placeholderTextColor={theme.colors.subtle}
          style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
        />
        <TextInput
          value={reportReason}
          onChangeText={setReportReason}
          placeholder="Report reason"
          placeholderTextColor={theme.colors.subtle}
          style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
        />
        <TouchableOpacity onPress={handleBlock} style={{ backgroundColor: theme.colors.cardAlt, padding: 12, borderRadius: 20, marginBottom: 10, borderWidth: 2, borderColor: theme.colors.buttonBorder }}>
          <Text style={{ color: theme.colors.text, fontWeight: '800', textAlign: 'center' }}>Block user</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReport} style={{ backgroundColor: theme.colors.cardAlt, padding: 12, borderRadius: 20, marginBottom: 10, borderWidth: 2, borderColor: theme.colors.buttonBorder }}>
          <Text style={{ color: theme.colors.text, fontWeight: '800', textAlign: 'center' }}>Report user</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 20 }}>
        <Text style={{ color: theme.colors.accent }}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
