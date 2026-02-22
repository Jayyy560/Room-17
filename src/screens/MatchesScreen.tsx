import React, { useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { theme } from '../utils/theme';
import { useAuthContext } from '../hooks/useAuth';
import { useArenaContext } from '../hooks/useArena';
import { archiveMatch, listenMatches, unmatchMatch } from '../services/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

const MatchesScreen: React.FC = () => {
  const { user } = useAuthContext();
  const { arena } = useArenaContext();
  const [matches, setMatches] = useState<any[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!arena) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: 48, paddingHorizontal: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '800' }}>Matches</Text>
        <Text style={{ color: theme.colors.muted, marginTop: 6 }}>Select an arena to see matches.</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Arena')}
          style={{ backgroundColor: theme.colors.cardAlt, padding: 12, borderRadius: 20, marginTop: 16, borderWidth: 2, borderColor: theme.colors.buttonBorder }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '800', textAlign: 'center' }}>Go to Arena</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    if (!user || !arena) return;
    const unsub = listenMatches(user.uid, arena.id, setMatches);
    return unsub;
  }, [user, arena?.id]);

  const handleArchive = (matchId: string) => {
    if (!user) return;
    archiveMatch(matchId, user.uid);
  };

  const handleUnmatch = (matchId: string) => {
    if (!user) return;
    unmatchMatch(matchId, user.uid);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: 48, paddingHorizontal: 16 }}>
      <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '800' }}>Matches</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 6 }}>
        Your mutual signals show up here.
      </Text>

      <FlatList
        data={matches}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const lastMessage = item.lastMessage || '';
          const fallbackMessage = item.promptAnswer || '';
          const messagePreview = lastMessage
            ? `${item.lastMessageSenderId === user?.uid ? 'You: ' : ''}${lastMessage}`
            : fallbackMessage;
          const lastAt = item.lastMessageAt?.toDate?.() || null;
          const lastTime = lastAt ? lastAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          const unread = user
            ? item.lastMessageAt && item.lastMessageSenderId && item.lastMessageSenderId !== user.uid &&
              (!item.lastReadBy || !item.lastReadBy[user.uid] ||
                item.lastReadBy[user.uid].toMillis?.() < item.lastMessageAt.toMillis?.())
            : false;

          return (
            <Swipeable
              overshootRight={false}
              renderRightActions={() => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => handleArchive(item.id)}
                    style={{
                      width: 92,
                      height: '80%',
                      backgroundColor: theme.colors.cardAlt,
                      borderRadius: theme.radius.md,
                      marginLeft: theme.spacing.sm,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Archive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleUnmatch(item.id)}
                    style={{
                      width: 92,
                      height: '80%',
                      backgroundColor: theme.colors.accent,
                      borderRadius: theme.radius.md,
                      marginLeft: theme.spacing.sm,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: theme.colors.card, fontWeight: '700' }}>Unmatch</Text>
                  </TouchableOpacity>
                </View>
              )}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('Chat', { matchId: item.id })}
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.colors.cardAlt,
                    overflow: 'hidden',
                    marginRight: theme.spacing.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={{ fontSize: 22, fontWeight: '700', color: theme.colors.accentDark }}>
                      {(item.name || 'M')[0]}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16 }}>
                      {item.name || 'Match'}
                    </Text>
                    {lastTime ? (
                      <Text style={{ color: theme.colors.subtle, fontSize: 12 }}>{lastTime}</Text>
                    ) : null}
                  </View>
                  <Text style={{ color: theme.colors.muted, marginTop: 6 }} numberOfLines={1}>
                    {messagePreview}
                  </Text>
                </View>

                {unread && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: theme.colors.accent,
                      marginLeft: theme.spacing.sm,
                    }}
                  />
                )}
              </TouchableOpacity>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: theme.colors.muted }}>No matches yet.</Text>
          </View>
        }
      />

      <TouchableOpacity onPress={() => navigation.navigate('Arena')} style={{ marginTop: 10 }}>
        <Text style={{ color: theme.colors.accent, textAlign: 'center' }}>Back to Arena</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MatchesScreen;
