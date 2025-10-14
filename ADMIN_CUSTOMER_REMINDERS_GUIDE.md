# Admin Control for Customer Reminders

## Overview

Admin can now control which reminder notifications customers receive when they book appointments.

## Firestore Structure

### Location: `adminSettings/notifications`

```json
{
  "customerReminderSettings": {
    "enabled": true,          // Global on/off for ALL customer reminders
    "t24hEnabled": true,      // 24 hours before appointment
    "t1hEnabled": true,       // 1 hour before appointment
    "t0Enabled": true         // At appointment time
  }
}
```

## How to Control in Firebase Console

### 1. Open Firebase Console
- Go to https://console.firebase.google.com
- Select your project
- Navigate to Firestore Database

### 2. Navigate to Settings
- Collections → `adminSettings`
- Document → `notifications`

### 3. Edit Customer Reminder Settings

**To disable ALL customer reminders:**
```json
{
  "customerReminderSettings": {
    "enabled": false
  }
}
```

**To disable only 24-hour reminder:**
```json
{
  "customerReminderSettings": {
    "enabled": true,
    "t24hEnabled": false,    // ← Customers won't get 24h reminder
    "t1hEnabled": true,
    "t0Enabled": true
  }
}
```

**To send only appointment-time reminder:**
```json
{
  "customerReminderSettings": {
    "enabled": true,
    "t24hEnabled": false,
    "t1hEnabled": false,
    "t0Enabled": true         // Only this fires
  }
}
```

## Reminder Types

| Setting | When It Fires | Example Message |
|---------|---------------|-----------------|
| `t24hEnabled` | 24 hours before | "התור שלך מחר ב-14:00" |
| `t1hEnabled` | 1 hour before | "התור שלך בעוד שעה ב-14:00" |
| `t0Enabled` | At appointment time | "התור שלך מתחיל עכשיו" |

## Default Settings

If the document doesn't exist, these defaults are used:

```json
{
  "customerReminderSettings": {
    "enabled": true,
    "t24hEnabled": true,
    "t1hEnabled": true,
    "t0Enabled": true
  }
}
```

## Important Notes

1. **Changes take effect immediately** - New appointments will respect the new settings
2. **Existing scheduled reminders are NOT affected** - Only new appointments after the change
3. **If appointment is less than 24h away**, the 24h reminder is automatically skipped regardless of settings

## Examples

### Scenario 1: No 24h Reminders (Customer Feedback)
**Problem:** Customers complain they don't like reminders a day early

**Solution:**
```json
{
  "customerReminderSettings": {
    "enabled": true,
    "t24hEnabled": false,     // Disabled
    "t1hEnabled": true,
    "t0Enabled": true
  }
}
```

**Result:** Customers only get 1h and at-time reminders

### Scenario 2: Only Critical Reminders
**Problem:** You want to minimize notifications

**Solution:**
```json
{
  "customerReminderSettings": {
    "enabled": true,
    "t24hEnabled": false,
    "t1hEnabled": true,        // Most important
    "t0Enabled": false
  }
}
```

**Result:** Customers only get 1h reminder

### Scenario 3: Temporarily Disable All
**Problem:** System maintenance or testing

**Solution:**
```json
{
  "customerReminderSettings": {
    "enabled": false          // Everything off
  }
}
```

**Result:** No customer reminders scheduled

## Future Enhancement: Custom Times

Currently supports fixed times (24h, 1h, 0h).

**Future feature could allow:**
```json
{
  "customerReminderSettings": {
    "enabled": true,
    "customTimes": [
      { "hours": 48, "enabled": true },   // 2 days before
      { "hours": 6, "enabled": true },    // 6 hours before
      { "hours": 0.25, "enabled": true }  // 15 minutes before
    ]
  }
}
```

This requires additional UI work but the backend structure is ready.

## Testing Changes

1. Update settings in Firestore
2. Book a new test appointment
3. Check console logs:
   ```
   🔧 Admin customer reminder settings: { enabled: true, t24hEnabled: false, ... }
   🔕 T-24h reminder disabled by admin
   ✅ Scheduled notification: {appointmentId}:T_MINUS_1H
   ✅ Scheduled notification: {appointmentId}:AT_TIME
   ```

4. Verify only enabled reminders were scheduled:
   ```typescript
   import { getAllScheduledNotifications } from '../services/notifications';
   const notifications = await getAllScheduledNotifications();
   console.log('Scheduled:', notifications);
   ```

## Admin vs Customer Reminders

**Admin Reminders** (`reminderTimings` in same document):
- These are for ADMIN notifications about appointments
- Controlled by: `oneHourBefore`, `tenMinutesBefore`, `whenStarting`

**Customer Reminders** (`customerReminderSettings`):
- These are for CUSTOMER notifications about their appointments
- Controlled by: `t24hEnabled`, `t1hEnabled`, `t0Enabled`

They are separate and independent!

## Support

If you need help setting this up or want custom timing options, refer to:
- `services/notifications.ts` (lines 320-344 for admin settings check)
- `services/firebase.ts` (lines 3383-3399 for settings structure)
