import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="booking" options={{ title: "Booking" }} />
      <Tabs.Screen name="explore" options={{ title: "Shop" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="team" options={{ title: "Team" }} />
    </Tabs>
  );
}
