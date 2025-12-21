# הגדרת Google Play Console מחדש

## 📱 איפה לראות את כל פרטי האפליקציה ב-Google Play Console

לאחר התחברות ל-https://play.google.com/console ובחירת האפליקציה שלך, תוכל לראות את כל הפרטים וההגדרות בתפריט הצד:

### 🏠 Dashboard (לוח בקרה)
- **מיקום:** תפריט צד → Dashboard
- **מה תראה:** סקירה כללית של האפליקציה
  - סטטיסטיקות הורדות
  - ביקורות ודירוגים
  - הכנסות (אם יש)
  - בעיות שדורשות טיפול (אם יש)
  - סטטוס ההגשה והפרסום

### 📝 Store listing (רשימת החנות)
- **מיקום:** תפריט צד → Store listing
- **מה תראה:**
  - שם האפליקציה
  - תיאור קצר וארוך
  - תמונות (אייקון, צילומי מסך, גרפיקה)
  - קטגוריה
  - פרטי קשר
  - מדיניות פרטיות
  - **חשוב:** כאן תראה מה חסר וצריך למלא (סימון ✅ או ❌)

### 🚀 Release (הפצה)
- **מיקום:** תפריט צד → Release
- **מה תראה:**
  - **Production** - גרסאות שפורסמו לקהל הרחב
  - **Testing tracks** - Internal testing, Closed testing, Open testing
  - היסטוריית גרסאות
  - אפשרות להעלות גרסה חדשה (.aab)

### ⚙️ Policy (מדיניות)
- **מיקום:** תפריט צד → Policy
- **מה תראה:**
  - **App content** - תוכן האפליקציה (צריך למלא ולסמן)
    - ✅ Data safety (אבטחת מידע)
    - ✅ Target audience (קהל יעד)
    - ✅ Content ratings (דירוג תוכן)
    - ✅ Ads (פרסומות)
    - ✅ News apps (אפליקציות חדשות)
  - **App access** - גישה לאפליקציה
  - **Declarations** - הצהרות (צריך לסמן)

### 💰 Pricing & distribution (תמחור והפצה)
- **מיקום:** תפריט צד → Pricing & distribution
- **מה תראה:**
  - מחיר (חינם/בתשלום)
  - מדינות הפצה
  - הסכמים (Developer Program Policies)
  - Export compliance (ציות ליצוא)

### 🔒 App integrity (שלמות האפליקציה)
- **מיקום:** תפריט צד → App integrity
- **מה תראה:**
  - App signing (חתימת האפליקציה)
  - Play App Signing status
  - Credentials (מפתחות)

### 📊 Statistics (סטטיסטיקות)
- **מיקום:** תפריט צד → Statistics
- **מה תראה:**
  - הורדות
  - ביצועים
  - ביקורות
  - הכנסות

### ⚙️ Setup (הגדרות)
- **מיקום:** תפריט צד → Setup
- **מה תראה:**
  - **App access** - הגדרות גישה
  - **Advanced settings** - הגדרות מתקדמות
  - **App icon** - אייקון האפליקציה

### 🔧 Settings (הגדרות כלליות)
- **מיקום:** תפריט צד → Settings (בתחתית התפריט)
- **מה תראה:**
  - **Account details** - פרטי החשבון
  - **API access** - גישה ל-API (כאן מגדירים Service Account)
  - **Users & permissions** - משתמשים והרשאות
  - **License testing** - בדיקת רישיונות

### ✅ איך לדעת מה צריך למלא/לסמן?

1. **Dashboard** - יראה לך רשימת משימות (Tasks) שצריך להשלים
2. **Store listing** - כל סעיף עם ❌ או "Incomplete" צריך למלא
3. **Policy → App content** - כל סעיף עם סימון ❌ צריך למלא ולסמן
4. **Pricing & distribution** - ודא שכל ההסכמים מסומנים (✅)

### 🎯 השלבים החשובים ביותר לפני פרסום:

1. ✅ **Store listing** - מלא את כל הפרטים (תיאור, תמונות, קטגוריה)
2. ✅ **Policy → App content** - מלא את כל ההצהרות:
   - Data safety
   - Target audience  
   - Content ratings
