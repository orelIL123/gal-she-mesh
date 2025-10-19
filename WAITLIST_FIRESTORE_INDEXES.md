# 🔥 Firestore Indexes Required for Waitlist Feature

## Overview
The waitlist feature requires composite indexes in Firestore to efficiently query waitlist entries.

## Required Indexes

### 1. Query waitlist entries by barber and date
**Collection:** `waitlist`
**Fields:**
- `barberId` (Ascending)
- `date` (Ascending)  
- `createdAt` (Ascending)

**Used in:** `getWaitlistEntriesForDate()` function

### 2. Query user's waitlist entries
**Collection:** `waitlist`
**Fields:**
- `userId` (Ascending)
- `date` (Ascending)

**Used in:** `getUserWaitlistEntries()` function

---

## How to Create These Indexes

### Option 1: Automatic (Recommended - Let Firebase Create Them)
1. Run the app in development mode
2. Try to access the waitlist feature
3. Check the browser console or React Native logs
4. You'll see error messages with **direct links** to create the indexes
5. Click the links and Firebase will auto-create the indexes

**Example error:**
```
Error: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

### Option 2: Manual Creation

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**

#### Index 1:
- Collection ID: `waitlist`
- Fields to index:
  1. Field: `barberId`, Mode: `Ascending`
  2. Field: `date`, Mode: `Ascending`
  3. Field: `createdAt`, Mode: `Ascending`
- Query scopes: `Collection`

#### Index 2:
- Collection ID: `waitlist`
- Fields to index:
  1. Field: `userId`, Mode: `Ascending`
  2. Field: `date`, Mode: `Ascending`
- Query scopes: `Collection`

---

## Testing the Indexes

After creating the indexes:
1. Wait 2-5 minutes for them to build (Firebase will show status)
2. Refresh your app
3. Try the waitlist feature:
   - As a customer: Try to join the waitlist
   - As an admin: Open the waitlist screen

If you see data loading without errors - the indexes are working! ✅

---

## Additional Notes

### Security Rules
You might also want to add Firestore security rules for the waitlist collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Waitlist rules
    match /waitlist/{entryId} {
      // Users can create their own waitlist entries
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid;
      
      // Users can read their own entries
      allow read: if request.auth != null 
                  && (resource.data.userId == request.auth.uid 
                      || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      
      // Users can delete their own entries
      allow delete: if request.auth != null 
                    && (resource.data.userId == request.auth.uid 
                        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      
      // Only admins can update
      allow update: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## Troubleshooting

### If indexes aren't working:
1. Check Firebase Console → Firestore → Indexes
2. Verify index status (should be "Enabled", not "Building" or "Error")
3. Clear app cache and restart
4. Check console for any permission errors

### Common Issues:
- **"Missing index" error**: Click the link in the error to create it
- **"Permission denied" error**: Update security rules
- **Slow queries**: Wait for indexes to finish building (can take 2-5 minutes)

---

## Summary Checklist

- [ ] Create Index 1: `waitlist` (barberId, date, createdAt)
- [ ] Create Index 2: `waitlist` (userId, date)
- [ ] Wait for indexes to build (2-5 minutes)
- [ ] Add Firestore security rules for `waitlist` collection
- [ ] Test customer waitlist join
- [ ] Test admin waitlist view
- [ ] Verify automatic cleanup works

Once all indexes are created and enabled, the waitlist feature will work smoothly! 🚀

