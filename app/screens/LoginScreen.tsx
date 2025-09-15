import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { loginUser, loginWithPhoneAndPassword } from '../../services/firebase';
import { colors } from '../constants/colors';
import { CONTACT_INFO } from '../constants/contactInfo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim()) {
      Alert.alert('שגיאה', 'אנא הזן אימייל או מספר טלפון');
      return;
    }

    if (!password.trim()) {
      Alert.alert('שגיאה', 'אנא הזן סיסמה');
      return;
    }

    setLoading(true);
    try {
      // Check if it's email or phone format
      const isEmail = emailOrPhone.includes('@');

      if (isEmail) {
        await loginUser(emailOrPhone, password);
      } else {
        await loginWithPhoneAndPassword(emailOrPhone, password);
      }
      
      Alert.alert('הצלחה', 'התחברת בהצלחה', [
        { text: 'אישור', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'פרטי הכניסה שגויים';
      
      if (error.message.includes('משתמש לא נמצא')) {
        errorMessage = 'משתמש לא נמצא. אנא הירשם תחילה.';
      } else if (error.message.includes('סיסמה שגויה')) {
        errorMessage = 'הסיסמה שגויה. אנא נסה שוב.';
      } else if (error.message.includes('פרטי הכניסה שגויים')) {
        errorMessage = 'פרטי הכניסה שגויים. בדוק את הטלפון והסיסמה.';
      } else if (error.message.includes('לא הגדיר סיסמה')) {
        errorMessage = 'לא הוגדרה סיסמה לחשבון זה. אנא הירשם מחדש או השתמש בהתחברות עם SMS.';
      }
      
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>התחברות</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>התחברות עם אימייל או טלפון</Text>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.label}>אימייל או מספר טלפון</Text>
          <TextInput
            style={styles.input}
            placeholder="הזן אימייל או מספר טלפון"
            placeholderTextColor={colors.textSecondary}
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="default"
            autoCapitalize="none"
          />

          <Text style={styles.label}>סיסמא</Text>
          <TextInput
            style={styles.input}
            placeholder="הזן סיסמא"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>התחבר</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>אין לך חשבון? הירשם</Text>
          </TouchableOpacity>
        </View>

          <Text style={styles.termsText}>
            בהמשך השימוש באפליקציה, אתה מסכים ל{' '}
            <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>תנאי השימוש</Text>
            {' '}ול{' '}
            <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>מדיניות הפרטיות</Text>
          </Text>
        </View>
      {/* Removed extra closing View */}

      {/* Terms Modal */}
      <Modal visible={showTerms} transparent={true} animationType="fade" onRequestClose={() => setShowTerms(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>תנאי שימוש ומדיניות פרטיות</Text>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>
                <Text style={styles.sectionTitle}>תנאי שימוש - רון תורגמן מספרה{'\n\n'}</Text>
                <Text style={styles.subsectionTitle}>1. קבלת השירות{'\n'}</Text>
                • השירות מיועד לקביעת תורים במספרה רון תורגמן{'\n'}
                • יש לספק מידע מדויק ומלא בעת קביעת התור{'\n'}
                • המספרה שומרת לעצמה את הזכות לסרב לתת שירות במקרים חריגים{'\n\n'}
                
                <Text style={styles.subsectionTitle}>2. ביטול תורים{'\n'}</Text>
                • ביטול תור יש לבצע לפחות 2 שעות לפני מועד התור{'\n'}
                • ביטול מאוחר יותר מ-2 שעות עלול לחייב תשלום{'\n'}
                • במקרה של איחור של יותר מ-15 דקות, התור עלול להתבטל{'\n\n'}
                
                <Text style={styles.subsectionTitle}>3. תשלומים{'\n'}</Text>
                • התשלום מתבצע במספרה לאחר קבלת השירות{'\n'}
                • המחירים כפי שמופיעים באפליקציה{'\n'}
                • המספרה שומרת לעצמה את הזכות לשנות מחירים{'\n\n'}
                
                <Text style={styles.subsectionTitle}>4. אחריות{'\n'}</Text>
                • המספרה מתחייבת לאיכות השירות{'\n'}
                • במקרה של אי שביעות רצון, יש לפנות למנהל המספרה{'\n'}
                • המספרה לא אחראית לנזקים עקיפים{'\n\n'}
                
                <Text style={styles.sectionTitle}>מדיניות פרטיות{'\n\n'}</Text>
                
                <Text style={styles.subsectionTitle}>1. איסוף מידע{'\n'}</Text>
                • אנו אוספים: שם מלא, מספר טלפון, פרטי תורים{'\n'}
                • המידע נאסף לצורך מתן השירות בלבד{'\n'}
                • לא נאסוף מידע מיותר{'\n\n'}
                
                <Text style={styles.subsectionTitle}>2. שימוש במידע{'\n'}</Text>
                • המידע משמש לקביעת תורים ותקשורת{'\n'}
                • לא נשתף את המידע עם צדדים שלישיים{'\n'}
                • לא נשלח הודעות פרסומיות ללא אישור{'\n\n'}
                
                <Text style={styles.subsectionTitle}>3. אבטחה{'\n'}</Text>
                • המידע מאוחסן באופן מאובטח{'\n'}
                • גישה למידע מוגבלת לעובדי המספרה בלבד{'\n'}
                • נעדכן את האבטחה לפי הצורך{'\n\n'}
                
                <Text style={styles.subsectionTitle}>4. זכויות המשתמש{'\n'}</Text>
                • הזכות לבקש עותק מהמידע שלך{'\n'}
                • הזכות לבקש מחיקה של המידע{'\n'}
                • הזכות לעדכן את המידע{'\n\n'}
                
                <Text style={styles.subsectionTitle}>5. עדכונים{'\n'}</Text>
                • מדיניות זו עשויה להתעדכן{'\n'}
                • עדכונים יפורסמו באפליקציה{'\n'}
                • המשך השימוש מהווה הסכמה לתנאים המעודכנים{'\n\n'}
                
                <Text style={styles.contactInfo}>
                  {CONTACT_INFO.contactText}{'\n'}
                  מייל: {CONTACT_INFO.email}
                </Text>
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTerms(false)}>
              <Text style={styles.modalCloseText}>סגור</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: screenWidth * 0.25,
    height: screenWidth * 0.25,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
  },
  formSection: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 20,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScrollView: {
    width: '100%',
    flex: 1,
  },
  modalText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
