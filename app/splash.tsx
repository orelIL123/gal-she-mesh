import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';
import { AuthStorageService } from '../services/authStorage';
import { auth } from './config/firebase';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start with immediate fade in for smooth transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      // Fade out before navigation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(async () => {
        // Navigate after fade out completes
        try {
          // First check if we have stored auth data
          const storedAuthData = await AuthStorageService.getAuthData();
          
          if (storedAuthData) {
            console.log('🔐 Found stored auth data, checking current auth state...');
            
            // Check if user is still authenticated with Firebase
            onAuthStateChanged(auth, (user) => {
              if (user && user.uid === storedAuthData.uid) {
                console.log('✅ User still authenticated, navigating to home');
                router.replace('/(tabs)');
              } else {
                console.log('❌ Auth state mismatch, clearing stored data');
                AuthStorageService.clearAuthData();
                router.replace('/auth-choice');
              }
            });
          } else {
            console.log('📱 No stored auth data, checking current auth state...');
            onAuthStateChanged(auth, (user) => {
              if (user) {
                router.replace('/(tabs)');
              } else {
                router.replace('/auth-choice');
              }
            });
          }
        } catch (error) {
          console.error('Error checking stored auth data:', error);
          router.replace('/auth-choice');
        }
      });
    }, 2000); // Show splash for exactly 2 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/TURGI.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
    resizeMode: 'cover',
  },
});