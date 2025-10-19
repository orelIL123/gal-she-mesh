# 📋 רשימה מלאה של כל הפיצ'רים והפונקציות באפליקציה

## 🎯 מטרה
מסמך זה מכיל **כל** הפיצ'רים, פונקציות, מסכים, ותכונות שיש באפליקציה.  
שימושי לשכפול הפרויקט ללקוחות חדשים או ליצירת אפליקציות דומות.

---

## 📱 מסכי לקוח (Customer Screens)

### 1. **HomeScreen** - מסך בית
**קובץ:** `app/screens/HomeScreen.tsx`

**פיצ'רים:**
- ✅ Splash screen מונפש (3 שניות)
- ✅ אנימציות (fade, slide)
- ✅ תמונות דינמיות מ-Firebase Storage
- ✅ הודעות ברכה דינמיות (ניתנות לעריכה)
- ✅ כפתור "הזמן תור" מרכזי
- ✅ קרוסלת תמונות 3D (גלריה)
- ✅ קישורים לרשתות חברתיות
- ✅ תפריט צד (SideMenu)
- ✅ פאנל התראות
- ✅ מודל תנאים והגבלות
- ✅ מחיקה אוטומטית של רשומות waitlist ישנות (onMount)

**תכונות מיוחדות:**
- תמיכה ב-RTL (עברית)
- תמיכה בi18n (תרגום)
- טעינה lazy של תמונות

---

### 2. **BookingScreen** - הזמנת תור
**קובץ:** `app/screens/BookingScreen.tsx`

**פיצ'רים:**
- ✅ מערכת הזמנה בארבעה שלבים:
  1. בחירת ספר (עם תמונות ופרופילים)
  2. בחירת טיפול (עם מחיר ומשך)
  3. בחירת תאריך (14 ימים קדימה)
  4. בחירת שעה (slots זמינים בלבד)

**תכונות מתקדמות:**
- ✅ **Slots מבוססי זמינות דינמית:**
  - טעינה מ-`dailyAvailability` (עדיפות גבוהה)
  - fallback ל-`availability` (זמינות שבועית)
  - בדיקה בזמן אמת מול תורים קיימים
  - תמיכה בטיפולים ארוכים (multi-slot)
  
- ✅ **מניעת התנגשויות:**
  - בדיקת overlap עם תורים קיימים
  - double-check לפני יצירת תור
  - רענון אוטומטי של slots זמינים

- ✅ **הודעה על תורים תפוסים:**
  - "נתפסו כל התורים!" כשאין slots
  - הצעה לבחור תאריך אחר

- ✅ **רשימת המתנה (Waitlist):**
  - מלבן אדום: "לא מצאת תור לזמן שלך?"
  - מודל לבחירת טווח שעות (start-end)
  - שמירה ב-Firestore
  - הודעת אישור

- ✅ **Real-time listeners:**
  - עדכון אוטומטי של זמינות
  - עדכון אוטומטי של טיפולים
  
- ✅ **התראות פוש:**
  - תזכורת שעה לפני
  - תזכורת 15 דקות לפני

**פונקציות עיקריות:**
```javascript
- generateAvailableSlots() // יצירת slots זמינים
- isSlotAvailable() // בדיקת זמינות slot
- handleConfirmBooking() // אישור ויצירת תור
- scheduleAppointmentReminders() // תזמון התראות
```

---

### 3. **ProfileScreen** - פרופיל לקוח
**קובץ:** `app/screens/ProfileScreen.tsx`

**פיצ'רים:**
- ✅ הצגת פרטי משתמש (שם, אימייל, טלפון)
- ✅ רשימת תורים קרובים
- ✅ היסטוריית תורים
- ✅ ביטול תורים
- ✅ עריכת פרופיל
- ✅ התנתקות

**תכונות:**
- סינון תורים לפי סטטוס
- הצגת פרטי תור מלאים
- ניווט מהיר להזמנת תור חדש

---

### 4. **TeamScreen** - צוות הספרים
**קובץ:** `app/screens/TeamScreen.tsx`

**פיצ'רים:**
- ✅ גלריית ספרים
- ✅ פרופיל מפורט לכל ספר
- ✅ הזמנת תור ישירות לספר
- ✅ קישורים לוואטסאפ

---

### 5. **NotificationsScreen** - התראות
**קובץ:** `app/screens/NotificationsScreen.tsx`

