# PR Title
```
feat(scheduling): migrate slot system from 30m → 25m with strict validation, admin/client sync, and comprehensive QA
```

# PR Description

## 🎉 Summary
המערכת כולה עברה ממבנה של 30 דקות ל־25 דקות:
- כל ה־UI (אדמין + לקוח) מציגים רק נקודות על גריד של 25 דקות
- כל ה־DB, מאזינים ולידציות עובדים ב־25 דקות
- תורים ארוכים נתפסים כרצף סלוטים (2×25, 3×25 וכו׳)
- הודעות שגיאה ברורות בעברית מונעות שגיאות כבר ב־UI
- סנכרון בזמן אמת עובד ללקוח ולאדמין
- נתונים היסטוריים נשארים תקינים

## ✅ Key Features
- **Global 25-minute grid**: HH:00, HH:25, HH:50, HH+1:15
- **Strict validation**: רק כפולות של 25, רק על הגריד
- **Manual appointments**: רצף סלוטים פנוי בלבד
- **Block/Unblock**: כל פעולה מתבצעת בטרנזקציה ומיד מסונכרנת
- **Client experience**: רואה רק סלוטים חוקיים ב־25 דקות
- **Error messages**: אחידות בעברית, עם דוגמאות

## 🧪 QA Checklist (Pre-Merge)

### Manual QA
- [x] **חסימה 13:00–13:50** → ✅ חסום ללקוח
- [x] **חסימה לא חוקית 13:00–13:40** → ❌ שגיאה עם חלופות
- [x] **תור ידני 75 דק׳ מ־11:25** → ✅ תופס 11:25–12:40
- [x] **סוף משמרת: ניסיון לקבוע 50 דק׳ ב־15:50** → ❌ שגיאה + חלופות
- [x] **ביטול חסימה 13:00–13:50** → ✅ חוזר זמינות ללקוח
- [x] **Snap לגריד (בחירת 13:07)** → ✅ ננעל ל־13:00/13:25
- [x] **הפסקה 12:00–12:50: טיפול 50 דק׳ מ־11:50** → ❌ נדחה

### Server Validation
- [x] **חסימה/תור ידני רצות בטרנזקציה**: אין double-booking
- [x] **מירוץ קביעות בו־זמנית** → רק אחת מצליחה
- [x] **אינדקסים ב־Firestore** מכסים שאילתות

### UI/UX
- [x] **לקוח ואדמין רואים רק** HH:00/HH:25/HH:50/HH+1:15
- [x] **אין אזכור "30 דקות"** בטקסטים
- [x] **הודעות שגיאה בעברית** אחידה

### Data Hygiene
- [x] **אין טיפולים פעילים** שאינם כפולה של 25
- [x] **דאטה היסטורי לא שובר תצוגה**; עריכה נחסמת/מותאמת

### Observability
- [x] **אירועי אנליטיקה נרשמים**: block_range, manual_appointment, booking_attempt
- [x] **לוגים (Console) עם reason codes**: not_on_grid, not_multiple, overlap

## 🔧 Technical Changes

### Files Modified
1. **`app/constants/scheduling.ts`** - New global scheduling constants
2. **`services/firebase.ts`** - Backend validation and slot generation
3. **`app/screens/BookingScreen.tsx`** - Client booking interface
4. **`app/screens/AdminAppointmentsScreen.tsx`** - Admin appointment management
5. **`app/screens/AdminAvailabilityScreen.tsx`** - Admin availability editor
6. **`app/screens/AdminTreatmentsScreen.tsx`** - Treatment management
7. **`app/screens/AdminStatisticsScreen.tsx`** - Statistics and auto-completion
8. **`scripts/seedData.js`** - Default treatment duration

### Key Implementation Details
- **Slot Size**: Changed from 30 to 25 minutes globally
- **Time Grid**: [0, 25, 50, 75] minutes (75 = next hour:15)
- **Validation**: Strict validation prevents invalid inputs
- **Error Handling**: Clear Hebrew error messages with examples
- **Multi-slot Support**: Longer treatments properly occupy multiple slots
- **Real-time Sync**: All changes reflect immediately across admin/client

## 🚀 Sign-off
כל סעיפי QA סומנו ✅

**מערכת פועלת על גריד 25 דקות מלא, עם סנכרון, ולידציות ושגיאות ברורות.**

### Test Results
- ✅ **TypeScript Compilation**: No errors
- ✅ **Linting**: No errors
- ✅ **Core Functionality**: All 25-minute slot logic working
- ✅ **User Interface**: Both admin and client interfaces updated
- ✅ **Data Consistency**: Database operations and validation working
- ✅ **Cross-Platform Sync**: Real-time updates working correctly

**Ready for production deployment!** 🎉
