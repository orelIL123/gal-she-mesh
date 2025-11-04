# 🧹 ניקוי Cache והרצה מחדש

## ⚠️ למה אתה רואה מסכים ישנים?

האפליקציה שלך רצה עם **cache ישן**. המסכים החדשים כבר קיימים, אבל Metro Bundler לא רואה אותם.

---

## ✅ הפתרון (3 דקות):

### שלב 1: עצור את Metro Bundler

אם `npm start` רץ, לחץ **Ctrl+C** לעצירה.

### שלב 2: נקה הכל

```bash
cd /Users/x/Desktop/naor-amar-barbershop/naor-amar

# מחק node_modules ו-package-lock.json
rm -rf node_modules package-lock.json

# מחק .expo cache
rm -rf .expo

# מחק build folders אם קיימים
rm -rf ios/build android/build android/.gradle

# התקן מחדש
npm install
```

### שלב 3: הרץ עם Clear Cache

```bash
npx expo start -c
```

הדגל `-c` מנקה את ה-cache של Metro.

### שלב 4: Reset האפליקציה בטלפון

אם אתה משתמש ב-Expo Go:
1. **מחק את האפליקציה מהטלפון**
2. פתח מחדש את Expo Go
3. סרוק את ה-QR code שוב

---

## 🎯 אלטרנטיבה מהירה:

אם אתה לא רוצה למחוק node_modules:

```bash
cd /Users/x/Desktop/naor-amar-barbershop/naor-amar

# נקה רק cache
npx expo start -c --clear
```

---

## 📱 המסכים הנכונים שיופיעו:

אחרי הניקוי תראה:

### AuthChoiceScreen (המסך הראשון):
- ✅ לוגו של Naor Amar (עגול זהב)
- ✅ "Naor Amar" בכותרת
- ✅ 3 כפתורים:
  1. כחול: "התחברות"
  2. לבן עם מסגרת: "הרשמה"
  3. אפור: "צפה כאורח"

### LoginScreen:
- ✅ לוגו Naor Amar
- ✅ "התחברות עם אימייל או טלפון"
- ✅ שדות קלט
- ✅ כפתור כחול גדול

### RegisterScreen:
- ✅ לוגו Naor Amar
- ✅ "הרשמה עם מספר טלפון"
- ✅ שדות: שם, טלפון, סיסמה
- ✅ כפתור "שלח קוד אימות"

---

## 🔍 לוודא שהמסכים הנכונים:

אחרי שהאפליקציה רצה, בדוק:

1. **מסך הפתיחה** - צריך לראות "Naor Amar" (לא "רון תורגמן" / "TURGI")
2. **3 כפתורים** - התחברות, הרשמה, אורח
3. **פרטי קשר** - 053-270-6369 (לא 054-228-0222)

אם אתה רואה "רון תורגמן" או "TURGI" - ה-cache לא נוקה!

---

## 🐛 אם עדיין לא עובד:

```bash
# פתרון גרעיני:
cd /Users/x/Desktop/naor-amar-barbershop
rm -rf naor-amar/node_modules naor-amar/.expo
cd naor-amar
npm install
npx expo start -c
```

ואז **מחק את Expo Go מהטלפון** והתקן מחדש.

---

## ✅ המסכים הנכונים כבר קיימים!

הקבצים:
- ✅ `app/auth-choice.tsx` → AuthChoiceScreen (3 כפתורים)
- ✅ `app/login.tsx` → LoginScreen (אימייל/טלפון)
- ✅ `app/register.tsx` → RegisterScreen (הרשמה)

הבעיה היא רק ה-**cache**!

---

**אחרי הניקוי הכל יעבוד מושלם! 🚀**