3. ✅ **Pricing & distribution** - בחר מדינות והסכמים
4. ✅ **Release → Production** - העלה גרסה (.aab)

---

## 📋 הוראות מפורטות - מה למלא בכל סעיף

### 1️⃣ Privacy Policy (מדיניות פרטיות)

**מיקום:** Store listing → Privacy Policy

**✅ הקישור שלך:**
```
https://gal-shemesh.web.app/index.html
```

**מה לעשות:**
1. לחץ על "Privacy Policy"
2. בחר "Enter URL"
3. הכנס את הקישור: `https://gal-shemesh.web.app/index.html`
4. לחץ "Save" ✅

**אם אין לך מדיניות פרטיות, השתמש בטקסט הזה:**

```
מדיניות פרטיות - מספרת גל שמש

1. איסוף מידע
האפליקציה אוספת את המידע הבא:
- שם פרטי ושם משפחה
- מספר טלפון
- כתובת אימייל (אופציונלי)
- פרטי תורים (תאריך, שעה, סוג שירות)

2. שימוש במידע
המידע משמש למטרות הבאות:
- ניהול תורים
- שליחת התראות ותזכורות
- שיפור השירות

3. אחסון מידע
המידע נשמר בבסיס נתונים מאובטח של Firebase.

4. שיתוף מידע
איננו משתפים את המידע עם צדדים שלישיים, למעט:
- Firebase (לצורך אחסון הנתונים)
- ספקי שירותים חיוניים להפעלת האפליקציה

5. זכויות המשתמש
לכל משתמש יש זכות:
- לצפות במידע האישי שלו
- לעדכן או למחוק את המידע
- לבטל את ההרשמה

6. קשר
לשאלות בנוגע למדיניות הפרטיות, צרו קשר:
אימייל: Galshemesh76@gmail.com
טלפון: 052-221-0281

עדכון אחרון: [תאריך נוכחי]
```

**או צור קישור לאתר:**
- אם יש לך אתר, העלה שם את מדיניות הפרטיות
- הכנס את ה-URL (למשל: `https://galshemesh.com/privacy`)

**לאחר מילוי:** לחץ "Save" ✅

---

### 2️⃣ Store Listing - פרטים בסיסיים

**מיקום:** Store listing → Main store listing

#### א. שם האפליקציה (App name)
- **מה למלא:** `Gal Shemesh` או `גל שמש`
- **אורך מקסימלי:** 50 תווים

#### ב. תיאור קצר (Short description)
- **מה למלא:**
  ```
  אפליקציה להזמנת תורים במספרת גל שמש. הזמן תור בקלות, צפה בתורים שלך וקבל תזכורות.
  ```
- **אורך:** עד 80 תווים

#### ג. תיאור מלא (Full description)
- **מה למלא:**
  ```
  ברוכים הבאים למספרת גל שמש!

  האפליקציה שלנו מאפשרת לך:
  ✂️ הזמנת תורים בקלות ובנוחות
  📅 צפייה בתורים הקרובים שלך
  🔔 קבלת תזכורות ותהתראות
  👥 הכרת הצוות המקצועי
  📸 גלריית תמונות מהמספרה

  מספרת גל שמש - צוות מקצועי עם תשוקה לאסתטיקה, שירות וחוויה.
  בואו להתרענן, להרגיש בבית ולצאת עם חיוך.

  צרו קשר:
  📞 052-221-0281
  📍 באר שבע, המכבים 1
  ✉️ Galshemesh76@gmail.com
  ```
- **אורך:** עד 4000 תווים

#### ד. גרפיקה (Graphics)

**אייקון (App icon):**
- גודל: 512x512 פיקסלים
- פורמט: PNG
- רקע: שקוף או צבע אחיד

**צילומי מסך (Screenshots):**
- **מינימום:** 2 צילומי מסך
- **מומלץ:** 4-8 צילומי מסך
- **גודל:** 
  - טלפון: 1080x1920 או 1440x2560
  - טאבלט (אופציונלי): 1200x1920
