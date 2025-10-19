# 📋 קוד מוכן להעתקה - מערכת Slots ללקוח חדש

## 🎯 הכל מוכן להעתקה ישירה!

---

## 1️⃣ קובץ: `scheduling.ts` - קונפיגורציה בסיסית

```typescript
// app/constants/scheduling.ts

/**
 * גודל Slot בסיסי בדקות
 * ניתן לשנות ל: 15, 30, או 60 דקות
 */
export const SLOT_SIZE_MINUTES = 15;

/**
 * משכי טיפולים מותרים (בדקות)
 * התאם לפי סוגי הטיפולים של הלקוח
 */
export const VALID_DURATIONS = [15, 30, 45, 60];

/**
 * בדיקה: האם משך הטיפול תקין?
 */
export const isValidDuration = (duration: number): boolean => {
  return VALID_DURATIONS.includes(duration);
};

/**
 * בדיקה: האם הזמן נמצא על ה-grid של slots?
 * לדוגמה: 09:15 תקין, 09:17 לא תקין
 */
export const isOnGrid = (time: string, gridSize: number = SLOT_SIZE_MINUTES): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes % gridSize === 0;
};

/**
 * בדיקה: האם הטיפול נכנס ביום (לא חוצה חצות)?
 */
export const slotFitsInDay = (startTime: string, duration: number): boolean => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  return endMinutes <= 24 * 60; // 1440 דקות ביום
};

/**
 * חישוב זמן סיום מזמן התחלה ומשך
 */
export const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

/**
 * יצירת רשימת כל ה-slots האפשריים
 * 
 * @param startHour - שעת התחלה (9 = 09:00)
 * @param endHour - שעת סיום (19 = 19:00)
 * @param slotSize - גודל slot בדקות (15)
 * @returns מערך של זמנים: ["09:00", "09:15", "09:30", ...]
 */
export const generateTimeSlots = (
  startHour: number = 9,
  endHour: number = 19,
  slotSize: number = SLOT_SIZE_MINUTES
): string[] => {
  const slots: string[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotSize) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  
  return slots;
};

/**
 * המרת זמן למספר דקות
 * "09:30" → 570 דקות
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * המרת דקות לזמן
 * 570 דקות → "09:30"
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
```

---

## 2️⃣ קובץ: `firebase.ts` - פונקציות ניהול זמינות

### חלק 1: Types & Interfaces

```typescript
// הוסף ל-services/firebase.ts

export interface WorkingHours {
  start: string;      // "09:00"
  end: string;        // "19:00"
  isWorking: boolean; // true/false
}

export interface BarberSchedule {
  sunday?: WorkingHours;
  monday?: WorkingHours;
  tuesday?: WorkingHours;
  wednesday?: WorkingHours;
  thursday?: WorkingHours;
  friday?: WorkingHours;
  saturday?: WorkingHours;
}

export interface BlockedSlots {
  daily?: string[];              // ["13:00", "13:15", "13:30"]
  weekly?: {
    [key: string]: string[];     // { friday: ["12:00", "12:15"] }
  };
}

export interface BarberException {
  isWorking?: boolean;
  start?: string;
  end?: string;
  reason?: string;
}

export interface Barber {
  id: string;
  name: string;
  phone: string;
  image: string;
  available: boolean;
  pricing: number;
  rating: number;
  specialties: string[];
  workingHours?: BarberSchedule;
  blockedSlots?: BlockedSlots;
  exceptions?: {
    [date: string]: BarberException;  // { "2025-10-20": {...} }
  };
}
```

### חלק 2: פונקציה ראשית - חישוב זמינות

