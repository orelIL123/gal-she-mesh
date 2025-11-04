# 🚀 מדריך הגדרה מלא - Naor Amar Barbershop App

מדריך צעד אחר צעד להגדרת הפרויקט מאפס ועד ריצה מלאה.

---

## ✅ צ'קליסט מהיר - מה צריך לעשות?

- [ ] 1. התקן תלויות (`npm install`)
- [ ] 2. הורד Service Account Key מ-Firebase
- [ ] 3. אתחל Firestore Collections (`npm run init-firebase`)
- [ ] 4. Seed נתוני עובדים (`npm run seed-data`)
- [ ] 5. התקן Firebase CLI
- [ ] 6. Deploy Rules & Indexes
- [ ] 7. בדוק חיבור (`npm run test-connection`)
- [ ] 8. הרץ את האפליקציה (`npm start`)

---

## 📋 שלב 1: התקנת תלויות

```bash
cd naor-amar
npm install
```

זה יתקין:
- ✅ Expo SDK
- ✅ Firebase (client)
- ✅ React Native AsyncStorage
- ✅ Firebase Admin (dev)

---

## 🔑 שלב 2: הורדת Service Account Key

1. פתח את [Firebase Console](https://console.firebase.google.com)
2. בחר את הפרויקט: **naor-amar**
3. לך ל: **Project Settings** (⚙️) → **Service Accounts**
4. לחץ על: **Generate New Private Key**
5. שמור את הקובץ כ: `scripts/serviceAccountKey.json`

⚠️ **חשוב:** קובץ זה מכיל מידע רגיש! הוא כבר ב-`.gitignore` - אל תעלה אותו ל-Git!

---

## 🔥 שלב 3: אתחול Firestore Collections

הפעל את הסקריפט ליצירת מבנה הבסיס:

```bash
npm run init-firebase
```

### מה הסקריפט יוצר?

#### 1. `businessSettings/main` - הגדרות העסק
```json
{
  "businessName": "Naor Amar",
  "ownerName": "Naor Amar",
  "ownerPhone": "+9720532706369",
  "ownerEmail": "info@naoramar.com",
  "address": "כתובת העסק של נאור עמר",
  "workingHours": {
    "sunday": { "open": "09:00", "close": "20:00", "closed": false },
    "monday": { "open": "09:00", "close": "20:00", "closed": false },
    "tuesday": { "open": "09:00", "close": "20:00", "closed": false },
    "wednesday": { "open": "09:00", "close": "20:00", "closed": false },
    "thursday": { "open": "09:00", "close": "20:00", "closed": false },
    "friday": { "open": "08:00", "close": "14:00", "closed": false },
    "saturday": { "open": "00:00", "close": "00:00", "closed": true }
  },
  "slotDuration": 25,
  "advanceBookingDays": 30,
  "cancellationPolicy": "ניתן לבטל עד 24 שעות לפני התור"
}
```

#### 2. `treatments` - טיפולים בסיסיים
- **תספורת גברים** - ₪80, 25 דקות
- **תספורת + זקן** - ₪120, 50 דקות
- **זקן בלבד** - ₪50, 25 דקות

---

## 🌱 שלב 4: Seed נתוני עובדים

הפעל את הסקריפט להוספת נתוני הספר הראשי:

```bash
npm run seed-data
```

### מה הסקריפט יוצר?

#### 1. `barbers` Collection
```json
{
  "barberId": "barber_naor_amar_1",
  "name": "Naor Amar",
  "phone": "+9720532706369",
  "specialization": "תספורת גברים",
  "experience": 10,
  "isMainBarber": true,
  "available": true,
  "rating": 5.0,
  "totalReviews": 0
}
```

#### 2. `users` Collection
```json
{
  "uid": "user_naor_amar_barber_1",
  "name": "Naor Amar",
  "phone": "+9720532706369",
  "type": "barber",
  "isBarber": true,
  "isAdmin": true,
  "barberId": "barber_naor_amar_1"
}
```

---

## 🛠️ שלב 5: התקנת Firebase CLI

אם עדיין לא התקנת את Firebase CLI:

```bash
npm install -g firebase-tools
```

התחבר ל-Firebase:

```bash
firebase login
```

אתחל את הפרויקט (רק פעם ראשונה):

```bash
firebase init
```

בחר:
- ✅ Firestore (Rules & Indexes)
- ✅ Storage (Rules)
- 📁 בחר את הפרויקט: **naor-amar**

---

## 🔐 שלב 6: Deploy Firebase Rules & Indexes

### 6.1 Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

הקובץ `firestore.rules` מגדיר:
- ✅ לקוחות רואים רק תורים משלהם
- ✅ ספרים רואים תורים רלוונטיים
- ✅ אדמינים מנהלים הכל
- ✅ קריאה ציבורית לטיפולים וספרים

### 6.2 Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

הקובץ `storage.rules` מגדיר:
- ✅ העלאת תמונות עד 5MB
- ✅ רק תמונות מאומתות
- ✅ ספרים ואדמינים מעלים לגלריה
- ✅ קריאה ציבורית לכל התמונות

### 6.3 Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

הקובץ `firestore.indexes.json` מגדיר:
- ✅ Index לתורים לפי ספר ותאריך
- ✅ Index לתורים לפי לקוח
- ✅ Index לתורים לפי סטטוס
- ✅ Index לרשימת המתנה
- ✅ Index לביקורות

---

## ✅ שלב 7: בדיקת החיבור

הפעל את סקריפט הבדיקה:

```bash
npm run test-connection
```

### פלט צפוי:

```
🔥 Testing Firebase connection for Naor Amar...

Test 1: Reading business settings...
✅ Business settings found: Naor Amar
   Owner: Naor Amar
   Phone: +9720532706369

Test 2: Counting barbers...
✅ Found 1 barber(s)
   - Naor Amar (תספורת גברים)

Test 3: Counting treatments...
✅ Found 3 treatment(s)
   - תספורת גברים (₪80, 25 min)
   - תספורת + זקן (₪120, 50 min)
   - זקן בלבד (₪50, 25 min)

Test 4: Counting appointments...
✅ Found 0 appointment(s)

Test 5: Counting users...
✅ Found 1 user(s)

🎉 Firebase connection test completed successfully!
✅ All tests passed - your Firebase backend is ready!
```

---

## 🏃 שלב 8: הרצת האפליקציה

### Development Mode

```bash
npm start
```

זה יפתח את Expo Developer Tools. מכאן תוכל:
- 📱 לסרוק QR code עם Expo Go
- 🤖 ללחוץ על `a` להרצה על Android
- 🍎 ללחוץ על `i` להרצה על iOS
- 🌐 ללחוץ על `w` להרצה ב-Web

### הרצה ישירה על פלטפורמות

```bash
npm run android  # הרצה על Android
npm run ios      # הרצה על iOS
npm run web      # הרצה ב-Web
```

---

## 📊 אימות בעזרת Firebase Console

1. פתח [Firebase Console](https://console.firebase.google.com)
2. בחר את הפרויקט **naor-amar**
3. בדוק:

### ✅ Firestore Database
- `businessSettings` → `main` (יש document)
- `barbers` → `barber_naor_amar_1` (יש document)
- `treatments` → 3 documents
- `users` → 1 document

### ✅ Storage
- Rules פעילים
- תיקיות מוכנות (יתווספו אוטומטית)

### ✅ Authentication
- Email/Password מופעל
- Phone מופעל (אופציונלי)

---

## 🔧 פתרון בעיות נפוצות

### ❌ "Permission denied" ב-Firestore

**בעיה:** לא ניתן לקרוא/לכתוב נתונים.

**פתרון:**
```bash
firebase deploy --only firestore:rules
```

בדוק ש-Rules נשמרו ב-Console.

---

### ❌ "Index required" error

**בעיה:** Query זקוק ל-Index.

**פתרון אוטומטי:**
1. לחץ על הלינק בהודעת השגיאה
2. Firebase יציע ליצור Index
3. לחץ "Create Index"
4. המתן 1-2 דקות

**פתרון ידני:**
```bash
firebase deploy --only firestore:indexes
```

---

### ❌ תמונות לא נטענות

**בעיה:** תמונות לא מוצגות מ-Storage.

**פתרון:**
```bash
firebase deploy --only storage:rules
```

וודא שיש:
```
allow read: if true;
```

---

### ❌ "serviceAccountKey.json not found"

**בעיה:** הסקריפטים לא מוצאים את מפתח ה-Admin.

**פתרון:**
1. הורד מחדש מ-Firebase Console
2. שמור ב: `scripts/serviceAccountKey.json`
3. וודא שהקובץ קיים: `ls scripts/serviceAccountKey.json`

---

### ❌ "Firebase not initialized"

**בעיה:** האפליקציה לא מצליחה להתחבר ל-Firebase.

**פתרון:**
1. בדוק ש-`config/firebase.ts` קיים
2. בדוק שהקונפיג נכון (apiKey, projectId, וכו')
3. וודא ש-`GoogleService-Info.plist` ו-`google-services.json` קיימים

---

## 📁 מבנה הקבצים הסופי

```
naor-amar/
├── 📁 config/
│   └── firebase.ts                 ✅ קונפיג Firebase
├── 📁 constants/
│   ├── colors.ts                   ✅ צבעים
│   ├── contactInfo.ts              ✅ פרטי קשר
│   └── scheduling.ts               ✅ לוגיקת תזמון
├── 📁 data/
│   ├── employeeSeedData.json       ✅ נתוני עובדים
│   └── README_EMPLOYEES.md
├── 📁 scripts/
│   ├── initializeFirestore.js      ✅ אתחול DB
│   ├── seedData.js                 ✅ Seeding
│   ├── testConnection.js           ✅ בדיקה
│   └── serviceAccountKey.json      🔒 (סודי!)
├── 📄 firestore.rules              ✅ חוקי אבטחה
├── 📄 firestore.indexes.json       ✅ אינדקסים
├── 📄 storage.rules                ✅ חוקי Storage
├── 📄 firebase.json                ✅ קונפיג Firebase
├── 📄 google-services.json         ✅ Android config
├── 📄 GoogleService-Info.plist     ✅ iOS config
├── 📄 package.json                 ✅ תלויות
├── 📄 app.json                     ✅ Expo config
├── 📄 README.md                    ✅ תיעוד
└── 📄 SETUP_GUIDE.md               ✅ המדריך הזה
```

---

## 🎯 מה הלאה?

אחרי שהכל עובד:

1. **פיתוח UI:**
   - צור מסכים (screens)
   - הוסף ניווט (navigation)
   - עצב components

2. **Authentication:**
   - הוסף מסך Login
   - הגדר Phone Auth
   - חבר ל-Firebase Auth

3. **תכונות:**
   - מערכת תורים
   - Calendar view
   - רשימת המתנה
   - התראות

4. **Testing:**
   - בדוק על Android/iOS
   - בדיקות משתמשים
   - תיקון באגים

5. **Deployment:**
   - Build APK/IPA
   - העלאה ל-Stores
   - Publish!

---

## 📞 צריך עזרה?

- 📧 Email: info@naoramar.com
- 📱 Phone: 053-270-6369
- 🔥 [Firebase Docs](https://firebase.google.com/docs)
- 📱 [Expo Docs](https://docs.expo.dev)

---

**✅ בהצלחה! 🚀**

**עודכן:** 2025-11-04  
**גרסה:** 1.0.0