- **מה להציג:**
  1. מסך בית עם כפתור הזמנת תור
  2. מסך הזמנת תור
  3. מסך התורים שלי
  4. מסך הצוות
  5. גלריה

**Feature Graphic (גרפיקה ראשית):**
- גודל: 1024x500 פיקסלים
- פורמט: PNG או JPG
- זה מה שמוצג בראש דף האפליקציה בחנות

#### ה. קטגוריה (Category)
- **בחר:** `Lifestyle` או `Productivity`
- **או:** `Beauty` (אם קיים)

#### ו. פרטי קשר (Contact details)
- **Email:** `Galshemesh76@gmail.com`
- **Phone:** `052-221-0281`
- **Website (אופציונלי):** אם יש לך אתר

**לאחר מילוי:** לחץ "Save" ✅

---

### 3️⃣ Policy → App content

**מיקום:** Policy → App content

#### א. Data Safety (אבטחת מידע)

**לחץ על "Data Safety" → "Start"**

**1. Does your app collect or share any of the required user data types?**
- **בחר:** `Yes` (כי האפליקציה אוספת מידע)

**2. Data types collected:**

לחץ "Add data type" והוסף:

**א. Personal info (מידע אישי):**
- ✅ **Name** - Name
  - Purpose: App functionality
  - Collected: Yes
  - Shared: No
  
- ✅ **Email address** (אם האפליקציה אוספת)
  - Purpose: App functionality
  - Collected: Yes (או No אם לא)
  - Shared: No

**ב. Phone number:**
- ✅ **Phone number**
  - Purpose: App functionality, Analytics
  - Collected: Yes
  - Shared: No

**ג. App activity:**
- ✅ **App interactions**
  - Purpose: Analytics
  - Collected: Yes
  - Shared: No

**3. Data security:**
- ✅ **Is all user data encrypted in transit?** → `Yes`
- ✅ **Can users request that data be deleted?** → `Yes`

**4. Data sharing:**
- **Does your app share data with third parties?** → `No` (או `Yes` אם אתה משתמש ב-Firebase Analytics)

**אם אתה משתמש ב-Firebase:**
- ✅ **Does your app share data with third parties?** → `Yes`
- הוסף: `Google Firebase`
- Data types: רק מה שצריך (לא הכל)

**5. Privacy Policy:**
- הכנס את ה-URL של מדיניות הפרטיות (שמילאת בסעיף 1)

**לאחר מילוי:** לחץ "Save" → "Mark as complete" ✅

---

#### ב. Target audience (קהל יעד)

**לחץ על "Target audience"**

**1. Target age group:**
- **בחר:** `Everyone` או `13+`

**2. Content rating:**
- זה יקבע אוטומטית לפי התשובות שלך

**3. Does your app contain:**
- **Violence:** `No`
- **Sexual content:** `No`
- **Profanity:** `No`
- **Alcohol, tobacco, drugs:** `No`
- **Gambling:** `No`
- **Location sharing:** `No` (או `Yes` אם האפליקציה משתמשת במיקום)
- **User-generated content:** `No` (או `Yes` אם יש גלריה עם תמונות משתמשים)

**לאחר מילוי:** לחץ "Save" ✅

---

#### ג. Content ratings (דירוג תוכן)

**לחץ על "Content ratings"**

זה יתמלא אוטומטית לפי התשובות ב-Target audience, אבל תבדוק:

**1. IARC rating:**
- זה יקבע אוטומטית

**2. Rating summary:**
- בדוק שהדירוג נכון (כנראה "Everyone" או "3+")

**לאחר בדיקה:** לחץ "Save" ✅

---

#### ד. Ads (פרסומות)

**לחץ על "Ads"**

**1. Does your app contain ads?**
- **בחר:** `No` (או `Yes` אם יש פרסומות)

**אם בחרת `No`:** לחץ "Save" ✅

**אם בחרת `Yes`:**
- סמן את סוגי הפרסומות
- הוסף את מדיניות הפרסומות

---

