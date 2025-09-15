import { useRouter } from 'expo-router';
import React from 'react';
import AdminNotificationSettingsScreen from './screens/AdminNotificationSettingsScreen';

export default function AdminNotificationSettingsPage() {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    console.log('AdminNotificationSettingsPage handleNavigate called with:', screen);
    switch (screen) {
      case 'admin-settings':
        router.replace('/admin-settings');
        break;
      case 'admin-home':
        router.replace('/admin-home');
        break;
      default:
        console.log('Unknown screen:', screen);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <AdminNotificationSettingsScreen 
      onNavigate={handleNavigate} 
      onBack={handleBack}
    />
  );
}

