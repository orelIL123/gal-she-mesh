# 📅 מדריך מלא למערכת Slots והזמינות

## תאריך: 15 אוקטובר 2025

---

## 🎯 1. עקרונות יסוד - איך זה עובד

### מושגי בסיס:

**Slot** = משבצת זמן של 15 דקות (ברירת מחדל)
```
09:00 → 09:15 → 09:30 → 09:45 → 10:00 ...
```

**טיפול** = מורכב ממספר slots רצופים:
- תספורת קצרה: 15 דקות = 1 slot
- תספורת רגילה: 30 דקות = 2 slots
- תספורת + זקן: 45 דקות = 3 slots
- תספורת מלאה: 60 דקות = 4 slots

---

## ⚙️ 2. הגדרות מערכת (Constants)

### קובץ: `app/constants/scheduling.ts`

```typescript
// גודל slot בסיסי (בדקות)
export const SLOT_SIZE_MINUTES = 15;

// משכי טיפולים מותרים (בדקות)
export const VALID_DURATIONS = [15, 30, 45, 60];

// פונקציה: האם משך הטיפול תקין?
export const isValidDuration = (duration: number): boolean => {
  return VALID_DURATIONS.includes(duration);
};

// פונקציה: האם הזמן נמצא על ה-grid?
export const isOnGrid = (time: string, gridSize: number = SLOT_SIZE_MINUTES): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes % gridSize === 0;
};

// פונקציה: האם הטיפול נכנס ביום (לא חוצה חצות)?
export const slotFitsInDay = (startTime: string, duration: number): boolean => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  return endMinutes <= 24 * 60; // 1440 דקות ביום
};

// פונקציה: חישוב זמן סיום
export const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// פונקציה: יצירת רשימת slots
export const generateTimeSlots = (
  startHour: number = 9,    // שעת פתיחה
  endHour: number = 19,      // שעת סגירה
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
```

---

## 🏗️ 3. מבנה נתונים - Firestore

### Collection: `barbers`

```javascript
{
  id: "barber_1",
  name: "רון תורגמן",
  phone: "+972542280222",
  image: "https://...",
  available: true,           // ✅ האם הספר זמין בכלל?
  pricing: 80,
  rating: 5,
  specialties: ["תספורות", "עיצוב זקן"],
  
  // ⏰ זמינות יומית (אופציונלי - אם לא מוגדר, משתמשים בברירת מחדל)
  workingHours: {
    sunday: { start: "09:00", end: "19:00", isWorking: true },
    monday: { start: "09:00", end: "19:00", isWorking: true },
    tuesday: { start: "09:00", end: "19:00", isWorking: true },
    wednesday: { start: "09:00", end: "19:00", isWorking: true },
    thursday: { start: "09:00", end: "19:00", isWorking: true },
    friday: { start: "09:00", end: "14:00", isWorking: true },
    saturday: { start: "10:00", end: "18:00", isWorking: false }
  },
  
  // 🚫 הפסקות קבועות (סלוטים חסומים)
  blockedSlots: {
    daily: ["13:00", "13:15", "13:30"],  // הפסקת צהריים יומית
    weekly: {
      friday: ["12:00", "12:15", "12:30", "12:45"]  // הפסקה מוקדמת בשישי
    }
  },
  
  // 📅 חריגות (ימים ספציפיים)
  exceptions: {
    "2025-10-20": { isWorking: false, reason: "חופש" },
    "2025-10-25": { start: "10:00", end: "16:00", reason: "יום מקוצר" }
  }
}
```

### Collection: `appointments`

```javascript
{
  id: "appt_123",
  barberId: "barber_1",
  userId: "user_456",
  date: "2025-10-20",        // פורמט: YYYY-MM-DD
  time: "10:00",             // זמן התחלה
  duration: 30,              // משך בדקות
  treatmentId: "treatment_1",
  status: "scheduled",       // scheduled / cancelled / completed
  createdAt: Timestamp
}
```

---

## 🔍 4. חישוב זמינות - האלגוריתם המלא

### קובץ: `services/firebase.ts`