#### ה. News apps (אפליקציות חדשות)

**לחץ על "News apps"**

**1. Is your app a news app?**
- **בחר:** `No`

**לאחר מילוי:** לחץ "Save" ✅

---

#### ו. COVID-19 contact tracing and status apps

**1. Is your app a COVID-19 contact tracing or status app?**
- **בחר:** `No`

**לאחר מילוי:** לחץ "Save" ✅

---

### 4️⃣ Pricing & distribution (תמחור והפצה)

**מיקום:** Pricing & distribution

#### א. Pricing

**1. Price:**
- **בחר:** `Free` (חינם)

**2. In-app products:**
- **בחר:** `No` (או `Yes` אם יש קניות בתוך האפליקציה)

#### ב. Countries/regions (מדינות/אזורים)

**1. Select countries:**
- **בחר:** `All countries` (כל המדינות)
- **או:** בחר מדינות ספציפיות (למשל רק ישראל)

#### ג. Device categories (קטגוריות מכשירים)

**1. Phones:**
- ✅ **סמן:** `Yes`

**2. Tablets:**
- ✅ **סמן:** `Yes` (או `No` אם לא תומך)

#### ד. Program policies (מדיניות התוכנית)

**1. Read and accept:**
- ✅ **Developer Program Policy** - קרא וסמן ✅
- ✅ **US Export Laws** - קרא וסמן ✅
- ✅ **Content Rating** - קרא וסמן ✅

**לאחר מילוי:** לחץ "Save" ✅

---

### 5️⃣ App access (גישה לאפליקציה)

**מיקום:** Setup → App access

**1. Is your app restricted to specific users?**
- **בחר:** `No` (האפליקציה פתוחה לכולם)

**אם בחרת `No`:** לחץ "Save" ✅

**אם בחרת `Yes`:**
- תצטרך להגדיר רשימת משתמשים מורשים

---

### 6️⃣ Release → Production (הפצה)

**מיקום:** Release → Production

**לפני העלאה, ודא:**
- ✅ כל הסעיפים למעלה מולאו
- ✅ יש לך קובץ .aab מוכן

**איך להעלות:**

**אפשרות A: דרך EAS (מומלץ)**
```bash
eas submit --platform android --profile production --latest
```

**אפשרות B: ידנית**
1. לחץ על "Create new release"
2. העלה את קובץ ה-.aab
3. מלא "Release notes" (הערות גרסה):
   ```
   גרסה ראשונה של האפליקציה
   - הזמנת תורים
   - ניהול תורים
   - צפייה בצוות
   - גלריה
   ```
4. לחץ "Save"
5. לחץ "Review release"
6. בדוק הכל ולחץ "Start rollout to Production"

---

## ✅ רשימת בדיקה סופית לפני פרסום

לפני שאתה מפרסם, ודא שכל הסעיפים הבאים מסומנים ב-✅:

- [ ] **Store listing:**
  - [ ] שם האפליקציה
  - [ ] תיאור קצר
  - [ ] תיאור מלא
  - [ ] אייקון (512x512)
  - [ ] צילומי מסך (מינימום 2)
  - [ ] Feature graphic (1024x500)
  - [ ] קטגוריה
  - [ ] פרטי קשר
  - [ ] **Privacy Policy** ✅

- [ ] **Policy → App content:**
  - [ ] **Data Safety** - מולא ומסומן כ-complete ✅
  - [ ] **Target audience** - מולא ✅
  - [ ] **Content ratings** - מולא ✅
  - [ ] **Ads** - מולא ✅
  - [ ] **News apps** - מולא ✅

- [ ] **Pricing & distribution:**
  - [ ] מחיר (חינם)
  - [ ] מדינות הפצה
  - [ ] קטגוריות מכשירים
  - [ ] כל ההסכמים מסומנים ✅

- [ ] **Setup:**
  - [ ] App access - מולא ✅

- [ ] **Release:**
  - [ ] יש קובץ .aab מוכן
  - [ ] Release notes מולאו

**אחרי שכל הסעיפים מסומנים, תוכל לפרסם!** 🚀

---

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


