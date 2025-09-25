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

    // Wait for Firebase Auth to initialize and check auth state
    let authStateChecked = false;

    const checkAuthState = async () => {
      try {
        console.log('🔍 Checking authentication state...');

        // Wait for Firebase Auth to initialize
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (authStateChecked) return; // Prevent multiple calls
          authStateChecked = true;

          console.log('🔥 Firebase Auth state:', user ? 'User found' : 'No user');

          // Check stored auth data
          const storedAuthData = await AuthStorageService.getAuthData();
          console.log('💾 Stored auth data:', storedAuthData ? 'Found' : 'None');

          // Fade out before navigation
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            unsubscribe(); // Clean up listener

            if (user && storedAuthData && user.uid === storedAuthData.uid) {
              console.log('✅ User authenticated, navigating to home');
              router.replace('/(tabs)');
            } else if (user && !storedAuthData) {
              console.log('✅ Firebase user found but no stored data, navigating to home');
              router.replace('/(tabs)');
            } else {
              console.log('❌ No valid authentication, navigating to auth choice');
              if (storedAuthData) {
                AuthStorageService.clearAuthData(); // Clear invalid stored data
              }
              router.replace('/auth-choice');
            }
          });
        });

        // Fallback: if no auth state change after 3 seconds, proceed anyway
        setTimeout(() => {
          if (!authStateChecked) {
            console.log('⏰ Auth state check timeout, proceeding...');
            authStateChecked = true;
            unsubscribe();

            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              router.replace('/auth-choice');
            });
          }
        }, 3000);

      } catch (error) {
        console.error('Error checking auth state:', error);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          router.replace('/auth-choice');
        });
      }
    };

    // Start auth check after animation
    const timer = setTimeout(checkAuthState, 2000);

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