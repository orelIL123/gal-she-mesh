import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import 'nativewind';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Alert } from 'react-native';
import 'react-native-reanimated';
import '../app/globals.css';
import AppAuthGate from './components/AppAuthGate';
import i18n from './i18n';

import { useColorScheme } from '../hooks/useColorScheme';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Check for updates on app start
  useEffect(() => {
    async function checkForUpdates() {
      try {
        // Only check for updates in production
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            Alert.alert(
              'עדכון זמין',
              'יש עדכון חדש לאפליקציה. האם ברצונך להוריד אותו עכשיו?',
              [
                {
                  text: 'לא עכשיו',
                  style: 'cancel',
                },
                {
                  text: 'עדכן',
                  onPress: async () => {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  },
                },
              ]
            );
          }
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppAuthGate>
          <Stack>
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="auth-choice" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="booking" options={{ headerShown: false }} />
            <Stack.Screen name="admin-home" options={{ headerShown: false }} />
            <Stack.Screen name="admin-appointments" options={{ headerShown: false }} />
            <Stack.Screen name="admin-availability" options={{ headerShown: false }} />
            <Stack.Screen name="admin-gallery" options={{ headerShown: false }} />
            <Stack.Screen name="admin-notification-settings" options={{ headerShown: false }} />
            <Stack.Screen name="admin-notifications" options={{ headerShown: false }} />
            <Stack.Screen name="admin-settings" options={{ headerShown: false }} />
            <Stack.Screen name="admin-statistics" options={{ headerShown: false }} />
            <Stack.Screen name="admin-team" options={{ headerShown: false }} />
            <Stack.Screen name="admin-treatments" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ headerShown: false }} />
          </Stack>
        </AppAuthGate>
        <StatusBar style="auto" />
      </ThemeProvider>
    </I18nextProvider>
  );
}
