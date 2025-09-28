import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';
import { authManager } from '../services/authManager';

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

    // Check auth state using the new AuthManager
    let authStateChecked = false;

    const checkAuthState = async () => {
      try {
        console.log('🔍 SplashScreen: Starting auth check...');

        // Wait for AuthManager to initialize
        await authManager.waitForInitialization();

        if (authStateChecked) return;
        authStateChecked = true;

        console.log('🔍 SplashScreen: AuthManager initialized, checking auth state...');

        // First: Check if already authenticated via Firebase persistence
        const isAuthenticated = await authManager.isAuthenticated();

        if (isAuthenticated) {
          console.log('✅ SplashScreen: User already authenticated via Firebase persistence');

          // Fade out and navigate to home
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            router.replace('/(tabs)');
          });
          return;
        }

        // Second: Try auto-login with saved credentials
        console.log('🔍 SplashScreen: No Firebase auth, trying auto-login...');
        const autoLoginSuccess = await authManager.attemptAutoLogin();

        // Fade out before navigation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (autoLoginSuccess) {
            console.log('✅ SplashScreen: Auto-login successful, navigating to home');
            router.replace('/(tabs)');
          } else {
            console.log('❌ SplashScreen: No auto-login possible, navigating to auth choice');
            router.replace('/auth-choice');
          }
        });

      } catch (error) {
        console.error('❌ SplashScreen: Error in auth check:', error);

        // Fallback to auth choice on error
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // Ensure it's above everything during splash
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
    resizeMode: 'cover', // This will fill the entire screen without distortion
  },
});