```typescript
/**
 * חישוב כל ה-slots הזמינים לספר בתאריך ומשך מסוימים
 * 
 * @param barberId - מזהה הספר
 * @param date - תאריך (פורמט: "2025-10-20")
 * @param duration - משך הטיפול בדקות (15, 30, 45, 60)
 * @returns מערך של slots זמינים ["09:00", "09:15", ...]
 */
export const getAvailableSlots = async (
  barberId: string,
  date: string,
  duration: number
): Promise<string[]> => {
  try {
    console.log(`🔍 [getAvailableSlots] Starting calculation`);
    console.log(`   Barber: ${barberId}`);
    console.log(`   Date: ${date}`);
    console.log(`   Duration: ${duration} minutes`);
    
    // ===== שלב 1: קבל את פרטי הספר =====
    const barberDoc = await getDoc(doc(db, 'barbers', barberId));
    if (!barberDoc.exists()) {
      console.error(`❌ Barber ${barberId} not found`);
      return [];
    }
    
    const barber = barberDoc.data() as Barber;
    
    // בדוק אם הספר זמין בכלל
    if (!barber.available) {
      console.log(`❌ Barber ${barber.name} is not available`);
      return [];
    }
    
    console.log(`✅ Barber found: ${barber.name}`);
    
    // ===== שלב 2: קבע את יום השבוע =====
    const dateObj = new Date(date + 'T00:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    
    console.log(`📅 Day of week: ${dayOfWeek}`);
    
    // ===== שלב 3: קבל שעות עבודה ליום זה =====
    let workingHours = barber.workingHours?.[dayOfWeek] || {
      start: "09:00",
      end: "19:00",
      isWorking: true
    };
    
    // בדוק אם עובד באותו יום
    if (!workingHours.isWorking) {
      console.log(`❌ Barber doesn't work on ${dayOfWeek}`);
      return [];
    }
    
    console.log(`⏰ Working hours: ${workingHours.start} - ${workingHours.end}`);
    
    // ===== שלב 4: בדוק חריגות לתאריך ספציפי =====
    if (barber.exceptions && barber.exceptions[date]) {
      const exception = barber.exceptions[date];
      console.log(`🚨 Exception found for ${date}:`, exception);
      
      if (exception.isWorking === false) {
        console.log(`❌ Barber has day off on ${date}`);
        return [];
      }
      
      // עדכן שעות עבודה אם יש חריגה
      if (exception.start) workingHours.start = exception.start;
      if (exception.end) workingHours.end = exception.end;
      
      console.log(`⏰ Updated hours due to exception: ${workingHours.start} - ${workingHours.end}`);
    }
    
    // ===== שלב 5: צור את כל ה-slots האפשריים =====
    const [startHour] = workingHours.start.split(':').map(Number);
    const [endHour] = workingHours.end.split(':').map(Number);
    
    const allSlots = generateTimeSlots(startHour, endHour, SLOT_SIZE_MINUTES);
    console.log(`📋 Generated ${allSlots.length} potential slots`);
    
    // ===== שלב 6: הסר סלוטים חסומים (הפסקות) =====
    let availableSlots = allSlots.filter(slot => {
      // הפסקות יומיות
      if (barber.blockedSlots?.daily?.includes(slot)) {
        return false;
      }
      
      // הפסקות שבועיות ליום ספציפי
      if (barber.blockedSlots?.weekly?.[dayOfWeek]?.includes(slot)) {
        return false;
      }
      
      return true;
    });
    
    console.log(`📋 After removing blocked slots: ${availableSlots.length} slots`);
    
    // ===== שלב 7: טען תורים קיימים לתאריך זה =====
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('barberId', '==', barberId),
      where('date', '==', date),
      where('status', '==', 'scheduled')
    );
    
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📅 Found ${appointments.length} existing appointments`);
    
    // ===== שלב 8: חשב סלוטים תפוסים =====
    const occupiedSlots = new Set<string>();
    
    appointments.forEach(apt => {
      const [hours, minutes] = apt.time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + (apt.duration || 30);
      
      // סמן כל סלוט שתפוס
      for (let min = startMinutes; min < endMinutes; min += SLOT_SIZE_MINUTES) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        const slotTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        occupiedSlots.add(slotTime);
      }
    });
    
    console.log(`🚫 Occupied slots: ${Array.from(occupiedSlots).join(', ')}`);
    
    // ===== שלב 9: סנן slots שיש בהם מספיק מקום =====
    const finalSlots = availableSlots.filter(slot => {
      // בדוק שהטיפול לא חורג מיום העבודה
      if (!slotFitsInDay(slot, duration)) {
        return false;
      }
      
      // בדוק שכל הסלוטים הנדרשים פנויים
      const [hours, minutes] = slot.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + duration;
      
      for (let min = startMinutes; min < endMinutes; min += SLOT_SIZE_MINUTES) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        const checkSlot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        // אם הסלוט תפוס או לא קיים - לא זמין
        if (occupiedSlots.has(checkSlot) || !availableSlots.includes(checkSlot)) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`✅ Final available slots: ${finalSlots.length}`);
    console.log(`   Slots: ${finalSlots.join(', ')}`);
    
    return finalSlots;
    
  } catch (error) {
    console.error('❌ Error in getAvailableSlots:', error);
    return [];
  }
};
```

### חלק 3: פונקציות עזר נוספות

