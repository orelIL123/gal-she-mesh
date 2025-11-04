# 🚀 מדריך Build & Deploy - נאור עמר מספרה

## 📋 תוכן עניינים
1. [הכנה](#הכנה)
2. [בניית iOS Preview](#בניית-ios-preview)
3. [בניית Android Preview](#בניית-android-preview)
4. [EAS Updates](#eas-updates)
5. [Production Build](#production-build)
6. [פתרון בעיות נפוצות](#פתרון-בעיות-נפוצות)

---

## 🔧 הכנה

### דרישות מקדימות:
```bash
# וודא שיש לך EAS CLI מותקן
npm install -g eas-cli

# התחבר ל-Expo account
eas login

# וודא שאתה מחובר לפרויקט
eas whoami
```

### וודא גרסאות:
- ✅ **app.json**: version `1.3.0`
- ✅ **package.json**: version `1.3.0`
- ✅ **runtimeVersion**: `1.3.0`

---

## 📱 בניית iOS Preview

### אופציה 1: בניית סימולטור (מהיר)
```bash
# בניית build לסימולטור iOS
npm run build:ios:preview

# או ישירות:
eas build --platform ios --profile preview
```

**תכונות:**
- ✅ בנייה מהירה (~10-15 דקות)
- ✅ פועל על סימולטור iOS במק
- ✅ אידיאלי לבדיקות מהירות
- ❌ לא פועל על מכשיר אמיתי

### אופציה 2: בניית מכשיר פיזי
```bash
# בניית build למכשיר אמיתי
eas build --platform ios --profile production
```

**תכונות:**
- ✅ פועל על iPhone אמיתי
- ✅ TestFlight או הפצה פנימית
- ⏱️ בנייה ארוכה יותר (~20-30 דקות)

---

## 🤖 בניית Android Preview

```bash
# בניית APK לאנדרואיד
npm run build:android:preview

# או ישירות:
eas build --platform android --profile preview
```

**תכונות:**
- ✅ קובץ APK להורדה ישירה
- ✅ התקנה על כל מכשיר אנדרואיד
- ✅ אין צורך ב-Google Play Store
- ⏱️ בנייה ~15-20 דקות

---

## 🔄 EAS Updates (OTA Updates)

### מה זה EAS Update?
עדכונים מיידיים ללא צורך ב-build חדש! 🚀

### שליחת עדכון:

#### Preview Channel:
```bash
# עדכון לסביבת preview
npm run update:preview

# או ישירות:
eas update --branch preview --message "תיקון באגים והוספת פיצ'רים"
```

#### Production Channel:
```bash
# עדכון לפרודקשן
npm run update:production

# או ישירות:
eas update --branch production --message "עדכון לגרסה 1.3.0"
```

### 📝 טיפים חשובים:
- ✅ EAS Update עובד **רק** לשינויים ב-JavaScript/TypeScript
- ✅ מעולה לתיקוני באגים ושיפורים קלים
- ❌ **לא פועל** לשינויים ב-native code או dependencies
- ⚡ המשתמשים מקבלים את העדכון תוך דקות!

### מתי לשלוח EAS Update?
✅ **כן:**
- תיקון באגים בקוד
- שינויי UI/UX
- עדכון טקסטים
- שיפור ביצועים
- שינויים ב-Firebase rules

❌ **לא (צריך build חדש):**
- הוספת native dependencies
- שינוי ב-app.json (permissions, icons)
- שינוי ב-native modules
- עדכון גרסת Expo

---

## 🏭 Production Build

### iOS Production:
```bash
# build לפרודקשן (App Store)
npm run build:ios:production

# או:
eas build --platform ios --profile production

# שליחה ל-App Store
eas submit --platform ios
```

### Android Production:
```bash
# build לפרודקשן (Google Play)
npm run build:android:production

# או:
eas build --platform android --profile production

# שליחה ל-Google Play
eas submit --platform android
```

---

## 🆘 פתרון בעיות נפוצות

### ❌ בעיה: "EAS update doesn't work"

**פתרון:**
```bash
# 1. וודא שה-runtimeVersion תואם ב-app.json
"runtimeVersion": "1.3.0"

# 2. וודא שה-build נבנה עם אותה גרסה
# 3. שלח עדכון עם message מפורש:
eas update --branch preview --message "test update"

# 4. בדוק שהמשתמש מחובר לאינטרנט
```

### ❌ בעיה: "Build fails"

**פתרון:**
```bash
# 1. נקה cache
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install

# 2. וודא שאין שגיאות TypeScript
npm run lint

# 3. בדוק את ה-logs ב-EAS
eas build:list
```

### ❌ בעיה: SMS לא עובד (HTTP 400)

**פתרון:**
1. ✅ **וודא שהפרטים נכונים** ב-`app/config/messaging.ts`
2. ✅ **בדוק יתרת SMS** בחשבון ToriX
3. ✅ **המספר חייב להיות בפורמט ישראלי:** `05XXXXXXXX`
4. ✅ **בדוק את הלוגים** - הם מראים בדיוק מה השגיאה

---

## 📊 מעקב אחר Builds

```bash
# רשימת כל ה-builds
eas build:list

# מעקב אחר build ספציפי
eas build:view [BUILD_ID]

# ביטול build
eas build:cancel [BUILD_ID]
```

---

## 🎯 Workflow מומלץ

### 1️⃣ פיתוח יומיומי:
```bash
npm start
# בדיקות ושינויים
```

### 2️⃣ לפני שליחת עדכון:
```bash
# וודא שהכל עובד
npm run lint
# בדוק שאין שגיאות

# שלח עדכון
npm run update:preview
```

### 3️⃣ כשצריך build חדש:
```bash
# עדכן גרסה ב-app.json ו-package.json
# למשל: 1.3.0 → 1.4.0

# בנה preview
npm run build:ios:preview

# אחרי בדיקות - בנה production
npm run build:ios:production
```

---

## ✅ Checklist לפני Build

- [ ] עדכנתי את הגרסה ב-`app.json`
- [ ] עדכנתי את הגרסה ב-`package.json`
- [ ] עדכנתי את `runtimeVersion` ב-`app.json`
- [ ] בדקתי שאין שגיאות TypeScript
- [ ] בדקתי ש-Firebase credentials עובדים
- [ ] בדקתי שה-SMS configuration נכון
- [ ] הרצתי את האפליקציה ובדקתי את הפונקציות העיקריות

---

## 📞 תמיכה

אם יש בעיות:
1. בדוק את הלוגים של EAS
2. בדוק את התיעוד הרשמי: https://docs.expo.dev/eas/
3. פנה לתמיכה של Expo

---

## 🎉 הצלחה!

אחרי שהכל עובד:
```bash
# שלח את הבשורות הטובות! 🚀
echo "Build הושלם בהצלחה! 🎊"
```

