import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@barber_app_auth';

export interface AuthData {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  isAdmin: boolean;
  lastLoginAt: string;
}

export const AuthStorageService = {
  // Save auth data
  async saveAuthData(authData: AuthData): Promise<void> {
    try {
      const dataToStore = {
        ...authData,
        lastLoginAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dataToStore));
      console.log('✅ Auth data saved successfully');
    } catch (error) {
      console.error('❌ Error saving auth data:', error);
    }
  },

  // Get saved auth data
  async getAuthData(): Promise<AuthData | null> {
    try {
      const data = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        const authData = JSON.parse(data) as AuthData;
        console.log('📖 Auth data loaded from storage');
        return authData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading auth data:', error);
      return null;
    }
  },

  // Clear auth data (logout)
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('🗑️ Auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  },

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const data = await this.getAuthData();
      return data !== null;
    } catch (error) {
      console.error('❌ Error checking login status:', error);
      return false;
    }
  }
};

