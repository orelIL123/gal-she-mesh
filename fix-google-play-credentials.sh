#!/bin/bash
# סקריפט לתיקון הגדרות Google Play Console

cd "$(dirname "$0")"

echo "🔧 תיקון הגדרות Google Play Console"
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
echo "📋 מה אנחנו הולכים לעשות:"
echo "   1. לבדוק את ה-credentials הנוכחיים"
echo "   2. להסיר credentials ישנים (אם יש)"
echo "   3. להגדיר credentials חדשים"
echo ""

read -p "האם אתה רוצה להמשיך? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "בוטל."
    exit 1
fi

echo ""
echo "🔍 בודק credentials נוכחיים..."
eas credentials

echo ""
echo "📝 הוראות להמשך:"
echo ""
echo "1. אם יש credentials ישנים - הסר אותם:"
echo "   eas credentials → Android → Remove credentials"
echo ""
echo "2. צור Service Account חדש ב-Google Play Console:"
echo "   - לך ל: https://play.google.com/console"
echo "   - Settings → API access → Create new service account"
echo "   - הורד את ה-JSON key"
echo ""
echo "3. הגדר credentials חדשים:"
echo "   eas credentials → Android → Google Play Service Account"
echo "   בחר: Set up a new service account"
echo "   העתק את תוכן ה-JSON key"
echo ""
echo "4. בדוק את החיבור:"
echo "   eas submit --platform android --profile production --latest"
echo ""
echo "📖 לפרטים נוספים, ראה: GOOGLE_PLAY_SETUP.md"