```typescript
export const getAvailableSlots = async (
  barberId: string,
  date: string,           // "2025-10-20"
  duration: number        // 30
): Promise<string[]> => {
  try {
    console.log(`🔍 Calculating available slots for barber ${barberId} on ${date}`);
    
    // ✅ שלב 1: קבל את פרטי הספר
    const barber = await getBarberProfile(barberId);
    if (!barber || !barber.available) {
      console.log('❌ Barber not available');
      return [];
    }
    
    // ✅ שלב 2: בדוק אם יום העבודה
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingHours = barber.workingHours?.[dayOfWeek];
    
    if (!workingHours?.isWorking) {
      console.log(`❌ Barber doesn't work on ${dayOfWeek}`);
      return [];
    }
    
    // ✅ שלב 3: בדוק חריגות לתאריך ספציפי
    if (barber.exceptions?.[date]) {
      const exception = barber.exceptions[date];
      if (!exception.isWorking) {
        console.log(`❌ Barber has day off on ${date}`);
        return [];
      }
      // אם יש שעות מותאמות, השתמש בהן
      workingHours.start = exception.start || workingHours.start;
      workingHours.end = exception.end || workingHours.end;
    }
    
    // ✅ שלב 4: צור את כל ה-slots האפשריים
    const [startHour] = workingHours.start.split(':').map(Number);
    const [endHour] = workingHours.end.split(':').map(Number);
    const allSlots = generateTimeSlots(startHour, endHour, SLOT_SIZE_MINUTES);
    
    console.log(`📋 Generated ${allSlots.length} potential slots`);
    
    // ✅ שלב 5: הסר סלוטים חסומים (הפסקות)
    let availableSlots = allSlots.filter(slot => {
      // הפסקות יומיות
      if (barber.blockedSlots?.daily?.includes(slot)) {
        return false;
      }
      // הפסקות שבועיות
      if (barber.blockedSlots?.weekly?.[dayOfWeek]?.includes(slot)) {
        return false;
      }
      return true;
    });
    
    console.log(`📋 After removing blocked slots: ${availableSlots.length} slots`);
    
    // ✅ שלב 6: טען תורים קיימים לתאריך זה
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('barberId', '==', barberId),
      where('date', '==', date),
      where('status', '==', 'scheduled')
    );
    const appointmentsSnapshot = await getDocs(q);
    const appointments = appointmentsSnapshot.docs.map(doc => doc.data() as Appointment);
    
    console.log(`📅 Found ${appointments.length} existing appointments`);
    
    // ✅ שלב 7: חשב אילו סלוטים תפוסים
    const occupiedSlots = new Set<string>();
    appointments.forEach(apt => {
      const [hours, minutes] = apt.time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + apt.duration;
      
      // סמן את כל הסלוטים שתפוסים בטיפול הזה
      for (let min = startMinutes; min < endMinutes; min += SLOT_SIZE_MINUTES) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        const slotTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        occupiedSlots.add(slotTime);
      }
    });
    
    console.log(`🚫 Occupied slots: ${occupiedSlots.size}`);
    
    // ✅ שלב 8: סנן רק סלוטים שיש בהם מספיק מקום לטיפול
    const finalSlots = availableSlots.filter(slot => {
      // בדוק שהטיפול לא חורג מיום העבודה
      if (!slotFitsInDay(slot, duration)) {
        return false;
      }
      
      // בדוק שכל הסלוטים הנדרשים לטיפול פנויים
      const [hours, minutes] = slot.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      
      for (let min = startMinutes; min < startMinutes + duration; min += SLOT_SIZE_MINUTES) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        const checkSlot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        // אם הסלוט תפוס או לא קיים ברשימת הזמינים
        if (occupiedSlots.has(checkSlot) || !availableSlots.includes(checkSlot)) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`✅ Final available slots: ${finalSlots.length}`);
    return finalSlots;
    
  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
};
```

---

## 📊 5. דוגמה מעשית - איך זה עובד

### תרחיש:
- **ספר**: רון תורגמן
- **תאריך**: 20 אוקטובר 2025 (יום ראשון)
- **שעות עבודה**: 09:00 - 19:00
- **הפסקת צהריים**: 13:00 - 13:45
- **טיפול מבוקש**: 30 דקות

### תהליך החישוב:

#### 1️⃣ יצירת כל ה-slots
```
09:00, 09:15, 09:30, 09:45,
10:00, 10:15, 10:30, 10:45,
11:00, 11:15, 11:30, 11:45,
12:00, 12:15, 12:30, 12:45,
13:00, 13:15, 13:30, 13:45,  ← הפסקה
14:00, 14:15, 14:30, 14:45,
15:00, 15:15, 15:30, 15:45,
16:00, 16:15, 16:30, 16:45,
17:00, 17:15, 17:30, 17:45,
18:00, 18:15, 18:30, 18:45
= 40 slots
```

#### 2️⃣ הסרת הפסקות
```
מסירים: 13:00, 13:15, 13:30, 13:45
נשארים: 36 slots
```

#### 3️⃣ תורים קיימים
```
תור 1: 10:00-10:30 (30 דקות)
  → תפוס: 10:00, 10:15

