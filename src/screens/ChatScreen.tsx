import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../utils/theme';
import { useAuthContext } from '../hooks/useAuth';
import { useArenaContext } from '../hooks/useArena';
import { extendChat, listenMatches, listenMessages, markMatchRead, markMetIRL, sendMessage, UserProfile } from '../services/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useRoute, RouteProp } from '@react-navigation/native';

const ChatScreen: React.FC = () => {
  const { user } = useAuthContext();
  const { arena } = useArenaContext();
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const matchId = route.params?.matchId;
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!user || !matchId || !arena) return;
    const unsub = listenMatches(user.uid, arena.id, matches => {
      const found = matches.find(m => m.id === matchId);
      setSelected(found || null);
    });
    return unsub;
  }, [user, matchId, arena?.id]);

  useEffect(() => {
    if (!selected) return;
    const unsub = listenMessages(selected.id, setMessages);
    return unsub;
  }, [selected]);

  useEffect(() => {
    if (!user || !selected) return;
    markMatchRead(selected.id, user.uid).catch(() => undefined);
  }, [user, selected, messages.length]);

  const expired = useMemo(() => {
    if (!selected) return false;
    const created = selected.createdAt?.toMillis ? selected.createdAt.toMillis() : Date.now();
    const extended = selected.extendedBy || [];
    const bothExtended = user ? extended.includes(user.uid) && extended.length >= 2 : false;
    const expiredFlag = Date.now() - created > 10 * 60 * 1000 && !bothExtended;
    return expiredFlag;
  }, [selected, user]);

  const handleSend = async () => {
    if (!user || !selected) return;
    if (!text.trim()) return;
    if (expired) return Alert.alert('Chat expired', 'Extend to keep talking.');
    try {
      await sendMessage(selected.id, user.uid, text.trim());
      setText('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleExtend = async () => {
    if (!user || !selected) return;
    try {
      await extendChat(selected.id, user.uid);
      Alert.alert('Extended', 'Waiting for both to extend.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleMet = async () => {
    if (!user || !selected) return;
    try {
      await markMetIRL(selected.id, user.uid);
      Alert.alert('Logged', 'Nice courage!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (!selected) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: 48, paddingHorizontal: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800' }}>Chat</Text>
        <Text style={{ color: theme.colors.muted, marginTop: 8 }}>Match not found.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Matches')} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.colors.accent, textAlign: 'center' }}>Back to Matches</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: 48, paddingHorizontal: 16 }}>
      <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>{selected?.name || 'Chat'}</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{selected?.promptAnswer || ''}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Chat</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={handleExtend} style={{ backgroundColor: theme.colors.cardAlt, padding: 8, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Extend</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMet} style={{ backgroundColor: theme.colors.cardAlt, padding: 8, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Met IRL</Text>
          </TouchableOpacity>
        </View>
      </View>
      {expired && <Text style={{ color: theme.colors.warning, marginTop: 8 }}>Expired. Both must extend.</Text>}

      <FlatList
        data={messages}
        style={{ marginTop: 12, flex: 1 }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.senderId === user?.uid ? 'flex-end' : 'flex-start',
              backgroundColor: item.senderId === user?.uid ? theme.colors.cardAlt : theme.colors.card,
              padding: 10,
              borderRadius: 16,
              marginBottom: 8,
              maxWidth: '80%',
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ color: theme.colors.text }}>{item.text}</Text>
          </View>
        )}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={expired ? 'Chat expired' : 'Type...'}
          placeholderTextColor={theme.colors.subtle}
          editable={!expired}
          style={{ flex: 1, backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 12, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: theme.colors.inputBorder }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={expired}
          style={{ backgroundColor: theme.colors.cardAlt, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: theme.colors.buttonBorder }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '800' }}>Send</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Matches')} style={{ marginTop: 10 }}>
        <Text style={{ color: theme.colors.accent, textAlign: 'center' }}>Back to Matches</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChatScreen;