**פיצ'רים:**
- ✅ רשימת התראות
- ✅ סימון כנקרא
- ✅ מחיקה
- ✅ סוגי התראות: appointment, reminder, general

---

## 👨‍💼 מסכי אדמין (Admin Screens)

### 1. **AdminHomeScreen** - דף בית אדמין
**קובץ:** `app/screens/AdminHomeScreen.tsx`

**פיצ'רים:**
- ✅ תפריט ניווט לכל מסכי האדמין
- ✅ כרטיסיות צבעוניות לכל פיצ'ר
- ✅ כפתורים לניהול מערכת
- ✅ הצגת UID למטרות דיבוג
- ✅ שדה עריכת טקסט "אודות"

**מסכים זמינים:**
1. ניהול תורים
2. ניהול טיפולים ומחירים
3. ניהול הצוות
4. ניהול הגלריה
5. ניהול זמינות
6. סטטיסטיקות
7. התראות
8. הגדרות מנהל
9. רשימת לקוחות
10. **רשימת המתנה** ⭐ (חדש!)

---

### 2. **AdminAppointmentsScreen** - ניהול תורים
**קובץ:** `app/screens/AdminAppointmentsScreen.tsx`

**פיצ'רים:**
- ✅ **הצגת כל התורים:**
  - לחודש נוכחי
  - סינון לפי סטטוס (confirmed, completed, cancelled)
  - סינון לפי יום
  - קיבוץ לפי תאריך

- ✅ **הוספת תור ידני:** ⭐ (משופר!)
  - בחירת תאריך, ספר, טיפול
  - **תצוגת slots זמינים בלבד** (סנכרון מלא עם הלקוח!)
  - **סימון slots תפוסים** (אדום + X)
  - שני מצבים:
    1. לקוח קיים מהמערכת
    2. הזנה ידנית (שם + טלפון)
  - **מניעת התנגשויות** - אי אפשר לבחור slot תפוס

- ✅ **עריכת תורים:**
  - שינוי סטטוס
  - שינוי פרטים
  - הוספת הערות

- ✅ **מחיקת תורים:**
  - אישור לפני מחיקה
  - **שליחת התראות אוטומטית לרשימת המתנה** ⭐

- ✅ **קישורים:**
  - חיוג ללקוח
  - וואטסאפ ללקוח

**פונקציות חדשות:**
```javascript
- loadDayAppointments() // טעינת תורים ליום
- loadBarberAvailableSlots() // טעינת slots זמינים
- isSlotOccupied() // בדיקת slot תפוס
- generateTimeSlotsForAdmin() // יצירת slots מזמינות אמיתית
```

---

### 3. **AdminTreatmentsScreen** - ניהול טיפולים
**קובץ:** `app/screens/AdminTreatmentsScreen.tsx`

**פיצ'רים:**
- ✅ הוספת טיפולים
- ✅ עריכת טיפולים (שם, מחיר, משך, תיאור)
- ✅ מחיקת טיפולים
- ✅ העלאת תמונה לטיפול
- ✅ **תמיכה במשכים מותאמים אישית** (25, 50, 75, 100 דקות)

**validation:**
- משך חייב להיות כפולה של 25 דקות

---

### 4. **AdminTeamScreen** - ניהול צוות
**קובץ:** `app/screens/AdminTeamScreen.tsx`

**פיצ'רים:**
- ✅ הוספת ספרים
- ✅ עריכת פרטי ספר
- ✅ העלאת תמונת פרופיל
- ✅ הגדרת ניסיון/תיאור
- ✅ מחיקת ספרים

---

### 5. **AdminAvailabilityScreen** - ניהול זמינות ⭐
**קובץ:** `app/screens/AdminAvailabilityScreen.tsx`

**פיצ'רים מתקדמים:**
- ✅ **מערכת דו-רמתית:**
  1. **זמינות שבועית (Weekly):** ברירת מחדל לכל שבוע
  2. **זמינות יומית (Daily):** עדיפות גבוהה, override לימים ספציפיים

- ✅ **לוח 14 ימים:**
  - צבע ירוק = יום זמין
  - צבע אדום = יום לא זמין
  - הצגת מספר slots ליום

- ✅ **עריכת slots:**
  - הוספה/הסרה של slots ספציפיים
  - slots במרווחים של 25 דקות
  - מניעת שעות עבר (היום)

- ✅ **העתקת זמינות:**
  - העתק מיום ליום
  - העתק משבוע לשבוע (7 ימים קדימה)

