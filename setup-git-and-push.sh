#!/bin/bash
# סקריפט להגדרת Git ו-Push לפרויקט

cd "$(dirname "$0")"

echo "🚀 מתחיל הגדרת Git ו-Push..."

# שלב 1: מחיקת תיקיות ריקות
echo "📁 מוחק תיקיות ריקות..."
if [ -d "components" ] && [ -z "$(ls -A components)" ]; then
  rm -rf components
  echo "✅ נמחקה תיקייה components/"
fi

# שלב 2: הוספת כל השינויים
echo "📝 מוסיף שינויים ל-Git..."
git add -A

# שלב 3: בדיקה אם יש שינויים ל-commit
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️  אין שינויים ל-commit"
else
  echo "💾 עושה commit..."
  git commit -m "Cleanup: Remove unused files and directories

- Remove naor-amar project directory (already deleted)
- Remove firebase_functions duplicate directory (already deleted)
- Remove components/ directory (old unused components)
- Remove all documentation markdown files (except README.md)
- Remove duplicate GoogleService-Info plist files
- Remove duplicate image files (splash.png, icon_booking.png)
- Remove unused files (privacy-policy.html, hooks/icon.png, firebase-debug.log)
- Fix +not-found.tsx to not use ThemedText/ThemedView
- Keep public/ directory for Firebase hosting
- Keep legal/ directory for terms and privacy policy"
  echo "✅ Commit הושלם"
fi

# שלב 4: בדיקה אם remote כבר קיים
if git remote get-url origin > /dev/null 2>&1; then
  echo "🔄 מעדכן remote origin..."
  git remote set-url origin git@github.com:orelIL123/gal-she-mesh.git
else
  echo "➕ מוסיף remote origin..."
  git remote add origin git@github.com:orelIL123/gal-she-mesh.git
fi

# שלב 5: שינוי branch ל-main
echo "🌿 משנה branch ל-main..."
git branch -M main

# שלב 6: Push
echo "⬆️  דוחף ל-GitHub..."
git push -u origin main

echo ""
echo "✅ הושלם! הפרויקט נדחף ל-GitHub:"
echo "   https://github.com/orelIL123/gal-she-mesh"






