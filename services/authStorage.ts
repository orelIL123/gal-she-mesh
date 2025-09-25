import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@barberapp:'; // שנה לשם האפליקציה שלך
const AUTH_STORAGE_KEY = `${PREFIX}auth`;

export interface AuthData {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  isAdmin: boolean;
  lastLoginAt: string;
  // Add credentials for auto-login
  savedCredentials?: {
    email?: string;
    phoneNumber?: string;
    hasPassword: boolean;
  };
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

  // Clear auth data (logout) - מסונן לפי prefix
  async clearAuthData(): Promise<void> {
    try {
      // ❗️אל תשתמש ב-AsyncStorage.clear()
      const keys = await AsyncStorage.getAllKeys();
      const mine = keys.filter(k => k.startsWith(PREFIX));
      if (mine.length) await AsyncStorage.multiRemove(mine);
      console.log('🗑️ Auth data cleared (filtered by prefix)');
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
  },

  // Save login credentials for auto-login
  async saveLoginCredentials(email?: string, phoneNumber?: string, hasPassword: boolean = false): Promise<void> {
    try {
      const currentData = await this.getAuthData();
      if (currentData) {
        const updatedData = {
          ...currentData,
          savedCredentials: {
            email,
            phoneNumber,
            hasPassword
          }
        };
        await this.saveAuthData(updatedData);
        console.log('✅ Login credentials saved');
      }
    } catch (error) {
      console.error('❌ Error saving login credentials:', error);
    }
  },

  // Get saved login credentials
  async getSavedCredentials(): Promise<{email?: string, phoneNumber?: string, hasPassword: boolean} | null> {
    try {
      const data = await this.getAuthData();
      return data?.savedCredentials || null;
    } catch (error) {
      console.error('❌ Error getting saved credentials:', error);
      return null;
    }
  }
};

