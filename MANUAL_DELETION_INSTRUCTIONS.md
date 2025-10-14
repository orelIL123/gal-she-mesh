# הוראות מחיקה ידנית של משתמשים

עקב הגבלות הרשאות, יש למחוק את המשתמשים הבאים **ידנית** ב-Firebase Console:

## משתמשים למחיקה:

1. **עילאי יפרח** (0503998885)
2. **איתי פתיחה** (0552483548)
3. **מרום** (0547222216)
4. **רון תורגמן** (0523985505) - **לא admin!**
5. **אופק תורגמן** (אם קיים)
6. **050799877** (אם קיים)

---

## שלבי המחיקה:

### 1️⃣ מחיקה מ-Firestore Database

1. לך ל: https://console.firebase.google.com/project/barber-app-d1771/firestore
2. בחר ב-collection `users`
3. חפש כל משתמש לפי:
   - `displayName` (שם)
   - `phone` (מספר טלפון)
4. לחץ על המסמך ומחק אותו

### 2️⃣ מחיקה מ-Authentication

1. לך ל: https://console.firebase.google.com/project/barber-app-d1771/authentication/users
2. חפש לפי מספר טלפון או אימייל
3. לחץ על ה-⋮ (שלוש נקודות) ליד המשתמש
4. בחר "Delete account"
5. אשר את המחיקה

### 3️⃣ מחיקה של Push Tokens

1. חזור ל-Firestore: https://console.firebase.google.com/project/barber-app-d1771/firestore
2. בחר ב-collection `pushTokens`
3. חפש כל token שה-`userId` שלו תואם לאחד מהמשתמשים
4. מחק את כל ה-tokens

### 4️⃣ מחיקה של תורים (אם יש)

1. ב-Firestore, בחר ב-collection `appointments`
2. חפש תורים שה-`userId` שלהם תואם למשתמשים שנמחקו
3. מחק את כל התורים

### 5️⃣ מחיקה של תזכורות מתוזמנות

1. ב-Firestore, בחר ב-collection `scheduledReminders`
2. חפש תזכורות שה-`userId` שלהן תואם למשתמשים שנמחקו
3. מחק את כל התזכורות

---

## ✅ אישור מחיקה מוצלחת

לאחר המחיקה, בדוק:
- [ ] המשתמש לא מופיע ב-Authentication
- [ ] המסמך נמחק מ-collection `users`
- [ ] אין tokens ב-collection `pushTokens` עם ה-userId שלו
- [ ] אין תורים ב-collection `appointments` עם ה-userId שלו
- [ ] המשתמש לא יכול להתחבר לאפליקציה

---

## 🔄 למה צריך מחיקה ידנית?

Firebase Client SDK (שבאפליקציה) **לא מאפשר** למחוק משתמשים מ-Authentication.
רק Firebase Admin SDK (בשרת או Cloud Functions) יכול למחוק משתמשים מ-Authentication.

האפשרויות:
1. **מחיקה ידנית** (הכי מהיר) - דרך Firebase Console
2. **Cloud Function** - כתיבת פונקציה עם Admin SDK
3. **Admin SDK בשרת** - דורש הגדרת שרת Node.js

בינתיים, **מחיקה ידנית היא הפתרון המומלץ**.
