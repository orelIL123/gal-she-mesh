import { Tabs, useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { useColorScheme } from '../../hooks/useColorScheme';
import BottomNav from '../components/BottomNav';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { guest } = useLocalSearchParams<{ guest?: string }>();
  const isGuestMode = guest === 'true';

  // קביעת הטאב הפעיל לפי ה־route
  const activeTab = React.useMemo(() => {
    const last = segments[segments.length - 1];
    if (String(last) === 'index') return 'home';
    if (String(last) === 'profile') return 'profile';
    if (String(last) === 'explore') return 'shop';
    if (String(last) === 'settings') return 'settings';
    return 'home';
  }, [segments]);

  // ניווט בין טאבים
  const handleTabPress = (tab: string) => {
    if (tab === 'home') router.replace('/(tabs)');
    else if (tab === 'profile') {
      if (isGuestMode) {
        // במצב אורח, מוביל למסך בחירת ההתחברות
        router.push('/auth-choice');
      } else {
        router.replace('/profile');
      }
    }
    else if (tab === 'shop') router.replace('/(tabs)/explore');
    else if (tab === 'settings') router.replace('/settings');
  };

  // ניווט מהיר מה־FAB - מנתב לספר בוקינג
  const handleOrderPress = () => {
    router.push('/booking');
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'בית' }} />
        <Tabs.Screen name="profile" options={{ title: 'פרופיל' }} />
        <Tabs.Screen name="explore" options={{ title: 'חנות' }} />
        <Tabs.Screen name="settings" options={{ title: 'הגדרות' }} />
        <Tabs.Screen name="booking" options={{ title: 'הזמנה' }} />
      </Tabs>
      <BottomNav
        onOrderPress={handleOrderPress}
        onTabPress={handleTabPress}
        activeTab={activeTab}
      />
    </>
  );
}
