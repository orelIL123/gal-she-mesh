# Complete Notification System Implementation Prompt

Use this prompt to implement the same notification system in other apps.

---

## THE PROMPT

You are a senior React Native/Expo engineer and Firebase (Auth/Firestore/FCM) + Expo Notifications expert.

I need you to audit and fix two notification problems in my app.

### Project assumptions (treat these as true unless you find contradictions)
- App: React Native (Expo, managed workflow) with TypeScript.
- Push: expo-notifications (Expo Push service + FCM for Android, APNs for iOS).
- Backend: Firebase Auth + Firestore. Optional Cloud Functions exist or can be added.
- Navigation: expo-router or React Navigation with an auth gate.
- We store a per-user push token in Firestore (e.g., users/{uid}.expoPushToken) and send server pushes by querying that field.
- There is a "Logout" button that calls Firebase signOut().

If any assumption is false, 1) tell me exactly what differs, 2) adapt the fix accordingly.

---

### The two issues to fix

**Issue A — Still receiving pushes after logout**

Symptom: After tapping Logout, the device still receives push notifications. Tapping a notification opens the app and can navigate inside.

Root causes to check:
1. Push token not revoked on logout — expoPushToken remains in Firestore; server keeps sending.
2. Local scheduled reminders not cancelled — device still fires locally scheduled notifications post-logout.
3. Auth gate missing/weak — tapping a push deep-link still routes into protected screens while unauthenticated, or notification handler does not respect auth state.

Required behavior:
- On logout:
  - Remove this device's token from Firestore (set to null or remove it).
  - Cancel all scheduled local notifications on device.
  - Clear any local persisted auth/session state.
- On notification receive or tap:
  - If Auth.currentUser == null, do not navigate to protected screens; send to login or ignore.

**Issue B — Appointment reminders not firing (1h/24h/at-time)**

Symptom: Users don't get the reminders at T-24h, T-1h, and T-0 for booked appointments.

Root causes to check:
1. Permissions not requested/denied.
2. Android channel not created (low importance → no alert).
3. Trigger times computed incorrectly (timezone/UTC math or past dates).
4. Missing scheduling call on create/update appointment, or schedule is being garbage-collected.
5. App reloads and scheduled IDs not persisted for cancel/update logic.

Required behavior:
- On booking an appointment (with a concrete Date), schedule 3 local notifications:
  - T-24h, T-1h, and T-0 (exact appointment time).
- Ensure iOS permission flow and Android channel (HIGH).
- If appointment changes/cancels or user logs out, cancel previously scheduled reminders.
- Use stable, idempotent logic (don't duplicate schedules).

---

### What I want you to do

**1) Codebase discovery**

Find files related to:
- Notifications (e.g., services/notifications.ts or similar).
- Auth flow & logout (e.g., services/firebase.ts, services/authStorage.ts, screens/ProfileScreen.tsx, RootLayout.tsx, or app/_layout.tsx).
- Appointment booking logic (where we create/edit/cancel appointments).
- Navigation/auth guard (e.g., AuthGate, ProtectedRoute, or router middleware).

Produce a quick map of what you found (paths + purpose).

**2) Implement robust notification utilities**

Create/augment a dedicated module (e.g., src/services/notifications.ts) with typed functions:

```typescript
// notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ReminderKind = 'T_MINUS_24H' | 'T_MINUS_1H' | 'AT_TIME';

export interface ReminderSpec {
  id: string;                 // deterministic ID for cancel/update
  when: Date;                 // absolute time
  title: string;
  body: string;
  data?: Record<string, any>; // include appointmentId, barberId, etc.
}

export async function ensurePermissions(): Promise<boolean> { /* request & return granted */ }

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/** Schedule a single absolute-time notification */
export async function scheduleAbsolute(spec: ReminderSpec): Promise<string> {
  await ensureAndroidChannel();
  return Notifications.scheduleNotificationAsync({
    content: { title: spec.title, body: spec.body, data: spec.data },
    trigger: spec.when, // absolute Date
  });
}

/** Cancel by id (store mapping appointmentId -> scheduled ids) */
export async function cancelById(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllLocal(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
```

**3) Push token lifecycle**

In an auth listener (app root), when user logs in and grants notifications, register the device token and write to Firestore:
- Add a `registerPushTokenForUser(uid)` that:
  - Gets the Expo push token via Notifications.getExpoPushTokenAsync().
  - Writes it to users/{uid}.expoPushToken.
  - (Optional) Support multi-device by storing tokens as an array; if so, remove only this device on logout.

On logout:
- `revokePushTokenForUser(uid)` → remove this device's token from Firestore.
- `cancelAllLocal()` to stop reminders.
- Then signOut().

Provide concrete code (TypeScript) for:
- `registerPushTokenForUser(uid: string): Promise<void>`
- `revokePushTokenForUser(uid: string): Promise<void>`
- If we use array tokens, identify this device by installationId (from expo-application) or Device.osInternalBuildId fallback.

**4) Auth-aware notification handling**

In app bootstrap (e.g., RootLayout.tsx or equivalent), set handlers:

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data as any;
  // Read current auth state (import a getter or use a global store)
  const isLoggedIn = getIsAuthenticated(); // implement this accessor
  if (!isLoggedIn) {
    // Route to login and DO NOT navigate to protected routes
    router.replace('/login');
    return;
  }

  // Logged in: navigate based on data (e.g., appointmentId)
  if (data?.appointmentId) {
    router.push(`/appointment/${data.appointmentId}`);
  } else {
    router.push('/'); // safe default
  }
});
```

Ensure getIsAuthenticated() is reliable (e.g., from a central auth store or Firebase listener).

**5) Deterministic scheduling for appointments**

Add a helper used when creating/updating appointments:

```typescript
// appointmentReminders.ts
import { scheduleAbsolute, cancelById, ReminderSpec } from './notifications';

