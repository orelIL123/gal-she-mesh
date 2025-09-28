import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { checkIsAdmin, getAllUsers, sendNotificationToUser } from '../../services/firebase';
import TopNav from '../components/TopNav';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface AdminCustomersScreenProps {
  onNavigate: (screen: string) => void;
  onBack?: () => void;
}

interface Customer {
  uid: string;
  displayName: string;
  phone: string;
  email: string;
  createdAt: any;
}

const AdminCustomersScreen: React.FC<AdminCustomersScreenProps> = ({ 
  onNavigate, 
  onBack 
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
    loadCustomers();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { getCurrentUser } = await import('../../services/firebase');
      const currentUser = getCurrentUser();
      
      if (currentUser) {
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          Alert.alert('שגיאה', 'אין לך הרשאות מנהל');
          onNavigate('home');
        }
      } else {
        onNavigate('home');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      onNavigate('home');
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const users = await getAllUsers();
      
      // Filter out admin users and get only regular customers
      const customerUsers = users
        .filter(user => !user.isAdmin)
        .map(user => ({
          uid: user.uid,
          displayName: user.displayName || 'ללא שם',
          phone: user.phone || 'ללא טלפון',
          email: user.email || 'ללא אימייל',
          createdAt: user.createdAt
        }))
        .sort((a, b) => {
          // Sort by creation date (newest first)
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          return 0;
        });
      
      setCustomers(customerUsers);
      console.log(`📋 Loaded ${customerUsers.length} customers`);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('שגיאה', 'שגיאה בטעינת רשימת הלקוחות');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (phone === 'ללא טלפון') {
      Alert.alert('שגיאה', 'אין מספר טלפון ללקוח זה');
      return;
    }
    
    // Format phone number for calling
    let phoneNumber = phone;
    if (phone.startsWith('+972')) {
      phoneNumber = phone;
    } else if (phone.startsWith('0')) {
      phoneNumber = '+972' + phone.substring(1);
    } else {
      phoneNumber = '+972' + phone;
    }
    
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(err => {
      console.error('Error opening phone app:', err);
      Alert.alert('שגיאה', 'לא ניתן לפתוח את אפליקציית הטלפון');
    });
  };

  const handleSendNotification = async (customer: Customer) => {
    Alert.prompt(
      'שליחת התראה',
      `שלח התראה ל${customer.displayName}`,
      [
        { text: 'ביטול', style: 'cancel' },
        { 
          text: 'שלח', 
          onPress: async (message) => {
            if (!message || !message.trim()) {
              Alert.alert('שגיאה', 'נא להזין הודעה');
              return;
            }
            
            try {
              setSendingNotification(customer.uid);
              await sendNotificationToUser(customer.uid, 'הודעה מהמספרה', message);
              Alert.alert('הצלחה', 'ההודעה נשלחה בהצלחה!');
            } catch (error) {
              console.error('Error sending notification:', error);
              Alert.alert('שגיאה', 'שגיאה בשליחת ההודעה');
            } finally {
              setSendingNotification(null);
            }
          }
        }
      ],
      'plain-text'
    );
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
        <TopNav 
          title="Admin Customers" 
          onBellPress={() => {}} 
          onMenuPress={() => {}}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>טוען לקוחות...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNav 
          title="Admin Customers" 
          onBellPress={() => {}} 
          onMenuPress={() => {}}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color="#dc3545" />
          <Text style={styles.errorText}>אין לך הרשאות מנהל</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNav 
        title="Admin Customers" 
        onBellPress={() => {}} 
        onMenuPress={() => {}}
        showBackButton={true}
        onBackPress={handleBack}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>לקוחות ({customers.length})</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadCustomers}
          >
            <Ionicons name="refresh" size={20} color="#007bff" />
            <Text style={styles.refreshButtonText}>רענן</Text>
          </TouchableOpacity>
        </View>

        {customers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>אין לקוחות רשומים</Text>
          </View>
        ) : (
          customers.map((customer, index) => (
            <View key={customer.uid} style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerNumber}>
                  <Text style={styles.customerNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.displayName}</Text>
                  <Text style={styles.customerPhone}>{customer.phone}</Text>
                  <Text style={styles.customerEmail}>{customer.email}</Text>
                </View>
              </View>
              
              <View style={styles.customerActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.callButton]}
                  onPress={() => handleCall(customer.phone)}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>התקשר</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.notificationButton]}
                  onPress={() => handleSendNotification(customer)}
                  disabled={sendingNotification === customer.uid}
                >
                  <Ionicons name="notifications" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {sendingNotification === customer.uid ? 'שולח...' : 'התראה'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
    fontFamily: 'Heebo-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Heebo-Bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    marginLeft: 4,
    color: '#007bff',
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontFamily: 'Heebo-Regular',
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Heebo-Bold',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Heebo-Bold',
  },
  customerPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Heebo-Regular',
  },
  customerEmail: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Heebo-Regular',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  callButton: {
    backgroundColor: '#28a745',
  },
  notificationButton: {
    backgroundColor: '#ffc107',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'Heebo-Medium',
  },
});

export default AdminCustomersScreen;
