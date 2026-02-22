import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/AuthScreen';
import ArenaScreen from '../screens/ArenaScreen';
import SignalsScreen from '../screens/SignalsScreen';
import MatchesScreen from '@screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuthContext } from '../hooks/useAuth';
import { Platform } from 'react-native';
import AdminScreen from '../screens/AdminScreen';

export type RootStackParamList = {
  Auth: undefined;
  Arena: undefined;
  Signals: undefined;
  Matches: undefined;
  Chat: { matchId: string };
  Profile: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { user, loading } = useAuthContext();
  const isWeb = Platform.OS === 'web';

  const linking = {
    prefixes: ['room17://'],
    config: {
      screens: {
        Admin: 'admin',
      },
    },
  };

  if (loading) return null;

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator id="root" screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Arena" component={ArenaScreen} />
            <Stack.Screen name="Signals" component={SignalsScreen} />
            <Stack.Screen name="Matches" component={MatchesScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            {isWeb && <Stack.Screen name="Admin" component={AdminScreen} />}
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