תור 2: 15:00-16:00 (60 דקות)
  → תפוס: 15:00, 15:15, 15:30, 15:45
```

#### 4️⃣ סינון לטיפול של 30 דקות
```
09:00 ✅ (09:00-09:30 פנוי)
09:15 ✅ (09:15-09:45 פנוי)
09:30 ✅ (09:30-10:00 פנוי)
09:45 ❌ (09:45-10:15 חלקית תפוס ב-10:00)
10:00 ❌ (תפוס)
10:15 ❌ (תפוס)
10:30 ✅ (10:30-11:00 פנוי)
...
12:45 ❌ (12:45-13:15 חלקית בהפסקה)
13:00 ❌ (הפסקה)
...
14:00 ✅ (14:00-14:30 פנוי)
...
15:00 ❌ (תפוס)
...
```

**תוצאה סופית**: ~25 slots זמינים

---

## 🚀 6. קוד להעתקה - ספר עם הגדרות ייחודיות

### דוגמה: 5 ספרים עם שעות שונות

```typescript
// הגדרת ספרים
const barbers = [
  {
    id: "barber_1",
    name: "ספר א'",
    workingHours: {
      sunday: { start: "09:00", end: "18:00", isWorking: true },
      monday: { start: "09:00", end: "18:00", isWorking: true },
      tuesday: { start: "09:00", end: "18:00", isWorking: true },
      wednesday: { start: "09:00", end: "18:00", isWorking: true },
      thursday: { start: "09:00", end: "18:00", isWorking: true },
      friday: { start: "09:00", end: "14:00", isWorking: true },
      saturday: { start: "10:00", end: "16:00", isWorking: false }
    },
    blockedSlots: {
      daily: ["13:00", "13:15", "13:30"]  // הפסקת צהריים
    }
  },
  {
    id: "barber_2",
    name: "ספר ב'",
    workingHours: {
      sunday: { start: "10:00", end: "19:00", isWorking: true },
      monday: { start: "10:00", end: "19:00", isWorking: true },
      tuesday: { start: "10:00", end: "19:00", isWorking: true },
      wednesday: { start: "10:00", end: "19:00", isWorking: true },
      thursday: { start: "10:00", end: "19:00", isWorking: true },
      friday: { start: "10:00", end: "15:00", isWorking: true },
      saturday: { start: "10:00", end: "16:00", isWorking: false }
    },
    blockedSlots: {
      daily: ["14:00", "14:15"]  // הפסקה קצרה
    }
  },
  {
    id: "barber_3",
    name: "ספר ג'",
    workingHours: {
      sunday: { start: "08:00", end: "17:00", isWorking: true },
      monday: { start: "08:00", end: "17:00", isWorking: true },
      tuesday: { start: "08:00", end: "17:00", isWorking: true },
      wednesday: { start: "08:00", end: "17:00", isWorking: true },
      thursday: { start: "08:00", end: "17:00", isWorking: true },
      friday: { start: "08:00", end: "13:00", isWorking: true },
      saturday: { start: "09:00", end: "14:00", isWorking: true }
    },
    blockedSlots: {
      daily: ["12:00", "12:15", "12:30", "12:45"]  // הפסקה ארוכה
    }
  },
  {
    id: "barber_4",
    name: "ספר ד'",
    workingHours: {
      sunday: { start: "11:00", end: "20:00", isWorking: true },
      monday: { start: "11:00", end: "20:00", isWorking: true },
      tuesday: { start: "11:00", end: "20:00", isWorking: true },
      wednesday: { start: "11:00", end: "20:00", isWorking: true },
      thursday: { start: "11:00", end: "20:00", isWorking: true },
      friday: { start: "11:00", end: "16:00", isWorking: true },
      saturday: { start: "12:00", end: "18:00", isWorking: false }
    },
    blockedSlots: {
      daily: ["15:00", "15:15", "15:30"]  // הפסקת אחה"צ
    }
  },
  {
    id: "barber_5",
    name: "ספר ה'",
    workingHours: {
      sunday: { start: "09:30", end: "18:30", isWorking: true },
      monday: { start: "09:30", end: "18:30", isWorking: true },
      tuesday: { start: "09:30", end: "18:30", isWorking: true },
      wednesday: { start: "09:30", end: "18:30", isWorking: true },
      thursday: { start: "09:30", end: "18:30", isWorking: true },
      friday: { start: "09:30", end: "14:30", isWorking: true },
      saturday: { start: "10:30", end: "17:00", isWorking: false }
    },
    blockedSlots: {
      daily: ["13:30", "13:45", "14:00"]
    }
  }
];
```

---

## 🎨 7. UI - הצגת Slots זמינים

### קומפוננטה לבחירת זמן:

```typescript
const TimeSlotPicker: React.FC<{
  barberId: string;
  date: string;
  duration: number;
  onSelect: (time: string) => void;
}> = ({ barberId, date, duration, onSelect }) => {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSlots();
  }, [barberId, date, duration]);

  const loadSlots = async () => {
    setLoading(true);
    const slots = await getAvailableSlots(barberId, date, duration);
    setAvailableSlots(slots);
    setLoading(false);
  };

  if (loading) {
    return <Text>טוען זמינות...</Text>;
  }

  if (availableSlots.length === 0) {
    return (
      <View>
        <Text>אין זמינות לתאריך זה</Text>
        <Text>נסה תאריך או ספר אחר</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <Text>בחר שעה ({availableSlots.length} אפשרויות):</Text>
      {availableSlots.map(slot => (
        <TouchableOpacity
          key={slot}
          onPress={() => onSelect(slot)}
          style={styles.slotButton}
        >
          <Text>{slot}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
```

---

## 🔧 8. פונקציות עזר נוספות

### בדיקת זמינות לפני הזמנה:

```typescript
export const checkSlotAvailability = async (
  barberId: string,
  date: string,
  time: string,
  duration: number
): Promise<boolean> => {
  const availableSlots = await getAvailableSlots(barberId, date, duration);
  return availableSlots.includes(time);
};
```

### יצירת תור עם ולידציה:

```typescript
export const createAppointmentWithValidation = async (
  appointmentData: {
    barberId: string;
    userId: string;
    date: string;
    time: string;
    duration: number;
    treatmentId: string;
  }
) => {
  // ✅ בדוק זמינות לפני יצירה
  const isAvailable = await checkSlotAvailability(
    appointmentData.barberId,
    appointmentData.date,
    appointmentData.time,
    appointmentData.duration
  );

  if (!isAvailable) {
    throw new Error('השעה שנבחרה אינה זמינה יותר');
  }

  // ✅ צור את התור
  return await createAppointment(appointmentData);
};
```

---

## 📝 9. סיכום - Checklist להתקנה ללקוח חדש

### צעדים:

- [ ] **1. העתק את קובץ** `app/constants/scheduling.ts`
- [ ] **2. התאם את** `SLOT_SIZE_MINUTES` (15/30/60 דקות)
- [ ] **3. הוסף ל-Firestore**:
  - [ ] `barbers` collection עם `workingHours`
  - [ ] `barbers` collection עם `blockedSlots`
  - [ ] `appointments` collection
- [ ] **4. העתק את הפונקציה** `getAvailableSlots`
- [ ] **5. העתק את הפונקציה** `checkSlotAvailability`
- [ ] **6. התאם את UI** לפי העיצוב של הלקוח
- [ ] **7. בדיקות**:
  - [ ] הפסקות עובדות
  - [ ] ימי חופש עובדים
  - [ ] שעות שונות לכל ספר
  - [ ] טיפולים בעלי משך שונה

---

## ✅ 10. יתרונות המערכת

✅ **גמישות מלאה** - כל ספר עם שעות משלו
✅ **הפסקות מותאמות** - יומי/שבועי/חד-פעמי
✅ **ביצועים מעולים** - חישוב מהיר עם query optimization
✅ **מניעת התנגשויות** - בדיקה כפולה לפני הזמנה
✅ **קל להרחבה** - ניתן להוסיף חוקים נוספים
✅ **תמיכה ב-Real-time** - Firestore updates אוטומטי

---

## 🚀 הכל מוכן להעתקה!

**המערכת שלך תומכת ב-100% מהמקרים:**
- ✅ מספר ספרים בו-זמנית
- ✅ שעות עבודה שונות לכל ספר
- ✅ הפסקות קבועות ומשתנות
- ✅ ימי חופש וחריגות
- ✅ טיפולים בעלי משך שונה
- ✅ מניעת התנגשויות

**קוד נקי, מתועד, ומוכן לשימוש!** 🎉


