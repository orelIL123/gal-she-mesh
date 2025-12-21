# מדריך העברת תזכורות ל-Cloud Function מתוזמן

## 📋 סקירה כללית

העברנו את לוגיקת התזכורות מ-polling באפליקציה ל-Cloud Function מתוזמן שרץ כל 5 דקות ב-backend.

## ✅ מה נעשה

1. ✅ נוצר Cloud Function מתוזמן (`processScheduledReminders`)
2. ✅ הוסרה לוגיקת polling מהאפליקציה
3. ✅ כל הלוגיקה הועתקה ל-Cloud Function

## 🚀 שלבי הפעלה

### שלב 1: התקנת תלויות (אם צריך)

```bash
cd functions
npm install
```

### שלב 2: בניית Functions

```bash
cd functions
npm run build
```

זה יוצר את התיקייה `lib/` עם הקוד המהודר.

### שלב 3: בדיקת הקוד

ודא שהקוד נבנה בהצלחה:

```bash
cd functions
npm run build
```

אם יש שגיאות, תתקן אותן לפני המשך.

### שלב 4: Deploy ל-Firebase

```bash
# מהתיקייה הראשית של הפרויקט
firebase deploy --only functions:processScheduledReminders
```

או אם אתה בתיקיית functions:

```bash
cd ..
firebase deploy --only functions:processScheduledReminders
```

### שלב 5: בדיקת ה-Deployment

1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך
3. לך ל-**Functions** בתפריט
4. ודא ש-`processScheduledReminders` מופיע ברשימה
5. בדוק את ה-Logs כדי לראות שהפונקציה רצה

### שלב 6: בדיקת הפעלה

1. צור תור חדש באפליקציה
2. בדוק ב-Firestore ש-nested ב-`scheduledReminders` נוצר עם `status: 'pending'`
3. המתן עד 5 דקות (או פחות אם התור קרוב)
4. בדוק את ה-Logs של Cloud Function
5. ודא שהתזכורת נשלחה והסטטוס השתנה ל-`sent`

## 📝 מבנה הקוד

### Cloud Function (`functions/src/index.ts`)

הפונקציה `processScheduledReminders` רצה כל 5 דקות ומבצעת:

1. **מציאת תזכורות מתוזמנות** - מחפש ב-`scheduledReminders` עם `status: 'pending'` ו-`scheduledTime <= now`
2. **עיבוד כל תזכורת** - קורא ל-`sendAppointmentReminder` לכל תזכורת
3. **עדכון סטטוס** - מעדכן את הסטטוס ל-`sent` או `failed`

### פונקציות עזר

- `sendAppointmentReminder` - שולח תזכורת ללקוח
- `getAdminNotificationSettings` - מקבל הגדרות אדמין
- `getUserProfile` - מקבל פרופיל משתמש
- `sendNotificationToUser` - שולח התראה למשתמש
- `sendPushNotification` - שולח Push Notification דרך Expo
- `sendSMSReminder` - שולח SMS (צריך להוסיף שירות SMS)
- `sendAppointmentReminderToAdmin` - שולח תזכורת לאדמין

## 🔧 הגדרות

### תדירות הרצה

הפונקציה רצה כל 5 דקות. אם אתה רוצה לשנות:

```typescript
export const processScheduledReminders = functions.pubsub
  .schedule('every 5 minutes')  // שנה כאן
  .timeZone('Asia/Jerusalem')
  .onRun(async (context) => {
    // ...
  });
```

אפשרויות:
- `'every 1 minutes'` - כל דקה
- `'every 5 minutes'` - כל 5 דקות (מומלץ)
- `'every 10 minutes'` - כל 10 דקות
- `'every 1 hours'` - כל שעה

### אזור זמן

הפונקציה מוגדרת ל-`Asia/Jerusalem`. אם אתה רוצה לשנות:

```typescript
.timeZone('Asia/Jerusalem')  // שנה כאן
```

## 📱 SMS Integration

כרגע הפונקציה `sendSMSReminder` לא שולחת SMS בפועל. כדי להוסיף:

