import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Barber,
  getBarbers,
  updateBarberProfile
} from '../../services/firebase';
import ToastMessage from '../components/ToastMessage';
import TopNav from '../components/TopNav';
import {
  SLOT_SIZE_MINUTES,
  generateTimeSlots,
  getDayOfWeekFromYMD,
  isOnGrid,
  toMin,
  toYMD
} from '../constants/scheduling';

interface AdminAvailabilityScreenProps {
  onNavigate: (screen: string) => void;
  onBack?: () => void;
}

// ---------- Utils (מקומיים לקומפוננטה) ----------
const addMinutesSafe = (hhmm: string, delta: number) => {
  const t = toMin(hhmm) + delta;
  const h = String(Math.floor(t / 60)).padStart(2, '0');
  const m = String(t % 60).padStart(2, '0');
  return `${h}:${m}`;
};

// Generate next 14 days with Friday/Saturday unavailable by default
const generateNext14Days = () => {
  const days = [];
  const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay();
    const hebrewDay = hebrewDays[dayOfWeek];
    const dayNum = date.getDate();
    const month = date.getMonth() + 1;
    const isToday = i === 0;

    // Friday = 5, Saturday = 6 - unavailable by default
    const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6;

    days.push({
      date: toYMD(date), // Use local date format
      weekday: hebrewDay,
      displayDate: `${hebrewDay}, ${dayNum}/${month}`,
      fullDate: `${isToday ? 'היום - ' : ''}${hebrewDay} ${dayNum}/${month}`,
      isAvailable: false, // Will be set from Firebase
      isFridayOrSaturday,
      timeSlots: [] as string[],
    });
  }
  return days;
};

// Simple time slots from 08:00 to 24:00 in 25-minute increments
const getTimeSlots = () => {
  return generateTimeSlots(8, 24); // 8:00 → 24:00 (exclusive) = 08:00, 08:25, 08:50, 09:00, ... 23:35
};

// Helper: for TODAY, prevent enabling past slots
const isTimeSlotPassed = (date: string, time: string): boolean => {
  const today = new Date();
  const todayString = toYMD(today);
  if (date !== todayString) return false;

  const [hour, minute] = time.split(':').map(Number);
  const slotTime = new Date();
  slotTime.setHours(hour, minute, 0, 0);
  return slotTime < today;
};