export interface Appointment {
  id: string;
  startsAt: string; // ISO
  barberName?: string;
  shopName?: string;
}

export async function scheduleAppointmentReminders(a: Appointment) {
  const when = new Date(a.startsAt);
  const t24 = new Date(when.getTime() - 24 * 60 * 60 * 1000);
  const t1  = new Date(when.getTime() -  1 * 60 * 60 * 1000);

  const specs: ReminderSpec[] = [
    {
      id: `${a.id}:T_MINUS_24H`,
      when: t24,
      title: '💈 Reminder',
      body: `You have an appointment tomorrow at ${when.toLocaleTimeString()}`,
      data: { appointmentId: a.id, kind: 'T_MINUS_24H' },
    },
    {
      id: `${a.id}:T_MINUS_1H`,
      when: t1,
      title: '💈 Reminder',
      body: `You have an appointment in 1 hour at ${when.toLocaleTimeString()}`,
      data: { appointmentId: a.id, kind: 'T_MINUS_1H' },
    },
    {
      id: `${a.id}:AT_TIME`,
      when,
      title: '💈 It's time!',
      body: `Your appointment starts now`,
      data: { appointmentId: a.id, kind: 'AT_TIME' },
    },
  ];

  // Filter out past triggers to avoid schedule errors
  const futureSpecs = specs.filter(s => s.when.getTime() > Date.now());

  for (const spec of futureSpecs) {
    await scheduleAbsolute(spec);
  }

  // Persist scheduled IDs locally if you want fine-grained cancel/update.
}

export async function cancelAppointmentReminders(appointmentId: string) {
  for (const kind of ['T_MINUS_24H','T_MINUS_1H','AT_TIME']) {
    const id = `${appointmentId}:${kind}`;
    await cancelById(id).catch(() => {});
  }
}
```

Where to call:
- On create appointment → scheduleAppointmentReminders(a).
- On update startsAt → cancelAppointmentReminders(oldId) then scheduleAppointmentReminders(new).
- On cancel appointment → cancelAppointmentReminders(a.id).
- On logout → cancelAllLocal().

**6) Logout flow patch**

Unify logout into a single function that:
1. Loads current uid and device token identity.
2. Calls revokePushTokenForUser(uid).
3. cancelAllLocal().
4. Clears any AsyncStorage auth cache.
5. Calls signOut().
6. Navigates to /login (or root).

Provide final code for that function and wire it to the Logout button.

**7) Strengthen the auth gate**

- Ensure every protected screen checks auth in a top-level guard (route group like (protected) or HOC).
- If unauthenticated, always redirect to /login.
- Verify that notification navigation can't bypass this guard.

**8) Android/iOS platform checks**

- Add a startup ensurePermissions() with a user-friendly prompt. If denied, show a screen explaining how to enable.
- Create the Android channel (HIGH importance) before scheduling anything.
- Confirm we are using absolute Date triggers, not interval or background-unsafe APIs.

**9) BONUS: Admin Control for Customer Reminders**

Add admin settings in Firestore to control which reminders customers receive:

```typescript
// In adminSettings/notifications document
{
  "customerReminderSettings": {
    "enabled": true,        // Global on/off
    "t24hEnabled": true,    // 24h reminder
    "t1hEnabled": true,     // 1h reminder
    "t0Enabled": true       // At-time reminder
  }
}
```

Modify `scheduleAppointmentReminders()` to:
1. Fetch admin settings from Firestore
2. Only schedule reminders that are enabled
3. Log which reminders are skipped due to admin settings

**10) Version Updates**

- Increment app version in app.json (e.g., 1.2.0 → 1.3.0)
- Increment runtimeVersion to match
- Add Android permissions:
  - android.permission.POST_NOTIFICATIONS
  - android.permission.RECEIVE_BOOT_COMPLETED
  - android.permission.VIBRATE
- Update projectId in notifications.ts with actual Expo project ID

---

### Acceptance criteria (must all pass)

1. **After Logout:**
   - Firestore no longer has this device's token under users/{uid} (or it's removed from token array).
   - No local reminders fire anymore (manual test within a minute using a near-future appointment).
   - Tapping any incoming remote push does not enter protected screens while logged out.

2. **When booking an appointment for the future:**
   - I receive three notifications at T-24h, T-1h, and T-0 (where applicable if not in the past).
   - On Android, they are visible (channel HIGH) and audible if system settings allow.
   - Changing/canceling the appointment cancels old schedules and re-schedules the correct ones.

3. **Permissions & UX:**
   - If notifications are denied, we fail gracefully and guide the user to enable them.

4. **Code quality:**
   - TypeScript types in the new services.
   - No dead code paths; functions are referenced and wired.

5. **Admin Control (Bonus):**
   - Admin can disable specific reminder times in Firestore
   - Changes take effect for new appointments
   - Console logs show which reminders are enabled/disabled

---

### Deliverables

1. **List of files** you modified/added with a brief rationale.
2. **The new/updated code blocks** (ready to paste).
3. **A short README snippet:** "Notifications & Reminders – How it works" (setup steps, Android channel, iOS permission, token lifecycle).
4. **A manual QA checklist** I can follow to validate on both iOS and Android (simulators + physical if needed).
5. **Admin control guide** - How to configure customer reminder settings in Firestore.

If you discover any deviation from my assumptions, please start by describing it, then apply the fix that matches the real setup.

Please do not break anything or ruin other parts of the app. Make sure you finish all tasks with no problems.

---

## END OF PROMPT

Copy everything above this line to use in other projects.
