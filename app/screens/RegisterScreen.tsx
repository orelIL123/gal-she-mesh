import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { registerUserWithPhone, sendSMSVerification } from '../../services/firebase';
import { colors } from '../constants/colors';
import { CONTACT_INFO } from '../constants/contactInfo';

const { width: screenWidth } = Dimensions.get('window');

type RegisterStep = 'name' | 'phone' | 'password' | 'verification';

const stepOrder: RegisterStep[] = ['name', 'phone', 'password', 'verification'];

const stepMeta: Record<
  RegisterStep,
  {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    cta: string;
  }
> = {
  name: {
    title: 'איך קוראים לך?',
    subtitle: 'נתחיל בשם פרטי ושם משפחה כדי לזהות את החשבון שלך',
    icon: 'sparkles-outline',
    cta: 'המשך לטלפון',
  },
  phone: {
    title: 'מה הטלפון שלך?',
    subtitle: 'נשלח קוד אימות בהודעת SMS כדי לאבטח את החשבון',
    icon: 'call-outline',
    cta: 'המשך לסיסמה',
  },
  password: {
    title: 'בחר סיסמה חזקה',
    subtitle: 'לפחות 6 תווים. מומלץ לשלב אותיות ומספרים',
    icon: 'lock-closed-outline',
    cta: 'שליחת קוד אימות',
  },
  verification: {
    title: 'אימות מספר טלפון',
    subtitle: 'הזן את קוד האימות שקיבלת כדי להשלים הרשמה',
    icon: 'shield-checkmark-outline',
    cta: 'אמת וסיים הרשמה',
  },
};

