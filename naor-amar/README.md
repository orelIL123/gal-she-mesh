# Naor Amar - Barbershop Booking App

אפליקציית תזמון תורים למספרת נאור עמר - מבוססת Expo ו-Firebase.

## 🚀 מבנה הפרויקט

```
naor-amar/
├── config/              # Firebase configuration
│   └── firebase.ts      # Firebase initialization & types
├── constants/           # App constants
│   ├── colors.ts        # Color scheme
│   ├── contactInfo.ts   # Business contact info
│   └── scheduling.ts    # Scheduling utilities
├── data/               # Seed data
│   ├── employeeSeedData.json
│   └── README_EMPLOYEES.md
├── scripts/            # Setup & maintenance scripts
│   ├── initializeFirestore.js
│   ├── seedData.js
│   └── testConnection.js
├── firestore.rules     # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── storage.rules       # Storage security rules
├── firebase.json       # Firebase configuration
├── google-services.json    # Android Firebase config
└── GoogleService-Info.plist # iOS Firebase config
```

## 📦 התקנה

1. **התקן תלויות:**
```bash
npm install
```

2. **התקן Firebase Admin (לסקריפטים):**
```bash
npm install --save-dev firebase-admin
```

3. **הורד Service Account Key:**
   - לך ל-Firebase Console → Project Settings → Service Accounts
   - לחץ "Generate New Private Key"
   - שמור את הקובץ כ-`scripts/serviceAccountKey.json`

## 🔥 הגדרת Firebase Backend

### שלב 1: אתחול Firestore Collections

```bash
node scripts/initializeFirestore.js
```

זה יוצר:
- ✅ `businessSettings` - הגדרות העסק
- ✅ `treatments` - טיפולים זמינים (תספורת, זקן, וכו')

### שלב 2: Seeding נתוני עובדים

```bash
node scripts/seedData.js
```

זה יוצר:
- ✅ `barbers` - פרטי הספרים
- ✅ `users` - משתמשי מערכת (עובדים)

### שלב 3: Deploy Firebase Rules & Indexes

```bash
# התקן Firebase CLI אם עדיין לא התקנת
npm install -g firebase-tools

# התחבר ל-Firebase
firebase login

# אתחול פרויקט Firebase
firebase init

# Deploy Rules ו-Indexes
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
```

### שלב 4: בדיקת החיבור

```bash
node scripts/testConnection.js
```

## 🏃 הרצת האפליקציה

### Development Mode

```bash
npm start
```

### הרצה על פלטפורמות ספציפיות

```bash
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## 🔐 Firebase Collections

### Collections הקיימות:

1. **businessSettings** - הגדרות העסק
   - שעות פעילות
   - מדיניות ביטולים
   - פרטי קשר

2. **barbers** - ספרים
   - שם, טלפון, התמחות
   - זמינות, דירוג
   - ביוגרפיה

3. **treatments** - טיפולים
   - שם, מחיר, משך זמן
   - קטגוריה, פופולריות

4. **appointments** - תורים
   - פרטי לקוח וספר
   - תאריך, שעה, סטטוס
   - טיפול שנבחר

5. **users** - משתמשים
   - לקוחות, ספרים, אדמינים
   - הרשאות והגדרות

6. **waitlist** - רשימת המתנה
   - תורים שאין להם זמינות
   - התראות ללקוחות

7. **reviews** - ביקורות
   - דירוגים של ספרים
   - תגובות לקוחות

8. **gallery** - גלריה
   - תמונות עבודות
   - תמונות הספרים

9. **notifications** - התראות
   - התראות ללקוחות
   - תזכורות לתורים

10. **statistics** - סטטיסטיקות
    - נתוני שימוש
    - דוחות

## 🛡️ Security Rules

הקבצים `firestore.rules` ו-`storage.rules` מגדירים:
- ✅ לקוחות רואים רק את התורים שלהם
- ✅ ספרים רואים תורים רלוונטיים
- ✅ אדמינים מנהלים את הכל
- ✅ הגנה על נתונים רגישים

## 📱 תכונות עיקריות

- 📅 תזמון תורים חכם
- 🕐 מערכת 25 דקות slots
- 👥 ניהול ספרים ולקוחות
- 💰 ניהול טיפולים ומחירים
- 🎨 גלריית עבודות
- ⏰ רשימת המתנה
- 📊 דוחות וסטטיסטיקות
- 🔔 התראות ותזכורות
- ⭐ מערכת דירוגים

## 🧪 בדיקות

### בדיקת חיבור ל-Firebase:
```bash
node scripts/testConnection.js
```

### בדיקת נתונים:
- עבור ל-Firebase Console
- בדוק Collections ב-Firestore
- וודא שהנתונים נוצרו

## 📝 הערות חשובות

1. **Slot Duration:** המערכת עובדת עם slots של 25 דקות
2. **Working Hours:** ניתן לשנות ב-`businessSettings/main`
3. **Phone Format:** יש להשתמש בפורמט E.164 (+972...)
4. **Time Zone:** המערכת עובדת עם זמן מקומי (לא UTC)

## 🔧 פתרון בעיות

### "Permission denied" errors:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### "Index required" errors:
```bash
firebase deploy --only firestore:indexes
```

או לחץ על הלינק בשגיאה - Firebase יציע ליצור את ה-Index אוטומטית.

### תמונות לא נטענות:
- בדוק ש-Storage Rules נשמרו
- וודא הרשאות קריאה: `allow read: if true;`

## 📞 יצירת קשר

- **Business:** Naor Amar - מספרה מקצועית
- **Phone:** 053-270-6369
- **Email:** info@naoramar.com

## 📄 License

זכויות יוצרים © 2025 Naor Amar. כל הזכויות שמורות.

