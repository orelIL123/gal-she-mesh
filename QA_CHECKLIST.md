# QA Testing Checklist - Notifications & Reminders

## Prerequisites
- [ ] Physical iOS device (notifications don't work on simulator)
- [ ] Physical Android device (optional, but recommended)
- [ ] Updated `projectId` in `services/notifications.ts` line ~140
- [ ] Dependencies installed: `expo-notifications`, `expo-device`

---

## Test Suite A: Logout & Push Token Revocation

### Test A1: Normal Logout Flow
1. [ ] Login to app as customer
2. [ ] Create an appointment 25 hours in future
3. [ ] Verify 3 local reminders scheduled (check logs)
4. [ ] Check Firestore: user document has `expoPushToken` field
5. [ ] Tap "Logout" button
6. [ ] **Expected:**
   - All local notifications cancelled
   - `expoPushToken` field removed from Firestore
   - Notification tray cleared
   - Redirected to auth screen

### Test A2: No Notifications After Logout
1. [ ] Complete Test A1
2. [ ] Wait for time when reminder would fire (or set appointment closer)
3. [ ] **Expected:**
   - No notification appears
   - Device stays silent

### Test A3: Notification Tap While Logged Out
1. [ ] Login and create appointment
2. [ ] Schedule a test notification for 30 seconds in future
3. [ ] Logout immediately
4. [ ] Wait for notification to fire
5. [ ] Tap notification
6. [ ] **Expected:**
   - Redirected to `/auth-choice` (login screen)
   - NOT navigated to protected routes

### Test A4: Re-login After Logout
1. [ ] Complete Test A1
2. [ ] Login again with same account
3. [ ] Check Firestore user document
4. [ ] **Expected:**
   - New `expoPushToken` registered
   - `pushTokenUpdatedAt` updated
   - Previous reminders still cancelled (not restored)

---

## Test Suite B: Appointment Reminders

### Test B1: Create Appointment (30+ hours away)
1. [ ] Login as customer
2. [ ] Create appointment 30+ hours in future
3. [ ] Check developer console logs
4. [ ] **Expected:**
   - "📱 Scheduling LOCAL appointment reminders..."
   - "✅ LOCAL appointment reminders scheduled successfully"
   - 3 notifications scheduled (T-24h, T-1h, T-0)

### Test B2: Create Appointment (2 hours away)
1. [ ] Login as customer
2. [ ] Create appointment 2 hours in future
3. [ ] Check scheduled notifications count
4. [ ] **Expected:**
   - Only 2 reminders scheduled (T-1h, T-0)
   - T-24h skipped (past)

### Test B3: Create Appointment (30 minutes away)
1. [ ] Login as customer
2. [ ] Create appointment 30 minutes in future
3. [ ] Check scheduled notifications
4. [ ] **Expected:**
   - Only 1 reminder scheduled (T-0)
   - T-24h and T-1h skipped (past)

### Test B4: Create Appointment (in the past)
1. [ ] Login as customer
2. [ ] Try to create appointment in past (if UI allows)
3. [ ] **Expected:**
   - No reminders scheduled
   - "⚠️ Appointment is in the past, not scheduling reminders" in logs

### Test B5: Reminder Notification Appears
1. [ ] Create appointment 2 hours in future
2. [ ] Wait for T-1h reminder (1 hour from now)
3. [ ] **Expected:**
   - Notification appears with: "💈 תזכורת לתור"
   - Body shows appointment time
   - Sound and vibration (if enabled)

### Test B6: Tap Reminder Notification
1. [ ] Complete Test B5
2. [ ] Tap the notification when it appears
3. [ ] **Expected:**
   - App opens (if closed)
   - Navigates to profile tab (appointments list)
   - Shows appointment details

---

## Test Suite C: Appointment Modifications

### Test C1: Cancel Appointment
1. [ ] Create appointment with reminders
2. [ ] Verify reminders scheduled
3. [ ] Cancel appointment from profile
4. [ ] Check scheduled notifications
5. [ ] **Expected:**
   - "🔔 Cancelling local notification reminders..." in logs
   - All 3 reminders cancelled
   - No reminders fire later

### Test C2: Delete Appointment (Admin)
1. [ ] Login as admin
2. [ ] Create appointment for customer
3. [ ] Verify reminders scheduled
4. [ ] Delete appointment from admin panel
5. [ ] **Expected:**
   - "✅ Local reminders cancelled on delete" in logs
   - All reminders removed

### Test C3: Update Appointment Time
1. [ ] Create appointment 30 hours in future
2. [ ] Verify 3 reminders scheduled
3. [ ] Update appointment to 2 days in future
4. [ ] **Expected:**
   - Old reminders cancelled
   - New reminders scheduled at new times
   - "✅ Local reminders rescheduled after date update" in logs

### Test C4: Mark Appointment as Completed
1. [ ] Create appointment with reminders
2. [ ] Admin marks appointment as "completed"
3. [ ] **Expected:**
   - All reminders cancelled
   - "Failed to cancel local reminders" or success in logs

---

## Test Suite D: Permissions & Channels

### Test D1: iOS Permission Request
1. [ ] Fresh install on iOS device
2. [ ] Launch app
3. [ ] Login for first time
4. [ ] **Expected:**
   - iOS permission prompt appears
   - "BarberApp Would Like to Send You Notifications"
   - Shows example notification

### Test D2: iOS Permission Denied
1. [ ] Complete Test D1, tap "Don't Allow"
2. [ ] Try to create appointment
3. [ ] **Expected:**
   - App doesn't crash
   - "❌ Notification permissions denied" in logs
   - Graceful handling (no reminders scheduled)

### Test D3: Android Permission (API 33+)
1. [ ] Fresh install on Android 13+ device
2. [ ] Launch app
3. [ ] Login for first time
4. [ ] **Expected:**
   - Android permission prompt appears
   - "Allow BarberApp to send you notifications?"

### Test D4: Android Channel Created
1. [ ] Login on Android device
2. [ ] Go to Settings → Apps → BarberApp → Notifications
3. [ ] **Expected:**
   - "תזכורות תורים" channel exists
   - Channel importance: HIGH
   - Sound and vibration enabled

### Test D5: Notification Priority (Android)
1. [ ] Create appointment with reminder
2. [ ] Wait for reminder to fire
3. [ ] **Expected:**
   - Notification shows as "heads-up" (banner)
   - Plays sound
   - Vibrates
   - High priority behavior

---

## Test Suite E: Edge Cases & Multi-Appointment

### Test E1: Multiple Appointments
1. [ ] Create 5 appointments at different times
2. [ ] Check scheduled notifications count
3. [ ] **Expected:**
   - Up to 15 notifications scheduled (3 per appointment)
   - Each has unique identifier

### Test E2: Cancel Some, Keep Others
1. [ ] Complete Test E1
2. [ ] Cancel 2 out of 5 appointments
3. [ ] Check scheduled notifications
4. [ ] **Expected:**
   - 6 reminders cancelled (2 appointments × 3)
   - 9 reminders remain (3 appointments × 3)

### Test E3: Logout with Multiple Appointments
1. [ ] Complete Test E1 (5 appointments)
2. [ ] Logout
3. [ ] Check scheduled notifications
4. [ ] **Expected:**
   - All 15 reminders cancelled
   - Empty notification list

### Test E4: App Closed
1. [ ] Create appointment 5 minutes in future
2. [ ] Close app completely (swipe away)
3. [ ] Wait for T-0 reminder
4. [ ] **Expected:**
   - Notification still fires
   - Tapping opens app to correct screen

### Test E5: Device Restart
1. [ ] Create appointment 2 hours in future
2. [ ] Restart device
3. [ ] Don't open app
4. [ ] Wait for T-1h reminder
5. [ ] **Expected:**
   - Notification still fires (OS persists scheduled notifications)

### Test E6: Airplane Mode
1. [ ] Create appointment
2. [ ] Enable airplane mode
3. [ ] Wait for reminder time
4. [ ] **Expected:**
   - Notification still fires (local notifications don't need network)

---

## Test Suite F: Auth-Aware Navigation

### Test F1: Notification While Logged In
1. [ ] Login
2. [ ] Create appointment
3. [ ] Wait for reminder
4. [ ] Tap notification
5. [ ] **Expected:**
   - Navigates to `/(tabs)/profile`
   - Shows appointment list

### Test F2: Notification While Logged Out
1. [ ] Login and create appointment
2. [ ] Logout
3. [ ] (If notification somehow fires) Tap it
4. [ ] **Expected:**
   - Redirects to `/auth-choice`
   - Does NOT navigate to profile

### Test F3: Background Auth Check
1. [ ] Login
2. [ ] Create appointment
3. [ ] App in background
4. [ ] Notification fires
5. [ ] Tap notification
6. [ ] **Expected:**
   - Checks `auth.currentUser` correctly
   - Navigates appropriately based on auth state

---

## Test Suite G: Debugging & Validation

### Test G1: Check Scheduled Notifications
Run in console:
```typescript
import { getAllScheduledNotifications } from '../services/notifications';
const notifications = await getAllScheduledNotifications();
console.log('Count:', notifications.length);
console.log('Scheduled:', notifications);
```

**Expected:** Shows all scheduled notifications with IDs and trigger times

### Test G2: Check Push Token
Run in console:
```typescript
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const user = auth.currentUser;
if (user) {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  console.log('Token:', userDoc.data()?.expoPushToken);
}
```

**Expected:** Shows push token or undefined if logged out

### Test G3: Check Permissions
Run in console:
```typescript
import { checkPermissions } from '../services/notifications';
const granted = await checkPermissions();
console.log('Permissions granted:', granted);
```

**Expected:** `true` if granted, `false` if denied

### Test G4: Test Immediate Notification
Run in console:
```typescript
import * as Notifications from 'expo-notifications';

await Notifications.scheduleNotificationAsync({
  content: { title: 'Test', body: 'This is a test' },
  trigger: { seconds: 5 },
});
```

**Expected:** Notification appears in 5 seconds

---

## Final Acceptance Criteria

### Issue A: No pushes after logout ✓
- [ ] After logout, Firestore has NO `expoPushToken` for user
- [ ] After logout, device has NO scheduled local notifications
- [ ] After logout, tapping any notification does NOT enter protected screens

### Issue B: Reminders firing correctly ✓
- [ ] Appointment 30+ hours away → receives T-24h, T-1h, T-0 reminders
- [ ] Appointment 2 hours away → receives T-1h, T-0 reminders
- [ ] Notifications are visible on Android (HIGH channel importance)
- [ ] Notifications play sound and vibrate (if system allows)
- [ ] Permissions requested correctly on iOS and Android 13+
- [ ] Changing/canceling appointment → cancels and reschedules reminders correctly

### General Quality ✓
- [ ] No crashes or errors in console
- [ ] TypeScript compiles without errors
- [ ] App performs smoothly
- [ ] Battery usage is reasonable
- [ ] Works offline (local notifications)
- [ ] Survives device restart

---

## Sign-Off

**Tester Name:** ___________________
**Date:** ___________________
**Devices Tested:**
- iOS: ___________________
- Android: ___________________

**All tests passed:** [ ] YES [ ] NO

**Issues found:**
_____________________________________
_____________________________________
_____________________________________

**Notes:**
_____________________________________
_____________________________________
_____________________________________
