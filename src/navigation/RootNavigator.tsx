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

export type RootStackParamList = {
  Auth: undefined;
  Arena: undefined;
  Signals: undefined;
  Matches: undefined;
  Chat: { matchId: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { user, loading } = useAuthContext();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator id="root" screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Arena" component={ArenaScreen} />
            <Stack.Screen name="Signals" component={SignalsScreen} />
            <Stack.Screen name="Matches" component={MatchesScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
