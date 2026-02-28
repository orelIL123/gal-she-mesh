#!/bin/bash
# סקריפט לבניית Android Production ל-Google Play Store

cd "$(dirname "$0")"

echo "🚀 מתחיל בניית Android Production ל-Google Play Store..."
echo ""
echo "📋 פרטי Build:"
echo "   - Platform: Android"
echo "   - Profile: Production"
echo "   - Build Type: App Bundle (.aab)"
echo "   - Version: 1.0.0"
echo "   - Version Code: 1"
echo "   - Package: com.galshemesh.app"
echo ""

# בדיקה אם EAS CLI מותקן
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI לא מותקן!"
    echo "📦 מתקין EAS CLI..."
    npm install -g eas-cli
fi

# בדיקה אם מחובר ל-Expo
echo "🔐 בודק התחברות ל-Expo..."
if ! eas whoami &> /dev/null; then
    echo "⚠️  לא מחובר ל-Expo. מתחבר..."
    eas login
fi

echo ""
echo "🏗️  מתחיל Build..."
echo "   זה יכול לקחת 15-30 דקות..."
echo ""

# הרצת Build
eas build --platform android --profile production --non-interactive

echo ""
echo "✅ Build הושלם!"
echo ""
echo "📱 השלבים הבאים:"
echo "   1. הורד את ה-.aab file מהקישור שתקבל"
echo "   2. לך ל-Google Play Console"
echo "   3. בחר את האפליקציה שלך"
echo "   4. לך ל-Production → Create new release"
echo "   5. העלה את ה-.aab file"
echo "   6. מלא את Release notes"
echo "   7. Review & Rollout"
echo ""
echo "⚠️  חשוב: לפני Build הבא, עדכן versionCode ב-app.json!"





