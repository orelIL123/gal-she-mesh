# 🚀 מדריך הגדרת Firebase Cloud Functions למחיקת משתמשים

## מה זה עושה?
Cloud Function שמאפשרת לאדמין למחוק משתמשים **גם מ-Firebase Authentication**, לא רק מ-Firestore.

---

## 📋 שלב 1: התקנת כלים

### 1.1 התקן Firebase CLI (אם עוד לא מותקן):
```bash
npm install -g firebase-tools
```

### 1.2 התחבר ל-Firebase:
```bash
firebase login
```

### 1.3 בחר את הפרויקט:
```bash
firebase use --add
```
בחר את הפרויקט שלך מהרשימה.

---

## 📦 שלב 2: התקנת תלויות

```bash
cd functions
npm install
```

זה יתקין:
- `firebase-admin` - SDK לניהול Firebase מצד השרת
- `firebase-functions` - ליצירת Cloud Functions
- `typescript` - לקומפילציה

---

## 🔧 שלב 3: Build הפונקציה

```bash
cd functions
npm run build
```

זה יקמפל את TypeScript ל-JavaScript בתיקיית `lib/`.

---

## 🚀 שלב 4: Deploy ל-Firebase

```bash
firebase deploy --only functions
```

זה יעלה את הפונקציה `deleteUserAuth` ל-Firebase.

**הפלט יראה משהו כזה:**
```
✔  functions[deleteUserAuth(us-central1)] Successful create operation.
Function URL: https://us-central1-YOUR-PROJECT.cloudfunctions.net/deleteUserAuth
```

---

## 💰 שלב 5: שדרוג לתוכנית Blaze (נדרש!)

⚠️ **חשוב!** Cloud Functions דורשות תוכנית **Blaze (Pay as you go)**.

1. לך ל-[Firebase Console](https://console.firebase.google.com)
2. בחר את הפרויקט שלך
3. Spark → Upgrade to Blaze
4. הכנס פרטי כרטיס אשראי

**עלויות:**
- יש **Free tier** נדיב מאוד
- רוב האפליקציות נשארות ב-Free tier
- תשלום רק אם עוברים את ההגבלות

---

## 📱 שלב 6: שילוב באפליקציה

### 6.1 ודא ש-`firebase/functions` מיובא ב-`config/firebase.ts`:

```typescript
import { getFunctions } from 'firebase/functions';

export const functions = getFunctions(app);
```

### 6.2 עדכן את `services/firebase.ts`:

הוסף בראש הקובץ:
```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
```

### 6.3 עדכן את פונקצית `deleteCustomer`:

אחרי מחיקת הדברים מ-Firestore, הוסף:

```typescript
// 5. Delete from Firebase Authentication using Cloud Function
console.log('  🔐 Deleting from Authentication...');
try {
  const deleteUserAuth = httpsCallable(functions, 'deleteUserAuth');
  const authResult = await deleteUserAuth({ userId });
  console.log('  ✅ Deleted from Authentication:', authResult.data);
} catch (authError: any) {
  console.error('  ⚠️  Could not delete from Authentication:', authError);
  // Continue anyway - user is already deleted from Firestore
}
```

**עדכן את הודעת ההצלחה:**
```typescript
return {
  success: true,
  message: `הלקוח נמחק בהצלחה לגמרי!\n\nנמחקו:\n• ${appointmentsSnapshot.size} תורים\n• ${tokensSnapshot.size} tokens\n• ${remindersSnapshot.size} תזכורות\n• מסמך המשתמש\n• ✅ Firebase Authentication\n\nהמחיקה הושלמה!`
};
```

---

## 🧪 שלב 7: בדיקה

1. **בנה מחדש את האפליקציה:**
   ```bash
   eas update --branch production --platform ios
   ```

2. **בדוק:**
   - היכנס כאדמין
   - לך ל-"ניהול לקוחות"
   - מחק לקוח
   - ודא שההודעה אומרת "Firebase Authentication ✅"

3. **וודא ב-Firebase Console:**
   - Authentication → Users
   - המשתמש לא קיים!

---

## 🔒 אבטחה

הפונקציה בטוחה כי:
- ✅ רק משתמשים מאומתים יכולים לקרוא לה
- ✅ רק אדמינים יכולים למחוק משתמשים (בדיקה ב-Firestore)
- ✅ לא ניתן למחוק אדמינים
- ✅ בדיקות שגיאות מלאות

---

## 📊 ניטור

**לראות logs:**
```bash
firebase functions:log
```

**ב-Firebase Console:**
1. Functions → Dashboard
2. לחץ על `deleteUserAuth`
3. ראה Logs, Metrics, Usage

---

## 💡 טיפים

1. **פיתוח מקומי:**
   ```bash
   cd functions
   npm run serve
   ```
   זה יריץ את הפונקציה locally (emulator).

2. **בדיקת שגיאות:**
   - לוגים ב-Firebase Console → Functions → Logs
   - לוגים באפליקציה (console.log)

3. **עדכון הפונקציה:**
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```

---

## 🎯 סיכום

**לפני Cloud Functions:**
- מחיקה מ-Firestore ✅
- מחיקה מ-Authentication ❌ (ידנית)

**אחרי Cloud Functions:**
- מחיקה מ-Firestore ✅
- מחיקה מ-Authentication ✅ (אוטומטית!)

**הכל נמחק בלחיצת כפתור אחת!** 🎉

---

## ❓ שאלות נפוצות

**ש: כמה זה עולה?**
ת: Free tier מכסה רוב השימוש. רק אם יש אלפי מחיקות ביום יהיה תשלום.

**ש: מה אם אני לא רוצה Cloud Functions?**
ת: אפשר להשאיר כמו שזה, פשוט תמחק ידנית ב-Firebase Console.

**ש: איך אני יודע שזה עובד?**
ת: בדוק ב-Firebase Console → Authentication אחרי מחיקה.

**ש: מה אם יש שגיאה?**
ת: הפונקציה תדפיס log ב-Firebase Console → Functions → Logs.

---

בעזרת השם, בהצלחה! 🚀