export default function RegisterScreen() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<RegisterStep>('name');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const stepIndex = stepOrder.indexOf(currentStep);
  const fullName = useMemo(() => `${firstName.trim()} ${lastName.trim()}`.trim(), [firstName, lastName]);

  const goBack = () => {
    if (currentStep === 'name') {
      router.replace('/auth-choice');
      return;
    }

    const prevStep = stepOrder[Math.max(stepIndex - 1, 0)];
    setCurrentStep(prevStep);
  };

  const validateNameStep = () => {
    if (!firstName.trim()) {
      Alert.alert('שגיאה', 'אנא הזן שם פרטי');
      return false;
    }

    if (firstName.trim().length < 2) {
      Alert.alert('שגיאה', 'שם פרטי חייב להכיל לפחות 2 תווים');
      return false;
    }

    return true;
  };

  const validatePhoneStep = () => {
    const phoneDigits = phone.replace(/\D/g, '');

    if (!phoneDigits) {
      Alert.alert('שגיאה', 'אנא הזן מספר טלפון');
      return false;
    }

    if (phoneDigits.length < 9) {
      Alert.alert('שגיאה', 'מספר הטלפון קצר מדי');
      return false;
    }

    return true;
  };

  const validatePasswordStep = () => {
    if (!password.trim()) {
      Alert.alert('שגיאה', 'אנא הזן סיסמה');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('שגיאה', 'סיסמה חייבת להכיל לפחות 6 תווים');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return false;
    }

    return true;
  };

  const handleSendVerification = async () => {
    setLoading(true);

    try {
      const result = await sendSMSVerification(phone);
      setVerificationId(result.verificationId);
      setCurrentStep('verification');
      Alert.alert('קוד נשלח', `שלחנו קוד אימות ל-${phone}`);
    } catch (error) {
      console.error('SMS verification error:', error);
      Alert.alert('שגיאה', 'לא ניתן לשלוח קוד אימות כרגע');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('שגיאה', 'אנא הזן קוד אימות');
      return;
    }

    setLoading(true);

    try {
      await registerUserWithPhone(phone, fullName, verificationId, verificationCode, password);
      Alert.alert('הצלחה', 'נרשמת בהצלחה!', [{ text: 'אישור', onPress: () => router.replace('/(tabs)') }]);
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = 'שגיאה בהרשמה';

      if (error?.message) {
        if (error.message.includes('Invalid verification code')) {
          errorMessage = 'קוד האימות שגוי. אנא נסה שוב.';
        } else if (error.message.includes('Verification ID not found')) {
          errorMessage = 'פג תוקף הקוד. אנא שלח קוד חדש.';
        } else if (error.message.includes('Verification code expired')) {
          errorMessage = 'פג תוקף הקוד. אנא שלח קוד חדש.';
        } else if (error.message.includes('email-already-in-use')) {
          errorMessage = 'כבר קיים חשבון עם מספר הטלפון הזה.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('שגיאה', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onContinue = async () => {
    if (currentStep === 'name') {
      if (!validateNameStep()) {
        return;
      }

      setCurrentStep('phone');
      return;
    }

    if (currentStep === 'phone') {
      if (!validatePhoneStep()) {
        return;
      }

      setCurrentStep('password');
      return;
    }

    if (currentStep === 'password') {
      if (!validatePasswordStep()) {
        return;
      }

      await handleSendVerification();
      return;
    }

    await handleVerifyAndRegister();
  };

  const renderStepFields = () => {
    if (currentStep === 'name') {
      return (
        <>
          <Text style={styles.label}>שם פרטי</Text>
          <TextInput
            style={styles.input}
            placeholder="לדוגמה: גל"
            placeholderTextColor="#8c8c9d"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            textAlign="right"
            returnKeyType="next"
          />

          <Text style={styles.label}>שם משפחה (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            placeholder="לדוגמה: שמש"
            placeholderTextColor="#8c8c9d"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            textAlign="right"
            returnKeyType="done"
          />
        </>
      );
    }

    if (currentStep === 'phone') {
      return (
        <>
          <Text style={styles.label}>מספר טלפון</Text>
          <TextInput
            style={styles.input}
            placeholder="050-123-4567"
            placeholderTextColor="#8c8c9d"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textAlign="right"
            returnKeyType="done"
          />

          <View style={styles.tipCard}>
            <Ionicons name="information-circle-outline" size={18} color="#fcd34d" />
            <Text style={styles.tipText}>המספר נשמר בצורה מאובטחת ומשמש להתחברות ולאימות</Text>
          </View>
        </>
      );
    }

    if (currentStep === 'password') {
      return (
        <>
          <Text style={styles.label}>סיסמה</Text>
          <TextInput
            style={styles.input}
            placeholder="לפחות 6 תווים"
            placeholderTextColor="#8c8c9d"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
            returnKeyType="next"
          />

          <Text style={styles.label}>אימות סיסמה</Text>
          <TextInput
            style={styles.input}
            placeholder="הקלד שוב את הסיסמה"
            placeholderTextColor="#8c8c9d"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textAlign="right"
            returnKeyType="done"
          />
        </>
      );
    }

    return (
      <>
        <Text style={styles.phoneSummary}>קוד נשלח אל: {phone}</Text>

        <Text style={styles.label}>קוד אימות</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="------"
          placeholderTextColor="#8c8c9d"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          textAlign="center"
          maxLength={6}
          returnKeyType="done"
        />

        <TouchableOpacity style={styles.resendButton} onPress={handleSendVerification} disabled={loading}>
          <Text style={styles.resendButtonText}>שלח קוד חדש</Text>
        </TouchableOpacity>
      </>
    );
  };

  const currentMeta = stepMeta[currentStep];

  return (
    <LinearGradient colors={['#09090f', '#111827', '#1f1147']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>הרשמה</Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.progressRow}>
            {stepOrder.map((stepName, index) => {
              const active = index <= stepIndex;
              return <View key={stepName} style={[styles.progressSegment, active && styles.progressSegmentActive]} />;
            })}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <View style={styles.stepBadge}>
                <Ionicons name={currentMeta.icon} size={20} color="#f8fafc" />
              </View>

              <Text style={styles.title}>{currentMeta.title}</Text>
              <Text style={styles.subtitle}>{currentMeta.subtitle}</Text>

              <View style={styles.formSection}>{renderStepFields()}</View>

              <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={onContinue} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{currentMeta.cta}</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.linkText}>יש לך חשבון? התחבר</Text>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                בהמשך השימוש באפליקציה, אתה מסכים ל
                <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>
                  {' '}תנאי השימוש
                </Text>
                {' '}ו
                <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>
                  {' '}מדיניות הפרטיות
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={showTerms} transparent animationType="fade" onRequestClose={() => setShowTerms(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>תנאי שימוש ומדיניות פרטיות</Text>
              <ScrollView style={styles.modalScrollView}>
                <Text style={styles.modalText}>
                  <Text style={styles.sectionTitle}>תנאי שימוש - torix{'\n\n'}</Text>
                  <Text style={styles.subsectionTitle}>1. קבלת השירות{'\n'}</Text>
                  • השירות מיועד לקביעת תורים במספרת torix{'\n'}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressSegmentActive: {
    backgroundColor: '#f59e0b',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.35)',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: screenWidth < 360 ? 24 : 28,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 8,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 18,
  },
  formSection: {
    marginBottom: 14,
  },
  label: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(15,23,42,0.65)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 14,
  },
  codeInput: {
    letterSpacing: 10,
    fontWeight: '700',
    fontSize: 22,
  },
  tipCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
    marginBottom: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    color: '#fde68a',
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  phoneSummary: {
    color: '#dbeafe',
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 12,
  },
  resendButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  resendButtonText: {
    color: '#bfdbfe',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  linkText: {
    color: '#dbeafe',
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 10,
  },
  termsText: {
    color: '#bfc7d8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#f8fafc',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '82%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalScrollView: {
    width: '100%',
    flex: 1,
  },
  modalText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  contactInfo: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 14,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 13,
    marginTop: 14,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
