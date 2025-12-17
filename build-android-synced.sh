#!/bin/bash
# סקריפט לבניית Android Production - מסונכרן עם iOS

cd "$(dirname "$0")"

echo "🔄 בודק סנכרון בין iOS ו-Android..."
echo ""

# קריאת גרסאות
IOS_BUILD=$(grep -A 1 '"ios":' app.json | grep '"buildNumber"' | sed 's/.*"buildNumber": "\([^"]*\)".*/\1/')
ANDROID_VERSION_CODE=$(grep '"versionCode"' app.json | sed 's/.*"versionCode": \([0-9]*\).*/\1/')
VERSION=$(grep '"version":' app.json | sed 's/.*"version": "\([^"]*\)".*/\1/')

echo "📱 iOS:"
echo "   - Version: $VERSION"
echo "   - Build Number: $IOS_BUILD"
echo ""
echo "🤖 Android:"
echo "   - Version: $VERSION"
echo "   - Version Code: $ANDROID_VERSION_CODE"
echo ""

if [ "$IOS_BUILD" != "$ANDROID_VERSION_CODE" ]; then
    echo "⚠️  גרסאות לא מסונכרנות!"
    echo "   iOS Build: $IOS_BUILD"
    echo "   Android Version Code: $ANDROID_VERSION_CODE"
    echo ""
    echo "✅ כבר עודכנו ל-$IOS_BUILD"
else
    echo "✅ גרסאות מסונכרנות!"
fi

echo ""
echo "🚀 מתחיל בניית Android Production ל-Google Play Store..."
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
echo "   Platform: Android"
echo "   Profile: Production"
echo "   Build Type: App Bundle (.aab)"
echo "   Version: $VERSION"
echo "   Version Code: $ANDROID_VERSION_CODE (מסונכרן עם iOS Build $IOS_BUILD)"
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
echo "🔄 סנכרון:"
echo "   ✅ iOS Build Number: $IOS_BUILD"
echo "   ✅ Android Version Code: $ANDROID_VERSION_CODE"
echo "   ✅ Version: $VERSION (זהה בשניהם)"

