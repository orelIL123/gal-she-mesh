# בניית Android Production ל-Google Play Store

## ✅ הגדרות מוכנות:
- ✅ `eas.json` - מוגדר ל-production עם `app-bundle`
- ✅ `app.json` - מוגדר עם package name ו-versionCode
- ✅ `google-services.json` - קיים ונכון
- ✅ Permissions - מוגדרים נכון

## 🚀 פקודת Build:

```bash
npm run build:android:production
```

או ישירות:

```bash
eas build --platform android --profile production
```

## 📋 מה יקרה:
1. EAS Build יבנה Android App Bundle (.aab) - הפורמט הנדרש ל-Google Play
2. ה-build ייעשה בענן של Expo
3. תקבל קישור להורדת ה-.aab file
4. תוכל להעלות את הקובץ ל-Google Play Console

## 📝 הערות חשובות:
- **versionCode**: כרגע מוגדר ל-1. בכל build חדש ל-Google Play, צריך להעלות אותו (2, 3, 4...)
- **version**: "1.0.0" - זה מה שהמשתמש רואה בחנות
- **App Bundle**: EAS בונה `.aab` (לא `.apk`) - זה מה ש-Google Play דורש

## 🔄 לאחר ה-build:
1. הורד את ה-.aab file מהקישור שתקבל
2. לך ל-Google Play Console
3. בחר את האפליקציה שלך
4. לך ל-Production → Create new release
5. העלה את ה-.aab file
6. מלא את Release notes
7. Review & Rollout

## ⚠️ לפני Build הבא:
עדכן את `versionCode` ב-`app.json`:
```json
"versionCode": 2  // או 3, 4, וכו'
```





