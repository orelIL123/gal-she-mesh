# הגדרת Google Play Console מחדש

## 🔄 מעבר לחשבון Google Play Console חדש

אם פתחת חשבון חדש (למשל, חשבון למוסדות ללא הגבלת העלאות אפליקציות) ורוצה להתחבר אליו:

### שלב 0: הכנה
1. **ודא שיש לך גישה לחשבון החדש:**
   - התחבר ל-https://play.google.com/console עם החשבון החדש
   - ודא שיש לך הרשאות מנהל (Admin) בחשבון
   
2. **צור אפליקציה חדשה בחשבון (אם עדיין לא):**
   - לך ל-Google Play Console → All apps → Create app
   - מלא את הפרטים הבסיסיים
   - **חשוב:** ה-package name חייב להיות: `com.galshemesh.app` (כמו ב-`app.json`)

---

## הבעיה:
EAS Submit מחובר למשתמש/חשבון Google Play Console שגוי.

## פתרון - הגדרה מחדש:

### שלב 1: בדיקת ההגדרות הנוכחיות

**בדוק איזה חשבון מחובר כרגע:**
```bash
eas credentials
# בחר: Android → Google Play Service Account
# זה יציג את ה-Service Account הנוכחי (אם יש)
```

**או בדוק ישירות:**
```bash
eas credentials --platform android
```

**לבדיקת פרטי החשבון ב-Google Play Console:**
- לך ל-https://play.google.com/console
- בדוק באיזה חשבון אתה מחובר (בפינה הימנית העליונה)
- ודא שזה החשבון הנכון שבו אתה רוצה להעלות את האפליקציה

### שלב 2: מחיקת credentials ישנים
```bash
# מחיקת Android credentials
eas credentials
# בחר: Android → Remove credentials → Google Play Service Account
```

### שלב 3: יצירת Service Account חדש ב-Google Play Console

1. **לך ל-Google Play Console:**
   - https://play.google.com/console
   - התחבר עם החשבון הנכון (זה שאתה רוצה להשתמש בו)

2. **צור Service Account:**
   - Settings → API access
   - לחץ על "Create new service account"
   - לך ל-Google Cloud Console (יפתח אוטומטית)
   - צור Service Account חדש
   - תן לו שם (למשל: "gal-shemesh-eas-submit")
   - תן לו את התפקיד: "Service Account User"

3. **הורד את ה-JSON key:**
   - ב-Google Cloud Console → Service Accounts
   - לחץ על ה-Service Account שיצרת
   - לך ל-Keys → Add Key → Create new key → JSON
   - הורד את הקובץ (שמור אותו במקום בטוח!)

4. **הרשאות ב-Google Play Console:**
   - חזור ל-Google Play Console → Settings → API access
   - לחץ על "Grant access" ליד ה-Service Account שיצרת
   - תן הרשאות:
     - ✅ View app information
     - ✅ Manage production releases
     - ✅ Manage testing track releases
     - ✅ Manage store listing

### שלב 4: הגדרת Credentials ב-EAS

**אפשרות A: אוטומטי (מומלץ)**
```bash
eas credentials
# בחר: Android → Google Play Service Account
# בחר: Set up a new service account
# העתק את ה-JSON key שמורידת
```

**אפשרות B: ידני**
```bash
# שמור את ה-JSON key בתיקיית הפרויקט (לא commit ל-git!)
# עדכן את eas.json:
```

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json"
      }
    }
  }
}
```

### שלב 5: בדיקת החיבור
```bash
eas submit --platform android --profile production --latest
```

## ⚠️ חשוב:
1. **אל תעלה את ה-JSON key ל-git!** הוסף ל-.gitignore:
   ```
   google-play-service-account.json
   *-service-account.json
   ```

2. **ודא שאתה משתמש בחשבון הנכון** ב-Google Play Console

3. **ודא שה-package name תואם:**
   - ב-Google Play Console: `com.galshemesh.app`
   - ב-app.json: `com.galshemesh.app` ✅

## 🔄 אם עדיין לא עובד:

1. **בדוק את ה-package name:**
   ```bash
   # ב-app.json
   "package": "com.galshemesh.app"
   ```

2. **בדוק שה-app קיים ב-Google Play Console:**
   - לך ל-Google Play Console
   - ודא שיש לך אפליקציה עם package name: `com.galshemesh.app`

3. **נסה להעלות ידנית:**
   - הורד את ה-.aab מה-build
   - לך ל-Google Play Console → Production → Create new release
   - העלה את ה-.aab file ידנית

## 📝 העלאה ידנית (אם EAS Submit לא עובד):

1. **הורד את ה-.aab:**
   ```bash
   eas build:list
   # מצא את ה-build ID
   eas build:download [BUILD_ID]
   ```

2. **העלה ל-Google Play Console:**
   - לך ל-Google Play Console
   - בחר את האפליקציה
   - Production → Create new release
   - העלה את ה-.aab file
   - מלא Release notes
   - Review & Rollout

---

## 📋 סיכום מהיר - מעבר לחשבון חדש

אם אתה רוצה לעבור לחשבון Google Play Console חדש, בצע את השלבים הבאים:

1. **הסר credentials ישנים:**
   ```bash
   eas credentials
   # בחר: Android → Remove credentials → Google Play Service Account
   ```

2. **צור Service Account בחשבון החדש:**
   - התחבר ל-https://play.google.com/console עם החשבון החדש
   - Settings → API access → Create new service account
   - הורד את ה-JSON key

3. **הגדר credentials חדשים:**
   ```bash
   eas credentials
   # בחר: Android → Google Play Service Account → Set up a new service account
   # העתק את תוכן ה-JSON key
   ```

4. **בדוק את החיבור:**
   ```bash
   eas submit --platform android --profile production --latest
   ```

**או השתמש בסקריפט:**
```bash
./fix-google-play-credentials.sh
```