```typescript
/**
 * בדיקת זמינות של slot ספציפי
 */
export const checkSlotAvailability = async (
  barberId: string,
  date: string,
  time: string,
  duration: number
): Promise<boolean> => {
  const availableSlots = await getAvailableSlots(barberId, date, duration);
  return availableSlots.includes(time);
};

/**
 * קבלת הספר הראשון הזמין לתאריך ומשך מסוימים
 */
export const getFirstAvailableBarber = async (
  barberIds: string[],
  date: string,
  duration: number
): Promise<{ barberId: string; slots: string[] } | null> => {
  for (const barberId of barberIds) {
    const slots = await getAvailableSlots(barberId, date, duration);
    if (slots.length > 0) {
      return { barberId, slots };
    }
  }
  return null;
};

/**
 * קבלת זמינות למספר ימים
 */
export const getAvailabilityForWeek = async (
  barberId: string,
  startDate: string,
  duration: number,
  days: number = 7
): Promise<{ [date: string]: string[] }> => {
  const availability: { [date: string]: string[] } = {};
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const slots = await getAvailableSlots(barberId, dateStr, duration);
    availability[dateStr] = slots;
  }
  
  return availability;
};
```

---

## 3️⃣ דוגמאות שימוש ב-UI

### React Native Component - בחירת זמן

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { getAvailableSlots } from '../services/firebase';

interface TimeSelectorProps {
  barberId: string;
  date: string;
  duration: number;
  onTimeSelected: (time: string) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  barberId,
  date,
  duration,
  onTimeSelected
}) => {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    loadSlots();
  }, [barberId, date, duration]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const availableSlots = await getAvailableSlots(barberId, date, duration);
      setSlots(availableSlots);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimePress = (time: string) => {
    setSelectedTime(time);
    onTimeSelected(time);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>טוען זמינות...</Text>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>😔 אין זמינות</Text>
        <Text style={styles.emptyText}>
          אין slots פנויים לתאריך זה
        </Text>
        <Text style={styles.emptyHint}>
          נסה תאריך אחר או ספר אחר
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        בחר שעה ({slots.length} זמינים)
      </Text>
      
      <ScrollView style={styles.slotsContainer}>
        <View style={styles.slotsGrid}>
          {slots.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[
                styles.slotButton,
                selectedTime === slot && styles.slotButtonSelected
              ]}
              onPress={() => handleTimePress(slot)}
            >
              <Text style={[
                styles.slotText,
                selectedTime === slot && styles.slotTextSelected
              ]}>
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
  },
  slotsContainer: {
    flex: 1,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotButton: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  slotButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  slotText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  slotTextSelected: {
    color: '#fff',
  },
});

export default TimeSelector;
```

---

## 4️⃣ Firestore Structure - הגדרת ספר ב-Firebase Console

### JSON להעתקה ישירה:

```json
{
  "id": "barber_1",
  "name": "ספר דוגמה",
  "phone": "+972541234567",
  "image": "https://example.com/barber.jpg",
  "available": true,
  "pricing": 80,
  "rating": 5,
  "specialties": ["תספורות", "עיצוב זקן", "תספורת ילדים"],
  
  "workingHours": {
    "sunday": {
      "start": "09:00",
      "end": "19:00",
      "isWorking": true
    },
    "monday": {
      "start": "09:00",
      "end": "19:00",
      "isWorking": true
    },
    "tuesday": {
      "start": "09:00",
      "end": "19:00",
      "isWorking": true
    },
    "wednesday": {
      "start": "09:00",
      "end": "19:00",
      "isWorking": true
    },
    "thursday": {
      "start": "09:00",
      "end": "19:00",
      "isWorking": true
    },
    "friday": {
      "start": "09:00",
      "end": "14:00",
      "isWorking": true
    },
    "saturday": {
      "start": "10:00",
      "end": "16:00",
      "isWorking": false
    }
  },
  
  "blockedSlots": {
    "daily": ["13:00", "13:15", "13:30"],
    "weekly": {
      "friday": ["12:00", "12:15", "12:30"]
    }
  },
  
  "exceptions": {
    "2025-10-20": {
      "isWorking": false,
      "reason": "חופש"
    },
    "2025-10-25": {
      "start": "10:00",
      "end": "16:00",
      "reason": "יום מקוצר"
    }
  }
}
```

---

## ✅ סיכום - רשימת בדיקה

### לפני השקה:

- [ ] העתקת `scheduling.ts` עם הפונקציות
- [ ] העתקת `getAvailableSlots` ל-`firebase.ts`
- [ ] הוספת ה-Types & Interfaces
- [ ] הגדרת barbers ב-Firestore עם `workingHours`
- [ ] הגדרת `blockedSlots` לכל ספר
- [ ] בדיקה: slots נוצרים נכון
- [ ] בדיקה: הפסקות עובדות
- [ ] בדיקה: ימי חופש עובדים
- [ ] בדיקה: טיפולים שונים עובדים
- [ ] בדיקה: אין התנגשויות

---

**🎉 הכל מוכן! העתק, הדבק, והתאם!**