- ✅ **סנכרון אוטומטי:**
  - עדכון real-time
  - תצוגה מיידית ללקוחות

**מבנה נתונים:**
```javascript
// Weekly availability (collection: availability)
{
  barberId, dayOfWeek, availableSlots[], isAvailable
}

// Daily availability (collection: dailyAvailability)
{
  barberId, date (YYYY-MM-DD), availableSlots[], isAvailable
}
```

---

### 6. **AdminWaitlistScreen** - רשימת המתנה ⭐ (חדש!)
**קובץ:** `app/screens/AdminWaitlistScreen.tsx`

**פיצ'רים:**
- ✅ **לוח 7 ימים:**
  - מיום היום ואילך
  - מתחדש אוטומטית (תמיד 7 ימים קדימה)
  
- ✅ **הצגת רשומות:**
  - שם לקוח
  - טלפון
  - טווח שעות מבוקש (start-end)
  - תאריך הרשמה

- ✅ **מחיקת רשומות:**
  - מחיקה ידנית של רשומות בודדות

- ✅ **סטטיסטיקות:**
  - סך הכל אנשים ברשימה
  - מספר ימים עם רשומות

- ✅ **בחירת ספר:**
  - תמיכה במספר ספרים
  - סינון לפי ספר

- ✅ **רענון ידני:**
  - כפתור רענון

- ✅ **מחיקה אוטומטית:**
  - רשומות ישנות נמחקות אוטומטית

**פונקציות:**
```javascript
- getWaitlistEntriesForWeek() // 7 ימים
- getWaitlistEntriesForDate() // יום ספציפי
- deleteWaitlistEntry()
- cleanupOldWaitlistEntries()
```

---

### 7. **AdminGalleryScreen** - ניהול גלריה
**קובץ:** `app/screens/AdminGalleryScreen.tsx`

**פיצ'רים:**
- ✅ העלאת תמונות לגלריה
- ✅ מחיקת תמונות
- ✅ שינוי סדר תמונות
- ✅ החלפת תמונת רקע
- ✅ החלפת תמונת "אודות"
- ✅ ניהול תמונות Splash

---

### 8. **AdminCustomersScreen** - רשימת לקוחות
**קובץ:** `app/screens/AdminCustomersScreen.tsx`

**פיצ'רים:**
- ✅ רשימת כל הלקוחות
- ✅ חיפוש לקוחות
- ✅ סינון (כל המשתמשים / לקוחות בלבד)
- ✅ שליחת הודעות פוש ללקוח
- ✅ חיוג/וואטסאפ ללקוח
- ✅ מחיקת לקוחות

---

### 9. **AdminStatisticsScreen** - סטטיסטיקות
**קובץ:** `app/screens/AdminStatisticsScreen.tsx`

**פיצ'רים:**
- ✅ מספר תורים (כולל, מאושרים, הושלמו)
- ✅ מספר לקוחות
- ✅ הכנסות
- ✅ תורים היום
- ✅ גרפים וויזואליזציות

---

### 10. **AdminSettingsScreen** - הגדרות
**קובץ:** `app/screens/AdminSettingsScreen.tsx`

**פיצ'רים:**
- ✅ עריכת הודעות ברכה
- ✅ עריכת טקסט "אודות"
- ✅ שליחת הודעות broadcast
- ✅ ניהול הגדרות התראות

---

## 🔥 Firebase Functions & Backend

### Collections (Firestore)

1. **users** - משתמשים
```javascript
{
  uid, email, displayName, phone, isAdmin, 
  pushToken, createdAt
}
```

2. **barbers** - ספרים
```javascript
{
  id, name, experience, image, phone
}
```

3. **treatments** - טיפולים
```javascript
{
  id, name, price, duration, description, image
}
```

4. **appointments** - תורים
```javascript
{
  id, userId, barberId, treatmentId, 
  date (Timestamp), status, notes, duration, 
  createdAt,
  // for manual clients:
  clientName?, clientPhone?, isManualClient?
}
```

5. **availability** - זמינות שבועית
```javascript
{
  id, barberId, dayOfWeek (0-6), 
  availableSlots[], isAvailable, createdAt
}
```

6. **dailyAvailability** - זמינות יומית ⭐
```javascript
{
  id, barberId, date (YYYY-MM-DD), 
  availableSlots[], isAvailable, createdAt
}
```