1. **התקן שירות SMS** (לדוגמה: Twilio, AWS SNS)
2. **עדכן את הפונקציה** ב-`functions/src/index.ts`:

```typescript
async function sendSMSReminder(phoneNumber: string, message: string): Promise<void> {
  // הוסף כאן את הקוד של השירות SMS שלך
  // לדוגמה עם Twilio:
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({
  //   body: message,
  //   to: formattedPhone,
  //   from: '+1234567890'
  // });
}
```

## 🐛 Debugging

### בדיקת Logs

1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט
3. לך ל-**Functions** → **Logs**
4. סנן לפי `processScheduledReminders`

### בדיקת Firestore

1. לך ל-**Firestore Database**
2. בדוק את ה-collection `scheduledReminders`
3. ודא שהתזכורות נוצרות עם `status: 'pending'`
4. אחרי שהפונקציה רצה, ודא שהסטטוס משתנה ל-`sent`

### בדיקת שגיאות

אם יש שגיאות, הן יופיעו ב-Logs. שגיאות נפוצות:

1. **Index missing** - צריך ליצור index ב-Firestore
2. **Permission denied** - בדוק את ה-Firestore Rules
3. **Push token missing** - המשתמש לא רשום להתראות

## ⚠️ שינויים שנעשו באפליקציה

### `app/_layout.tsx`

**הוסר:**
```typescript
// הוסר הקוד של polling כל 5 דקות
useEffect(() => {
  const processReminders = async () => {
    await processScheduledReminders();
  };
  processReminders();
  const interval = setInterval(processReminders, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

**הוחלף ב:**
```typescript
// NOTE: Reminder processing is now handled by Cloud Function
```

### `services/firebase.ts`

הפונקציה `processScheduledReminders` עדיין קיימת בקוד (למקרה של fallback), אבל לא נקראת מהאפליקציה.

## 📊 עלויות

### Cloud Functions

- **הרצות**: כל 5 דקות = 288 הרצות ביום
- **עלות**: בדרך כלל בחינם עד 2 מיליון הרצות בחודש
- **זמן ביצוע**: תלוי במספר התזכורות, בדרך כלל 1-5 שניות

### Firestore

- **קריאות**: תלוי במספר התזכורות
- **עלות**: בדרך כלל בחינם עד 50,000 קריאות ביום

## ✅ Checklist לפני Production

- [ ] Cloud Function נבנה בהצלחה
- [ ] Cloud Function נפרס בהצלחה
- [ ] בדיקת Logs - הפונקציה רצה כל 5 דקות
- [ ] בדיקת תזכורת - תזכורת נשלחת בהצלחה
- [ ] בדיקת Push Notifications - התראות מגיעות למשתמשים
- [ ] בדיקת SMS (אם מופעל) - SMS נשלח
- [ ] בדיקת תזכורות לאדמין - תזכורות מגיעות לאדמינים
- [ ] הסרת קוד הישן מהאפליקציה (אם לא נעשה)

## 🔄 Rollback (אם צריך)

אם יש בעיות, אפשר לחזור ל-polling באפליקציה:

1. החזר את הקוד ב-`app/_layout.tsx`
2. הסר את ה-Cloud Function:
   ```bash
   firebase functions:delete processScheduledReminders
   ```

## 📞 תמיכה

אם יש בעיות:
1. בדוק את ה-Logs ב-Firebase Console
2. בדוק את ה-Firestore Rules
3. ודא שה-Indexes קיימים ב-Firestore

## 🎉 סיכום

המערכת עכשיו עובדת כך:
1. **יצירת תור** → נוצר record ב-`scheduledReminders` עם `status: 'pending'`
2. **Cloud Function** → רץ כל 5 דקות, מוצא תזכורות שהגיע זמנן
3. **שליחת תזכורות** → שולח Push Notifications (ו-SMS אם מופעל)
4. **עדכון סטטוס** → מעדכן את הסטטוס ל-`sent`

זה יותר יעיל, אמין וחסכוני מאשר polling מהאפליקציה!
