import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AuthProvider, useAuthContext } from './src/hooks/useAuth';
import { ArenaProvider } from './src/hooks/useArena';
import RootNavigator from './src/navigation/RootNavigator';
import { updatePushToken } from './src/services/firestore';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PushRegistrar = () => {
  const { user } = useAuthContext();
  useEffect(() => {
    const register = async () => {
      if (!user) return;
      if (!Device.isDevice) return;
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await updatePushToken(user.uid, token);
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    };
    register();
  }, [user]);
  return null;
};

export default function App() {
  const [fontsLoaded] = useFonts(Ionicons.font);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ArenaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PushRegistrar />
          <RootNavigator />
        </GestureHandlerRootView>
      </ArenaProvider>
    </AuthProvider>
  );
}