7. **waitlist** - רשימת המתנה ⭐ (חדש!)
```javascript
{
  id, userId, barberId, date (YYYY-MM-DD),
  preferredTimeStart, preferredTimeEnd,
  userDisplayName, userPhone, createdAt
}
```

8. **notifications** - התראות
```javascript
{
  id, userId, type, title, message, 
  isRead, createdAt
}
```

9. **gallery** - גלריה
```javascript
{
  id, imageUrl, type, order, isActive, createdAt
}
```

10. **settings** - הגדרות
```javascript
{
  id, key, value, updatedAt
}
```

---

## 🔔 מערכת התראות (Push Notifications)

### פיצ'רים:
- ✅ **Expo Notifications**
- ✅ שמירת Push Tokens בFirestore
- ✅ התראות אוטומטיות:
  - תור חדש נוצר
  - תור בוטל
  - תזכורת שעה לפני
  - תזכורת 15 דקות לפני
  - **תור התפנה (waitlist)** ⭐

### פונקציות:
```javascript
- sendNotificationToUser()
- sendNotificationToAdmin()
- scheduleAppointmentReminders()
- cancelAppointmentReminders()
- notifyWaitlistOnCancellation() ⭐
```

---

## ⚙️ פונקציות עזר (Utilities)

### 1. **scheduling.ts** - ניהול slots
**קובץ:** `app/constants/scheduling.ts`

```javascript
- SLOT_SIZE_MINUTES = 25
- generateTimeSlots(start, end) // יצירת slots
- toMin(timeString) // המרה לדקות
- toYMD(date) // המרה ל-YYYY-MM-DD
- getSlotsNeeded(duration) // כמה slots צריך
- isOnGrid(time) // בדיקה ש-time על גריד 25 דקות
- isValidDuration(duration) // בדיקה שמשך כפולה של 25
- slotFitsInDay(time, duration, dayEnd) // בדיקת overflow
```

### 2. **firebase.ts** - כל הפונקציות
**קובץ:** `services/firebase.ts`

**Authentication:**
```javascript
- loginUser()
- registerUser()
- logoutUser()
- getCurrentUser()
- onAuthStateChange()
```

**Users:**
```javascript
- getUserProfile()
- updateUserProfile()
- getAllUsers()
- deleteCustomer()
```

**Barbers:**
```javascript
- getBarbers()
- createBarber()
- updateBarber()
- deleteBarber()
```

**Treatments:**
```javascript
- getTreatments()
- createTreatment()
- updateTreatment()
- deleteTreatment()
```

**Appointments:**
```javascript
- createAppointment()
- getAppointments()
- getCurrentMonthAppointments()
- getBarberAppointmentsForDay()
- updateAppointment()
- deleteAppointment()
- cancelAppointment()
```

**Availability:**
```javascript
- getBarberAvailability()
- getBarberAvailableSlots() ⭐ (קריטי!)
- setBarberAvailability()
- setBarberDailyAvailability() ⭐
- getBarberDailyAvailability() ⭐
- deleteBarberDailyAvailability() ⭐
```

**Waitlist:** ⭐ (חדש!)
```javascript
- createWaitlistEntry()
- getWaitlistEntriesForDate()
- getWaitlistEntriesForWeek()
- getUserWaitlistEntries()
- deleteWaitlistEntry()
- cleanupOldWaitlistEntries()
- notifyWaitlistOnCancellation()
```

**Notifications:**
```javascript
- sendNotificationToUser()
- sendNotificationToAdmin()
- getUserNotifications()
- markNotificationAsRead()
- clearAllUserNotifications()
```

**Gallery:**
```javascript
- getGalleryImages()
- uploadGalleryImage()
- deleteGalleryImage()
```

**Settings:**
```javascript
- getSetting()
- setSetting()
```

---

## 🎨 Components (רכיבים)

### UI Components:
- **TopNav** - ניווט עליון
- **BottomNav** - ניווט תחתון
- **SideMenu** - תפריט צד
- **NotificationPanel** - פאנל התראות
- **ConfirmationModal** - מודל אישור
- **ToastMessage** - הודעות toast
- **TermsModal** - תנאים והגבלות

### Admin Components:
- **AdminImageManager** - ניהול תמונות
- **AppAuthGate** - שער אימות

---

## 🌐 i18n (תרגום)

**קבצים:**
- `app/i18n/locales/he.json`
- `app/i18n/locales/en.json`

**תמיכה בשפות:**
- עברית (ברירת מחדל)
- אנגלית

---

