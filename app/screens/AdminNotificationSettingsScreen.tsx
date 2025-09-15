import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { } from '../../services/firebase';
import ToastMessage from '../components/ToastMessage';
import TopNav from '../components/TopNav';

interface NotificationSettings {
  appointmentBooked: boolean;
  appointmentCancelled: boolean;
  newUserRegistered: boolean;
}

interface AdminNotificationSettingsScreenProps {
  onNavigate: (screen: string) => void;
  onBack?: () => void;
}

export default function AdminNotificationSettingsScreen({ onNavigate, onBack }: AdminNotificationSettingsScreenProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    appointmentBooked: true,
    appointmentCancelled: true,
    newUserRegistered: true
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // const notificationSettings = await getNotificationSettings();
      const notificationSettings: NotificationSettings = {
        appointmentBooked: true,
        appointmentCancelled: true,
        newUserRegistered: true
      };
      if (notificationSettings) {
        setSettings(notificationSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      showToast('שגיאה בטעינת הגדרות התראות', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    try {
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);
      
      // await updateNotificationSettings(newSettings);
      console.log('Notification settings updated:', newSettings);
      showToast('הגדרות התראות עודכנו בהצלחה');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showToast('שגיאה בעדכון הגדרות התראות', 'error');
      // Revert the change
      setSettings(settings);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const testNotification = async (type: 'appointmentBooked' | 'appointmentCancelled' | 'newUserRegistered') => {
    try {
      // This would send a test notification
      Alert.alert(
        'בדיקת התראה',
        `התראה נשלחה עבור: ${getNotificationTitle(type)}`,
        [{ text: 'אישור' }]
      );
    } catch (error) {
      showToast('שגיאה בשליחת התראה', 'error');
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'appointmentBooked': return 'תור חדש נקבע';
      case 'appointmentCancelled': return 'תור בוטל';
      case 'newUserRegistered': return 'משתמש חדש נרשם';
      default: return 'התראה';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopNav 
        title="הגדרות התראות" 
        showBackButton={true}
        onBackPress={onBack}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ניהול התראות</Text>
          <Text style={styles.subtitle}>
            בחר איזה התראות ברצונך לקבל
          </Text>
        </View>

        <View style={styles.settingsContainer}>
          {/* Appointment Booked Notification */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="calendar" size={24} color="#007bff" />
                <Text style={styles.settingTitle}>תור חדש נקבע</Text>
              </View>
              <Text style={styles.settingDescription}>
                קבל התראה כאשר לקוח קובע תור חדש
              </Text>
            </View>
            <View style={styles.settingActions}>
              <Switch
                value={settings.appointmentBooked}
                onValueChange={() => handleToggle('appointmentBooked')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={settings.appointmentBooked ? '#007bff' : '#f4f3f4'}
              />
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testNotification('appointmentBooked')}
              >
                <Ionicons name="play" size={16} color="#007bff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Appointment Cancelled Notification */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="close-circle" size={24} color="#dc3545" />
                <Text style={styles.settingTitle}>תור בוטל</Text>
              </View>
              <Text style={styles.settingDescription}>
                קבל התראה כאשר לקוח מבטל תור
              </Text>
            </View>
            <View style={styles.settingActions}>
              <Switch
                value={settings.appointmentCancelled}
                onValueChange={() => handleToggle('appointmentCancelled')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={settings.appointmentCancelled ? '#007bff' : '#f4f3f4'}
              />
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testNotification('appointmentCancelled')}
              >
                <Ionicons name="play" size={16} color="#007bff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* New User Registered Notification */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="person-add" size={24} color="#28a745" />
                <Text style={styles.settingTitle}>משתמש חדש נרשם</Text>
              </View>
              <Text style={styles.settingDescription}>
                קבל התראה כאשר משתמש חדש נרשם לאפליקציה
              </Text>
            </View>
            <View style={styles.settingActions}>
              <Switch
                value={settings.newUserRegistered}
                onValueChange={() => handleToggle('newUserRegistered')}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={settings.newUserRegistered ? '#007bff' : '#f4f3f4'}
              />
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testNotification('newUserRegistered')}
              >
                <Ionicons name="play" size={16} color="#007bff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007bff" />
          <Text style={styles.infoText}>
            ההתראות יישלחו לך בהודעות push ובהודעות SMS
          </Text>
        </View>
      </ScrollView>

      <ToastMessage
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 32,
  },
  settingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
  },
});
