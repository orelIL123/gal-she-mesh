import { useLocalSearchParams, useRouter } from 'expo-router';
import ProfileScreen from '../screens/ProfileScreen';

export default function ProfileTab() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const handleNavigate = (screen: string) => {
    switch (screen) {
      case 'home':
        router.replace('/');
        break;
      case 'team':
        router.replace('/team');
        break;
      case 'booking':
        router.replace('/booking');
        break;
      case 'explore':
        router.replace('/explore');
        break;
      default:
        router.replace('/');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ProfileScreen 
      onNavigate={handleNavigate} 
      onBack={handleBack}
      // initialMode={mode}
    />
  );
} 