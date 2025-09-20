import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TopNav from '../components/TopNav';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface AdminNotificationSettingsScreenProps {
  onNavigate: (screen: string) => void;
  onBack?: () => void;
}

interface NotificationSettings {
  newUserRegistered: boolean;
  newAppointmentBooked: boolean;
  appointmentCancelled: boolean;
  appointmentReminders: boolean;
}

const AdminNotificationSettingsScreen: React.FC<AdminNotificationSettingsScreenProps> = ({ 
  onNavigate, 
  onBack 
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    newUserRegistered: true,
    newAppointmentBooked: true,
    appointmentCancelled: true,
    appointmentReminders: true,
  });

  useEffect(() => {
    checkAdminStatus();
    loadSettings();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { checkIsAdmin, getCurrentUser } = await import('../../services/firebase');
      const user = getCurrentUser();
      if (user) {
        const isAdmin = await checkIsAdmin(user.uid);
        setIsAdmin(isAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      // For now, use default settings - can be extended to load from Firestore
      const defaultSettings: NotificationSettings = {
        newUserRegistered: true,
        newAppointmentBooked: true,
        appointmentCancelled: true,
        appointmentReminders: true,
      };
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    try {
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);
      
      // TODO: Save to Firestore when backend is ready
      console.log('Notification settings updated:', newSettings);
      
      // Show success message
      Alert.alert(
        'הגדרות עודכנו',
        'הגדרות ההתראות עודכנו בהצלחה',
        [{ text: 'אישור' }]
      );
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('שגיאה', 'לא ניתן לעדכן את ההגדרות');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('admin-home');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>טוען...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color="#dc3545" />
          <Text style={styles.errorText}>אין לך הרשאות מנהל</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
            <Text style={styles.backButtonText}>חזור לעמוד הבית</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        title="הגדרות התראות"
        onBackPress={handleBack}
        showBackButton={true}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>התראות מנהל</Text>
          <Text style={styles.sectionSubtitle}>
            בחר איזה התראות תרצה לקבל כמנהל
          </Text>
        </View>

        {/* New User Registration */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={24} color="#4CAF50" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>משתמש חדש נרשם</Text>
              <Text style={styles.settingDescription}>
                קבל התראה כשמשתמש חדש נרשם לאפליקציה
              </Text>
            </View>
          </View>
          <Switch
            value={settings.newUserRegistered}
            onValueChange={() => handleToggle('newUserRegistered')}
            trackColor={{ false: '#ddd', true: '#4CAF50' }}
            thumbColor={settings.newUserRegistered ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* New Appointment Booked */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar" size={24} color="#2196F3" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>תור חדש נקבע</Text>
              <Text style={styles.settingDescription}>
                קבל התראה כשמשתמש קובע תור חדש
              </Text>
            </View>
          </View>
          <Switch
            value={settings.newAppointmentBooked}
            onValueChange={() => handleToggle('newAppointmentBooked')}
            trackColor={{ false: '#ddd', true: '#2196F3' }}
            thumbColor={settings.newAppointmentBooked ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Appointment Cancelled */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="close-circle" size={24} color="#F44336" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>תור בוטל</Text>
              <Text style={styles.settingDescription}>
                קבל התראה כשמשתמש מבטל תור
              </Text>
            </View>
          </View>
          <Switch
            value={settings.appointmentCancelled}
            onValueChange={() => handleToggle('appointmentCancelled')}
            trackColor={{ false: '#ddd', true: '#F44336' }}
            thumbColor={settings.appointmentCancelled ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Appointment Reminders */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="alarm" size={24} color="#FF9800" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>תזכורות לתורים</Text>
              <Text style={styles.settingDescription}>
                קבל תזכורות על תורים קרובים (שעה ורבע שעה לפני)
              </Text>
            </View>
          </View>
          <Switch
            value={settings.appointmentReminders}
            onValueChange={() => handleToggle('appointmentReminders')}
            trackColor={{ false: '#ddd', true: '#FF9800' }}
            thumbColor={settings.appointmentReminders ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.infoTitle}>מידע חשוב</Text>
          </View>
          <Text style={styles.infoText}>
            • ההתראות יישלחו לך כ-Push Notifications{'\n'}
            • תוכל לשנות הגדרות אלה בכל עת{'\n'}
            • ההתראות יישלחו רק למנהלים{'\n'}
            • תזכורות התורים יישלחו אוטומטית
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    fontFamily: 'Heebo-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontFamily: 'Heebo-Regular',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    color: colors.text,
    fontFamily: 'Heebo-Bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Heebo-Regular',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Heebo-Medium',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Heebo-Regular',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Heebo-Medium',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Heebo-Regular',
    lineHeight: 20,
  },
});

export default AdminNotificationSettingsScreen;