## 🔐 Security & Permissions

### Firestore Rules נדרשים:

```javascript
// Waitlist Collection
match /waitlist/{entryId} {
  allow create: if request.auth != null 
                && request.resource.data.userId == request.auth.uid;
  
  allow read: if request.auth != null 
              && (resource.data.userId == request.auth.uid 
                  || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
  
  allow delete: if request.auth != null 
                && (resource.data.userId == request.auth.uid 
                    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
}
```

### Firestore Indexes נדרשים:

1. **waitlist** collection:
   - `(barberId ASC, date ASC, createdAt ASC)`
   - `(userId ASC, date ASC)`

2. **appointments** collection:
   - `(barberId ASC, date ASC)`
   - `(userId ASC, date DESC)`

3. **dailyAvailability** collection:
   - `(barberId ASC, date ASC)`

---

## 📦 Dependencies (חבילות)

### Main:
```json
{
  "expo": "~52.0.11",
  "react-native": "0.76.5",
  "firebase": "^10.x",
  "expo-notifications": "~0.29.9",
  "expo-linear-gradient": "~14.0.1",
  "react-i18next": "^15.x",
  "expo-image-picker": "~16.0.4"
}
```

---

## 🚀 תכונות ייחודיות

### 1. **Slot Management System** ⭐⭐⭐
- מערכת slots מתקדמת במרווחים של 25 דקות
- תמיכה בטיפולים multi-slot (50, 75, 100 דקות)
- בדיקת overlap מדויקת
- סנכרון מלא בין אדמין ללקוח

### 2. **Dual-Level Availability** ⭐⭐
- זמינות שבועית (ברירת מחדל)
- זמינות יומית (override)
- עדיפות לזמינות יומית
- מערכת fallback חכמה

### 3. **Waitlist System** ⭐⭐
- רשימת המתנה ליום ספציפי
- בחירת טווח שעות
- התראות אוטומטיות בעת ביטול
- מחיקה אוטומטית של רשומות ישנות

### 4. **Real-time Updates**
- Listeners ל-availability
- Listeners ל-appointments
- Listeners ל-treatments
- עדכון מיידי בכל המסכים

### 5. **Smart Conflict Prevention**
- בדיקה כפולה לפני הזמנה
- מניעת התנגשויות
- validation מקיף
- הודעות שגיאה ברורות

---

## 📝 הערות חשובות לשכפול

### 1. **Firebase Configuration**
יש להחליף:
- `config/firebase.ts` - API Keys
- Firebase project ID
- Storage bucket name

### 2. **Push Notifications**
יש להגדיר:
- Expo project ID
- Push notification credentials
- iOS/Android certificates

### 3. **Images & Assets**
יש להחליף:
- `assets/images/` - כל התמונות
- Logo
- Icon
- Splash screen

### 4. **Branding**
יש לשנות:
- שמות בקבצי i18n
- צבעים ב-`constants/colors.ts`
- מידע ב-`app.json`

### 5. **Content**
יש לעדכן ב-Firebase:
- Settings collection (homeMessages, aboutUsText)
- Gallery images
- Barbers
- Treatments

---

## ✅ Checklist לשכפול פרויקט

- [ ] העתק את כל התיקייה
- [ ] החלף Firebase config
- [ ] צור Firebase project חדש
- [ ] הוסף Firestore collections
- [ ] הוסף Firestore indexes
- [ ] הגדר Security Rules
- [ ] הגדר Push Notifications
- [ ] החלף assets/images
- [ ] עדכן app.json
- [ ] עדכן colors.ts
- [ ] עדכן i18n files
- [ ] הרץ `npm install`
- [ ] בדוק כל מסך
- [ ] טען נתונים ראשוניים (ספרים, טיפולים)
- [ ] צור admin user ראשון
- [ ] בדוק הזמנת תור
- [ ] בדוק waitlist
- [ ] בדוק התראות

---

## 🎉 סיכום

האפליקציה כוללת:
- **23 מסכים** (לקוח + אדמין)
- **10 Collections** ב-Firestore
- **70+ פונקציות** ב-firebase.ts
- **7 תכונות ייחודיות**
- **תמיכה מלאה בעברית**
- **מערכת slots מתקדמת**
- **רשימת המתנה**
- **התראות אוטומטיות**

**הכל מוכן לשכפול! 🚀**

---

תאריך עדכון אחרון: 19 אוקטובר 2025
גרסה: 2.0