const AdminAvailabilityScreen: React.FC<AdminAvailabilityScreenProps> = ({ onNavigate, onBack }) => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [availability, setAvailability] = useState<{
    date: string;
    weekday: string;
    displayDate: string;
    fullDate: string;
    isAvailable: boolean;
    isFridayOrSaturday: boolean;
    timeSlots: string[];
  }[]>(generateNext14Days());
  const [bookedSlots, setBookedSlots] = useState<{[key: string]: string[]}>({});

  const db = getFirestore();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };
  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const loadBarbers = useCallback(async () => {
    try {
      setLoading(true);
      const barbersData = await getBarbers();
      setBarbers(barbersData);
    } catch (error) {
      console.error('Error loading barbers:', error);
      showToast('שגיאה בטעינת הספרים', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  // ------- Loading existing availability (date-specific model) -------
  const loadBarberAvailability = async (barberId: string) => {
    try {
      console.log('🔍 Loading availability for barber:', barberId);

      // Load availability from existing collection but use date-specific approach
      const q = query(collection(db, 'availability'), where('barberId', '==', barberId));
      const snap = await getDocs(q);

      console.log('📊 Found availability documents:', snap.docs.length);

      // Use weekly availability and apply to 14-day format
      const weeklyAvailability: {[key: number]: string[]} = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        console.log('📄 Availability doc:', doc.id, data);
        if (data.isAvailable) {
          let slots = [];

          // Use exact availableSlots if available (new format)
          if (data.availableSlots && Array.isArray(data.availableSlots)) {
            slots = data.availableSlots;
            console.log('✅ Using exact slots:', slots);

            // Use slots exactly as they are - no filtering
          } else if (data.startTime && data.endTime) {
            // Fallback to generating from startTime/endTime (old format)
            const startTime = data.startTime;
            const endTime = data.endTime;
            const [startHour] = startTime.split(':').map(Number);
            const [endHour] = endTime.split(':').map(Number);
            slots = generateTimeSlots(startHour, endHour);
            console.log('⚠️ Generated slots from time range:', slots);
          }

          if (slots.length > 0) {
            weeklyAvailability[data.dayOfWeek] = slots;
          }
        }
      });

      console.log('📅 Weekly availability loaded:', weeklyAvailability);

      // Convert weekly pattern to 14-day format
      const next14Days = generateNext14Days();
      const updatedDays = next14Days.map(day => {
        const dayOfWeek = getDayOfWeekFromYMD(day.date);
        const hasAvailability = weeklyAvailability[dayOfWeek];

        console.log(`📅 Day ${day.date} (${dayOfWeek}): ${hasAvailability ? hasAvailability.length : 0} slots`);

        return {
          ...day,
          isAvailable: !!hasAvailability,
          timeSlots: hasAvailability || []
        };
      });

      console.log('📊 Final availability state:', updatedDays);
      setAvailability(updatedDays);
    } catch (e) {
      console.error('Error loading availability:', e);
      showToast('שגיאה בטעינת זמינות', 'error');
    }
  };

  // Load existing appointments for the barber
  const loadBookedSlots = async (barberId: string) => {
    try {
      console.log('🔍 Loading booked slots for barber:', barberId);
      const next14Days = generateNext14Days();
      const bookedSlotsMap: {[key: string]: string[]} = {};

      for (const day of next14Days) {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('barberId', '==', barberId),
          where('date', '==', day.date),
          where('status', '!=', 'cancelled')
        );
        
        const appointmentsSnap = await getDocs(appointmentsQuery);
        const bookedTimes: string[] = [];
        
        appointmentsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.time) {
            bookedTimes.push(data.time);
          }
        });
        
        if (bookedTimes.length > 0) {
          bookedSlotsMap[day.date] = bookedTimes;
          console.log(`📅 Found ${bookedTimes.length} booked slots for ${day.date}:`, bookedTimes);
        }
      }

      setBookedSlots(bookedSlotsMap);
    } catch (error) {
      console.error('Error loading booked slots:', error);
    }
  };

  const openEditModal = async (barber: Barber) => {
    setSelectedBarber(barber);
    await Promise.all([
      loadBarberAvailability(barber.id),
      loadBookedSlots(barber.id)
    ]);
    setModalVisible(true);
  };

  // ------- Real-time listener for availability changes -------
  useEffect(() => {
    if (selectedBarber && modalVisible) {
      console.log('🔔 Setting up real-time listener for barber:', selectedBarber.id);

      const q = query(collection(db, 'availability'), where('barberId', '==', selectedBarber.id));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('📡 Real-time update received:', snapshot.docs.length, 'docs');

        const weeklyAvailability: {[key: number]: string[]} = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.isAvailable) {
            let slots = [];

            // Prefer exact slots if available (new format)
            if (data.availableSlots && Array.isArray(data.availableSlots)) {
              slots = data.availableSlots;

              // Use slots exactly as they are - no filtering
            } else {
              // Fallback to generating from startTime/endTime (old format)
              const startTime = data.startTime;
              const endTime = data.endTime;
              const [startHour] = startTime.split(':').map(Number);
              const [endHour] = endTime.split(':').map(Number);
              slots = generateTimeSlots(startHour, endHour);
            }

            weeklyAvailability[data.dayOfWeek] = slots;
          }
        });

        // Convert weekly pattern to 14-day format
        const next14Days = generateNext14Days();
        const updatedDays = next14Days.map(day => {
          const dayOfWeek = getDayOfWeekFromYMD(day.date);
          const hasAvailability = weeklyAvailability[dayOfWeek];

          return {
            ...day,
            isAvailable: !!hasAvailability,
            timeSlots: hasAvailability || []
          };
        });

        console.log('🔄 Updating availability from real-time listener');
        setAvailability(updatedDays);
      });

      return () => {
        console.log('🔕 Cleaning up real-time listener');
        unsubscribe();
      };
    }
  }, [selectedBarber, modalVisible]);

  // ------- Day toggle (enable/disable entire date) -------
  const toggleDayAvailability = async (date: string) => {
    const dayToToggle = availability.find(d => d.date === date);
    if (!dayToToggle || !selectedBarber) return;

    const newAvailability = !dayToToggle.isAvailable;
    
    // Update local state immediately
    setAvailability(prev => prev.map(day => 
      day.date === date 
        ? { ...day, isAvailable: newAvailability, timeSlots: [] }
        : day
    ));

    // Save to Firebase using date-specific model
    try {
      const barberId = selectedBarber.id;

      if (newAvailability) {
        // If making available, set default 9:00-17:00 schedule with 25-minute slots
        const defaultSlots = generateTimeSlots(9, 17);
        console.log('✅ Creating default slots for date:', date, defaultSlots);

        const dayOfWeek = getDayOfWeekFromYMD(date);

        const docData = {
          barberId,
          dayOfWeek, // Use dayOfWeek for now
          startTime: '09:00',
          endTime: '17:00',
          availableSlots: defaultSlots, // Save exact slots
          isAvailable: true,
          createdAt: new Date()
        };

        // Delete existing record for this dayOfWeek first
        const existingQuery = query(collection(db, 'availability'),
          where('barberId', '==', barberId),
          where('dayOfWeek', '==', dayOfWeek));
        const existingDocs = await getDocs(existingQuery);
        await Promise.all(existingDocs.docs.map(doc => deleteDoc(doc.ref)));
        console.log('🗑️ Deleted existing records for dayOfWeek:', dayOfWeek);

        // Add new record
        await setDoc(doc(collection(db, 'availability')), docData);
        console.log('💾 Saved new availability record:', docData);

        // Update local state with default slots
        setAvailability(prev => prev.map(day =>
          day.date === date
            ? { ...day, isAvailable: true, timeSlots: defaultSlots }
            : day
        ));

        showToast('יום הופעל עם שעות ברירת מחדל (09:00-17:00)', 'success');
      } else {
        // If making unavailable, delete the record for this dayOfWeek
        const dayOfWeek = getDayOfWeekFromYMD(date);
        const existingQuery = query(collection(db, 'availability'),
          where('barberId', '==', barberId),
          where('dayOfWeek', '==', dayOfWeek));
        const existingDocs = await getDocs(existingQuery);
        await Promise.all(existingDocs.docs.map(doc => deleteDoc(doc.ref)));

        showToast('יום בוטל בהצלחה', 'success');
      }
    } catch (error) {
      console.error('Error updating day availability:', error);
      showToast('שגיאה בעדכון זמינות', 'error');
      
      // Revert local state on error
      setAvailability(prev => prev.map(day => 
        day.date === date 
          ? { ...day, isAvailable: !newAvailability, timeSlots: dayToToggle.timeSlots }
          : day
      ));
    }
  };

  // ------- Per-slot toggle (single slot) -------
  const toggleTimeSlot = async (date: string, time: string) => {
    console.log('🎯 toggleTimeSlot called:', { date, time, selectedBarber: selectedBarber?.name });
    
    if (!selectedBarber) {
      console.log('❌ No selected barber');
      return;
    }

    // Validate that the time is on the 25-minute grid
    if (!isOnGrid(time)) {
      console.log('❌ Time not on grid:', time);
      showToast(`זמן חייב להיות על גריד של ${SLOT_SIZE_MINUTES} דקות (HH:00, HH:25, HH:50)`, 'error');
      return;
    }

    // Check if trying to select a passed time slot (only prevent selection, not deselection)
    const dayTimeSlots: string[] = availability.find(day => day.date === date)?.timeSlots || [];
    const isCurrentlySelected = dayTimeSlots.includes(time);
    
    console.log('📊 Current state:', { 
      date, 
      time, 
      dayTimeSlots, 
      isCurrentlySelected,
      hasPassed: isTimeSlotPassed(date, time)
    });
    
    if (!isCurrentlySelected && isTimeSlotPassed(date, time)) {
      console.log('❌ Trying to select passed time slot');
      showToast('לא ניתן לבחור שעות שכבר עברו', 'error');
      return;
    }

    console.log('✅ Proceeding with toggle...');

    // Update local state immediately
    setAvailability(prev => {
      console.log('🔄 Updating local state...');
      const updatedAvailability = prev.map(day => {
        if (day.date === date) {
          const currentSlots = day.timeSlots || [];
          const isSelected = currentSlots.includes(time);
          const newSlots = isSelected 
            ? currentSlots.filter(slot => slot !== time)
            : [...currentSlots, time].sort((a, b) => toMin(a) - toMin(b));
          
          console.log('📝 Slot change:', {
            date,
            time,
            wasSelected: isSelected,
            currentSlots,
            newSlots
          });
          
          return { ...day, timeSlots: newSlots };
        }
        return day;
      });

      // Save to Firebase immediately
      saveTimeSlotToFirebase(updatedAvailability, date, time);
      
      return updatedAvailability;
    });
  };

  // ------- Save time slot to Firebase (date-specific model) -------
  const saveTimeSlotToFirebase = async (updatedAvailability: any[], date: string, time: string) => {
    try {
      console.log('💾 saveTimeSlotToFirebase called:', { date, time });
      const barberId = selectedBarber?.id;
      if (!barberId) {
        console.log('❌ No barber ID');
        return;
      }

      console.log('📊 Full updatedAvailability:', updatedAvailability);
      console.log('🗓️ ADMIN SAVING - TODAY\'S DATE:', new Date().toLocaleDateString());
      const todayDayOfWeek = new Date().getDay();
      console.log('🗓️ ADMIN SAVING - TODAY\'S DAY OF WEEK:', todayDayOfWeek);

      // Get updated slots for this specific date
      const updatedDay = updatedAvailability.find(day => day.date === date);
      if (!updatedDay) {
        console.log('❌ No updated day found for date:', date);
        return;
      }

      const currentSlots = updatedDay.timeSlots || [];
      const dayOfWeek = getDayOfWeekFromYMD(date);
      console.log('🔍 ADMIN DAYOFWEEK CALC: date=' + date + ', dayOfWeek=' + dayOfWeek);

      console.log('📅 Updated slots for', date, ':', currentSlots);
      if (dayOfWeek === todayDayOfWeek) {
        console.log('🎯 ADMIN SAVING TODAY: Will save these slots for today:', currentSlots);
      }

      if (currentSlots.length === 0) {
        // No slots selected, delete the availability record for this dayOfWeek
        const existingQuery = query(collection(db, 'availability'),
          where('barberId', '==', barberId),
          where('dayOfWeek', '==', dayOfWeek));
        const existingDocs = await getDocs(existingQuery);
        await Promise.all(existingDocs.docs.map(doc => deleteDoc(doc.ref)));
        console.log('🗑️ Deleted availability for dayOfWeek:', dayOfWeek);

        // Update local state to mark day as unavailable
        setAvailability(prev => prev.map(day =>
          day.date === date
            ? { ...day, isAvailable: false, timeSlots: [] }
            : day
        ));
      } else {
        // Save the exact slots array for this specific date
        const sortedSlots = [...currentSlots].sort((a, b) => toMin(a) - toMin(b));

        const startTime = sortedSlots[0];
        const finalEndTime = addMinutesSafe(sortedSlots[sortedSlots.length - 1], SLOT_SIZE_MINUTES);

        // CRITICAL: Ensure availableSlots is always an array
        if (!sortedSlots || !Array.isArray(sortedSlots) || sortedSlots.length === 0) {
          console.error('❌ CRITICAL ERROR: sortedSlots is invalid:', sortedSlots);
          showToast('שגיאה: רשימת השעות לא תקינה', 'error');
          return;
        }

        const docData = {
          barberId,
          dayOfWeek, // Use dayOfWeek for now
          startTime,
          endTime: finalEndTime,
          availableSlots: sortedSlots, // Save the exact slots - MUST BE ARRAY
          isAvailable: true,
          createdAt: new Date()
        };

        console.log('💾 Saving weekly availability with validation:', docData);
        console.log('🔍 availableSlots type:', typeof docData.availableSlots, 'length:', docData.availableSlots.length);
        console.log('🎯 EXACT ADMIN SAVE: barberId=' + barberId + ', dayOfWeek=' + dayOfWeek + ', date=' + date);
        console.log('🎯 EXACT ADMIN SAVE: availableSlots=' + JSON.stringify(docData.availableSlots));
        console.log('🎯 CUSTOMER SHOULD SEE: barberId=' + barberId + ', dayOfWeek=' + dayOfWeek + ', exactSlots=' + JSON.stringify(docData.availableSlots));
        if (dayOfWeek === todayDayOfWeek) {
          console.log('🎯 ADMIN SAVED TODAY: Final availableSlots for today:', docData.availableSlots);
          console.log('🎯 ADMIN SAVED TODAY: Customer should see exactly these slots:', docData.availableSlots);
        }

        // Delete existing record for this dayOfWeek first
        const existingQuery = query(collection(db, 'availability'),
          where('barberId', '==', barberId),
          where('dayOfWeek', '==', dayOfWeek));
        const existingDocs = await getDocs(existingQuery);
        await Promise.all(existingDocs.docs.map(doc => deleteDoc(doc.ref)));

        // Add updated record
        await setDoc(doc(collection(db, 'availability')), docData);
        console.log('✅ Saved availability for dayOfWeek:', dayOfWeek);
      }
    } catch (error) {
      console.error('Error updating time slot:', error);
      showToast('שגיאה בעדכון שעות', 'error');
    }
  };

  // ------- Save button: sync current 14-day state to weekly model -------
  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Starting save for barber:', selectedBarber?.name);
      console.log('📅 Current availability state:', availability);

      const barberId = selectedBarber?.id || '';

      // Delete existing weekly availability records for this barber
      console.log('🗑️ Deleting existing weekly availability records...');
      const existingQuery = query(collection(db, 'availability'), where('barberId', '==', barberId));
      const existingDocs = await getDocs(existingQuery);
      console.log('🗑️ Found', existingDocs.docs.length, 'existing weekly records to delete');
      await Promise.all(existingDocs.docs.map(doc => deleteDoc(doc.ref)));

      // Delete existing daily-specific availability records for this barber
      console.log('🗑️ Deleting existing daily availability records...');
      const existingDailyQuery = query(collection(db, 'dailyAvailability'), where('barberId', '==', barberId));
      const existingDailyDocs = await getDocs(existingDailyQuery);
      console.log('🗑️ Found', existingDailyDocs.docs.length, 'existing daily records to delete');
      await Promise.all(existingDailyDocs.docs.map(doc => deleteDoc(doc.ref)));

      // Save daily-specific availability for each of the 14 days
      console.log('💾 Saving daily-specific availability...');
      const savePromises: Promise<any>[] = [];

      availability.forEach(day => {
        const dayOfWeek = getDayOfWeekFromYMD(day.date);
        console.log(`📅 Processing day ${day.date} (${dayOfWeek}) - Available: ${day.isAvailable}, Slots: ${day.timeSlots?.length || 0}`);

        if (day.isAvailable && day.timeSlots && day.timeSlots.length > 0) {
          const sortedSlots = [...day.timeSlots].sort((a, b) => toMin(a) - toMin(b));

          // CRITICAL: Double-check availableSlots before saving
          if (!Array.isArray(sortedSlots) || sortedSlots.length === 0) {
            console.error(`❌ CRITICAL ERROR: Invalid slots for date ${day.date}:`, sortedSlots);
            return; // Skip this day to prevent corrupt data
          }

          const startTime = sortedSlots[0];
          const finalEndTime = addMinutesSafe(sortedSlots[sortedSlots.length - 1], SLOT_SIZE_MINUTES);

          // Save to dailyAvailability collection with specific date
          const docData = {
            barberId,
            date: day.date, // Specific date (YYYY-MM-DD)
            dayOfWeek, // Keep for reference
            startTime,
            endTime: finalEndTime,
            availableSlots: sortedSlots,
            isAvailable: true,
            createdAt: new Date()
          };

          console.log(`💾 Saving daily availability for ${day.date} with validation:`, docData);
          console.log(`🔍 availableSlots validation - type: ${typeof docData.availableSlots}, isArray: ${Array.isArray(docData.availableSlots)}, length: ${docData.availableSlots.length}`);
          savePromises.push(setDoc(doc(collection(db, 'dailyAvailability')), docData));
        }
      });

      // Also save weekly pattern as fallback (for days beyond the 14-day window)
      console.log('💾 Saving weekly availability pattern as fallback...');
      const weeklyPattern: {[key: number]: string[]} = {};

      availability.forEach(day => {
        const dayOfWeek = getDayOfWeekFromYMD(day.date);
        if (day.isAvailable && day.timeSlots && day.timeSlots.length > 0) {
          if (!weeklyPattern[dayOfWeek] || day.timeSlots.length > weeklyPattern[dayOfWeek].length) {
            weeklyPattern[dayOfWeek] = [...day.timeSlots].sort((a, b) => toMin(a) - toMin(b));
          }
        }
      });

      console.log('📊 Weekly pattern to save:', weeklyPattern);

      Object.keys(weeklyPattern).forEach(dayOfWeekStr => {
        const dayOfWeek = parseInt(dayOfWeekStr);
        const slots = weeklyPattern[dayOfWeek];

        if (slots && slots.length > 0) {
          const sortedSlots = [...slots].sort((a, b) => toMin(a) - toMin(b));

          if (!Array.isArray(sortedSlots) || sortedSlots.length === 0) {
            console.error(`❌ CRITICAL ERROR: Invalid slots for dayOfWeek ${dayOfWeek}:`, sortedSlots);
            return;
          }

          const startTime = sortedSlots[0];
          const finalEndTime = addMinutesSafe(sortedSlots[sortedSlots.length - 1], SLOT_SIZE_MINUTES);

          const docData = {
            barberId,
            dayOfWeek,
            startTime,
            endTime: finalEndTime,
            availableSlots: sortedSlots,
            isAvailable: true,
            createdAt: new Date()
          };

          console.log(`💾 Saving weekly availability for dayOfWeek ${dayOfWeek}:`, docData);
          savePromises.push(setDoc(doc(collection(db, 'availability')), docData));
        }
      });

      await Promise.all(savePromises);
      console.log('✅ All daily and weekly availability records saved successfully');

      // Update barber's available status in barbers collection
      const hasAnyAvailability = availability.some(d => d.isAvailable && (d.timeSlots?.length || 0) > 0);
      console.log('📊 Barber has availability:', hasAnyAvailability);
      if (selectedBarber) {
        await updateBarberProfile(selectedBarber.id, { available: hasAnyAvailability });
        // Update local state
        setBarbers(prev => prev.map(b =>
          b.id === selectedBarber.id ? { ...b, available: hasAnyAvailability } : b
        ));
      }

      Alert.alert('הזמינות נשמרה בהצלחה!');
      setModalVisible(false);
      setSelectedBarber(null);
      // Keep the current availability state (don't reset)
      showToast('זמינות נשמרה בהצלחה - סינכרון מלא!', 'success');
    } catch (e) {
      console.error('Error saving availability:', e);
      Alert.alert('שגיאה בשמירת זמינות');
      showToast('שגיאה בשמירת זמינות', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopNav
        title="ניהול זמינות"
        onBellPress={() => {}}
        onMenuPress={() => {}}
        showBackButton={true}
        onBackPress={onBack || (() => onNavigate('admin-home'))}
      />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>טוען ספרים...</Text>
          </View>
        ) : (
          <ScrollView style={styles.barbersList}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>בחר ספר לעריכת זמינות</Text>
              <Text style={styles.headerSubtitle}>
                כאן תוכל לקבוע את שעות העבודה הזמינות לכל ספר
              </Text>
            </View>

            {barbers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>אין ספרים במערכת</Text>
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={() => onNavigate('admin-team')}
                >
                  <Text style={styles.emptyAddButtonText}>הוסף ספר ראשון</Text>
                </TouchableOpacity>
              </View>
            ) : (
              barbers.map((barber) => (
                <TouchableOpacity
                  key={barber.id}
                  style={styles.barberCard}
                  onPress={() => openEditModal(barber)}
                >
                  <View style={styles.barberInfo}>
                    <View style={styles.barberImageContainer}>
                      <View className="barberImage">
                        <Text style={styles.barberPlaceholder}>✂️</Text>
                      </View>
                    </View>

                    <View style={styles.barberDetails}>
                      <Text style={styles.barberName}>{barber.name}</Text>
                      <Text style={styles.barberExperience}>{barber.experience}</Text>
                      <Text style={styles.editHint}>לחץ לעריכת זמינות</Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Edit Availability Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                עריכת זמינות - {selectedBarber?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.instructionText}>
                שליטה מלאה על זמינות {selectedBarber?.name}
              </Text>
              <Text style={styles.subInstructionText}>
                כל סלוט הוא 25 דקות. ברירת מחדל: ימי שישי ושבת לא זמינים, שעות 09:00-17:00 כשמפעילים יום.
              </Text>

              <Text style={styles.debugText}>
                נמצאו {availability.length} ימים
              </Text>

              {availability.map((day) => (
                <View key={day.date} style={styles.dayCard}>
                  <View style={styles.dayTitleContainer}>
                    <Text style={styles.dayTitle}>{day.fullDate}</Text>
                  </View>
                  <View style={styles.dayNameHeader}>
                    <Text style={styles.dayNameText}>יום {day.weekday}</Text>
                    <Text style={styles.dayDateText}>{day.displayDate}</Text>
                  </View>
                  <View style={styles.dayHeader}>
                    <TouchableOpacity
                      onPress={() => toggleDayAvailability(day.date)}
                      style={[
                        styles.toggleButton,
                        day.isAvailable ? styles.activeButton : styles.inactiveButton,
                        day.isFridayOrSaturday && styles.weekendButton
                      ]}
                    >
                      <Text style={styles.toggleText}>
                        {day.isAvailable ? 'פעיל' : 'לא פעיל'}
                        {day.isFridayOrSaturday && ' (סופ"ש)'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {day.isAvailable && (
                    <View style={styles.timeGrid}>
                      <Text style={styles.timeGridTitle}>בחר שעות זמינות:</Text>
                      <View style={styles.timeSlots}>
                        {getTimeSlots().map((time) => {
                          const isSelected = (day.timeSlots || []).includes(time);
                          const hasPassed = isTimeSlotPassed(day.date, time);
                          const isBooked = (bookedSlots[day.date] || []).includes(time);

                          return (
                            <TouchableOpacity
                              key={`${day.date}-${time}`}
                              style={[
                                styles.timeSlot,
                                hasPassed
                                  ? styles.passedTimeSlot
                                  : isBooked
                                  ? styles.bookedTimeSlot
                                  : isSelected
                                  ? styles.selectedTimeSlot
                                  : styles.unselectedTimeSlot
                              ]}
                              onPress={() => {
                                console.log('👆 TouchableOpacity pressed:', { 
                                  date: day.date, 
                                  time, 
                                  isSelected, 
                                  hasPassed,
                                  isBooked,
                                  disabled: hasPassed || isBooked 
                                });
                                if (!hasPassed && !isBooked) {
                                  toggleTimeSlot(day.date, time);
                                } else if (hasPassed) {
                                  console.log('❌ Slot disabled - has passed');
                                } else if (isBooked) {
                                  console.log('❌ Slot disabled - already booked');
                                }
                              }}
                              disabled={hasPassed || isBooked}
                            >
                              <Text
                                style={[
                                  styles.timeSlotText,
                                  hasPassed
                                    ? styles.passedTimeSlotText
                                    : isBooked
                                    ? styles.bookedTimeSlotText
                                    : isSelected && styles.selectedTimeSlotText
                                ]}
                              >
                                {isBooked ? `${time} 📅` : time}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <Text style={styles.selectedCount}>
                        נבחרו: {day.timeSlots?.length || 0} שעות
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'שומר...' : 'שמור זמינות'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ToastMessage
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, paddingTop: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20, fontWeight: 'bold', color: '#222', textAlign: 'right', marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14, color: '#666', textAlign: 'right', lineHeight: 20 },
  barbersList: { flex: 1, padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyStateText: { fontSize: 16, color: '#666', marginTop: 16, marginBottom: 24 },
  emptyAddButton: { backgroundColor: '#007bff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyAddButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  barberCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  barberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  barberImageContainer: { position: 'relative', marginLeft: 16 },
  barberPlaceholder: { fontSize: 24, color: '#666' },
  barberDetails: { flex: 1 },
  barberName: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 4, textAlign: 'right' },
  barberExperience: { fontSize: 14, color: '#666', marginBottom: 4, textAlign: 'right' },
  editHint: { fontSize: 12, color: '#007bff', textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, margin: 20, width: '95%', maxWidth: 500, height: '85%', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', flex: 1, textAlign: 'right' },
  modalBody: { flex: 1, marginBottom: 20 },
  timeSlot: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, marginBottom: 8,
    minWidth: 70, alignItems: 'center',
  },
  selectedTimeSlot: { backgroundColor: '#007bff', borderColor: '#007bff' },
  timeSlotText: { fontSize: 14, color: '#666' },
  selectedTimeSlotText: { color: '#fff', fontWeight: '500' },
  passedTimeSlot: { backgroundColor: '#f8f9fa', borderColor: '#e9ecef', opacity: 0.6 },
  passedTimeSlotText: { color: '#adb5bd', textDecorationLine: 'line-through' },
  bookedTimeSlot: { backgroundColor: '#ffc107', borderColor: '#ffb300' },
  bookedTimeSlotText: { color: '#fff', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ddd' },
  saveButton: { backgroundColor: '#007bff' },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  instructionText: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  debugText: { fontSize: 14, color: '#007bff', textAlign: 'center', marginBottom: 10, backgroundColor: '#f0f8ff', padding: 8, borderRadius: 4 },
  dayCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  dayTitleContainer: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#007bff' },
  dayTitle: { fontSize: 20, fontWeight: 'bold', color: '#007bff', textAlign: 'center' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  activeButton: { backgroundColor: '#28a745' },
  inactiveButton: { backgroundColor: '#dc3545' },
  toggleText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  timeGrid: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  timeGridTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 12, textAlign: 'center' },
  timeSlots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  unselectedTimeSlot: { backgroundColor: '#f8f9fa', borderColor: '#ddd' },
  selectedCount: { fontSize: 14, color: '#007bff', fontWeight: '600', textAlign: 'center', marginTop: 12, padding: 8, backgroundColor: '#e3f2fd', borderRadius: 6 },
  dayNameHeader: { backgroundColor: '#007bff', borderRadius: 8, padding: 16, marginBottom: 16, alignItems: 'center' },
  dayNameText: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  dayDateText: { fontSize: 16, color: '#e3f2fd', textAlign: 'center', marginTop: 4 },
  subInstructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20
  },
  weekendButton: { borderWidth: 2, borderColor: '#ff9800' },
});

export default AdminAvailabilityScreen;