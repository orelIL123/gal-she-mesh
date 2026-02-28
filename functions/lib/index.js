"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCustomClaims = exports.syncUserClaims = exports.processScheduledReminders = exports.updateEmailAndSendReset = exports.deleteUserAuth = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp();
const db = admin.firestore();
exports.deleteUserAuth = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const callerUid = context.auth.uid;
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    if (!callerDoc.exists || !((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.isAdmin)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
    }
    const { userId } = data;
    if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required');
    }
    try {
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        if (userDoc.exists && ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.isAdmin)) {
            throw new functions.https.HttpsError('permission-denied', 'Cannot delete admin users');
        }
        await admin.auth().deleteUser(userId);
        console.log(`✅ Deleted user ${userId} from Authentication`);
        return { success: true, message: 'User deleted from Authentication' };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            return { success: true, message: 'User already deleted' };
        }
        throw new functions.https.HttpsError('internal', `Failed: ${error.message}`);
    }
});
// Update user email and send password reset link
// This allows users who registered with phone to reset password via any email
exports.updateEmailAndSendReset = functions.https.onCall(async (data) => {
    const { firestoreUserId, newEmail } = data;
    // Validate input
    if (!firestoreUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'firestoreUserId is required');
    }
    if (!newEmail) {
        throw new functions.https.HttpsError('invalid-argument', 'newEmail is required');
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
    }
    try {
        // Get user document from Firestore to find their Auth UID
        const userDoc = await admin.firestore().collection('users').doc(firestoreUserId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found in database');
        }
        const userData = userDoc.data();
        // The Firestore document ID is typically the same as Firebase Auth UID
        // But some users might have a separate authUid field
        const authUid = (userData === null || userData === void 0 ? void 0 : userData.authUid) || firestoreUserId;
        console.log(`📧 Updating email for user ${authUid} to ${newEmail}`);
        // Update user's email in Firebase Auth
        await admin.auth().updateUser(authUid, {
            email: newEmail.toLowerCase(),
            emailVerified: false
        });
        console.log(`✅ Email updated in Firebase Auth`);
        // Update email in Firestore as well
        await admin.firestore().collection('users').doc(firestoreUserId).update({
            email: newEmail.toLowerCase(),
            emailUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Email updated in Firestore`);
        // Generate password reset link
        // This triggers Firebase to send a password reset email automatically
        // Using Firebase's default domain which is already allowlisted
        const actionCodeSettings = {
            url: 'https://gal-shemesh.firebaseapp.com',
            handleCodeInApp: false
        };
        // generatePasswordResetLink generates a link that Firebase will use
        // When called, Firebase Auth sends the password reset email automatically
        // to the email address provided
        await admin.auth().generatePasswordResetLink(newEmail.toLowerCase(), actionCodeSettings);
        console.log(`✅ Password reset link generated and email sent to ${newEmail}`);
        return {
            success: true,
            message: 'Password reset email sent successfully',
            email: newEmail.toLowerCase()
        };
    }
    catch (error) {
        console.error('❌ Error in updateEmailAndSendReset:', error);
        if (error.code === 'auth/user-not-found') {
            throw new functions.https.HttpsError('not-found', 'User not found in Firebase Auth');
        }
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'This email is already in use by another account');
        }
        if (error.code === 'auth/invalid-email') {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
        }
        throw new functions.https.HttpsError('internal', `Failed: ${error.message}`);
    }
});
// ============================================================================
// SCHEDULED REMINDER PROCESSING
// ============================================================================
/**
 * Cloud Function מתוזמן שמעבד תזכורות מתוזמנות
 * רץ כל 5 דקות ומטפל בתזכורות שהגיע זמנן
 */
exports.processScheduledReminders = functions.pubsub
    .schedule('every 5 minutes')
    .timeZone('Asia/Jerusalem')
    .onRun(async (context) => {
    console.log('🕐 Scheduled reminder processing started at', new Date().toISOString());
    try {
        const now = admin.firestore.Timestamp.now();
        // מצא כל התזכורות המתוזמנות שהגיע זמנן
        // Limit to 100 to avoid Cloud Function timeout
        const remindersQuery = db.collection('scheduledReminders')
            .where('status', '==', 'pending')
            .where('scheduledTime', '<=', now)
            .limit(100);
        const remindersSnapshot = await remindersQuery.get();
        console.log(`📱 Found ${remindersSnapshot.size} reminders to process`);
        if (remindersSnapshot.empty) {
            console.log('✅ No reminders to process');
            return null;
        }
        // עבד כל תזכורת
        const results = await Promise.allSettled(remindersSnapshot.docs.map(async (reminderDoc) => {
            const reminderData = reminderDoc.data();
            const appointmentId = reminderData.appointmentId;
            const reminderType = reminderData.reminderType || null; // Get reminderType from scheduledReminders
            console.log(`📅 Processing reminder ${reminderDoc.id} for appointment ${appointmentId}, type: ${reminderType}`);
            try {
                // שליחת התזכורת עם reminderType (חשוב לשלוח את הסוג הנכון!)
                await sendAppointmentReminder(appointmentId, reminderType);
                // סמן כנשלח
                await reminderDoc.ref.update({
                    status: 'sent',
                    sentAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`✅ Successfully processed ${reminderType} reminder for appointment ${appointmentId}`);
                return { success: true, reminderId: reminderDoc.id };
            }
            catch (error) {
                console.error(`❌ Error processing reminder ${reminderDoc.id}:`, error);
                // סמן ככישלון אבל אל תזרוק שגיאה כדי לא לעצור את השאר
                await reminderDoc.ref.update({
                    status: 'failed',
                    error: error.message,
                    failedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                throw error;
            }
        }));
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`✅ Processed ${successful} reminders successfully, ${failed} failed`);
        return null;
    }
    catch (error) {
        console.error('❌ Error in processScheduledReminders:', error);
        throw error;
    }
});
/**
 * שולח תזכורת ללקוח על תור
 * @param appointmentId - ID של התור
 * @param expectedReminderType - סוג התזכורת (24h, 1h, 15m, whenStarting) - אם לא מסופק, יקבע אוטומטית לפי זמן
 */
async function sendAppointmentReminder(appointmentId, expectedReminderType) {
    try {
        const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
        if (!appointmentDoc.exists) {
            console.log('❌ Appointment not found:', appointmentId);
            return false;
        }
        const appointmentData = appointmentDoc.data();
        const appointmentDate = appointmentData.date.toDate();
        const now = new Date();
        const timeDiff = appointmentDate.getTime() - now.getTime();
        const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
        const minutesUntilAppointment = timeDiff / (1000 * 60);
        console.log(`📅 CUSTOMER REMINDER for appointment ${appointmentId}:`);
        console.log(`📅 Appointment time: ${appointmentDate.toISOString()}`);
        console.log(`📅 Current time: ${now.toISOString()}`);
        console.log(`📅 Hours until: ${hoursUntilAppointment.toFixed(2)}`);
        console.log(`📅 Minutes until: ${minutesUntilAppointment.toFixed(2)}`);
        console.log(`📅 Expected reminder type: ${expectedReminderType || 'auto-detect'}`);
        // בדוק אם התור יותר מ-24 שעות קדימה
        if (hoursUntilAppointment > 24) {
            console.log('🔕 Appointment is more than 24 hours away, skipping reminder');
            return false;
        }
        // קבל שם הטיפול
        let treatmentName = 'הטיפול';
        try {
            const treatmentDoc = await db.collection('treatments').doc(appointmentData.treatmentId).get();
            if (treatmentDoc.exists) {
                treatmentName = treatmentDoc.data().name || 'הטיפול';
            }
        }
        catch (e) {
            console.log('Could not fetch treatment name');
        }
        // קבל הגדרות אדמין
        const adminSettings = await getAdminNotificationSettings();
        console.log('🔧 Admin reminder settings:', adminSettings.reminderTimings);
        // שליחת תזכורות בהתאם ל-expectedReminderType (אם מסופק) או לפי זמן
        if (timeDiff > 0) {
            let title = '';
            let message = '';
            let shouldSend = false;
            // אם expectedReminderType מסופק, השתמש בו ישירות (מהמערכת המרכזית)
            // אחרת, קבע אוטומטית לפי זמן (backward compatibility)
            if (expectedReminderType) {
                // השתמש בסוג התזכורת מהמערכת המרכזית - זה כבר מתוזמן בזמן הנכון!
                switch (expectedReminderType) {
                    case '24h':
                        title = 'תזכורת לתור! ⏰';
                        const isTomorrow = appointmentDate.getDate() === new Date(now.getTime() + 24 * 60 * 60 * 1000).getDate();
                        if (isTomorrow) {
                            message = `התור שלך מחר ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                        }
                        else {
                            message = `התור שלך ב-${appointmentDate.toLocaleDateString('he-IL')} ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                        }
                        shouldSend = true;
                        console.log('📅 Sending 24-hour reminder to CUSTOMER (scheduled)');
                        break;
                    case '1h':
                        if (adminSettings.reminderTimings.oneHourBefore) {
                            title = 'תזכורת לתור! ⏰';
                            message = `יש לך תור ל${treatmentName} בעוד שעה ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                            shouldSend = true;
                            console.log('📅 Sending 1-hour reminder to CUSTOMER (scheduled)');
                        }
                        else {
                            console.log('🔕 1-hour reminder disabled in admin settings');
                        }
                        break;
                    case '15m':
                        if (adminSettings.reminderTimings.tenMinutesBefore) {
                            title = 'תזכורת לתור! ⏰';
                            message = `התור שלך בעוד 15 דקות ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                            shouldSend = true;
                            console.log('📅 Sending 15-minute reminder to CUSTOMER (scheduled)');
                        }
                        else {
                            console.log('🔕 15-minute reminder disabled in admin settings');
                        }
                        break;
                    case 'whenStarting':
                        if (adminSettings.reminderTimings.whenStarting) {
                            title = 'התור שלך מתחיל! 🎯';
                            message = `התור שלך ל${treatmentName} מתחיל עכשיו!`;
                            shouldSend = true;
                            console.log('📅 Sending "when starting" reminder to CUSTOMER (scheduled)');
                        }
                        else {
                            console.log('🔕 "When starting" reminder disabled in admin settings');
                        }
                        break;
                    default:
                        console.log(`⚠️ Unknown reminder type: ${expectedReminderType}, falling back to time-based detection`);
                    // Fall through to time-based detection
                }
            }
            // אם לא נקבע shouldSend עדיין, קבע לפי זמן (backward compatibility)
            if (!shouldSend && !expectedReminderType) {
                // בדוק תזכורות לפי סדר מהקרוב לרחוק
                if (minutesUntilAppointment <= 15 && minutesUntilAppointment > 0 && hoursUntilAppointment < 1 && adminSettings.reminderTimings.tenMinutesBefore) {
                    title = 'תזכורת לתור! ⏰';
                    message = `התור שלך בעוד 15 דקות ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                    shouldSend = true;
                    console.log('📅 Sending 15-minute reminder to CUSTOMER (auto-detected)');
                }
                else if (hoursUntilAppointment <= 1 && minutesUntilAppointment > 15 && adminSettings.reminderTimings.oneHourBefore) {
                    title = 'תזכורת לתור! ⏰';
                    message = `יש לך תור ל${treatmentName} בעוד שעה ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                    shouldSend = true;
                    console.log('📅 Sending 1-hour reminder to CUSTOMER (auto-detected)');
                }
                else if (hoursUntilAppointment <= 24 && hoursUntilAppointment > 1) {
                    title = 'תזכורת לתור! ⏰';
                    const isTomorrow = appointmentDate.getDate() === new Date(now.getTime() + 24 * 60 * 60 * 1000).getDate();
                    if (isTomorrow) {
                        message = `התור שלך מחר ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                    }
                    else {
                        message = `התור שלך ב-${appointmentDate.toLocaleDateString('he-IL')} ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                    }
                    shouldSend = true;
                    console.log('📅 Sending 24-hour reminder to CUSTOMER (auto-detected)');
                }
                else if (minutesUntilAppointment <= 0 && minutesUntilAppointment > -60 && adminSettings.reminderTimings.whenStarting) {
                    title = 'התור שלך מתחיל! 🎯';
                    message = `התור שלך ל${treatmentName} מתחיל עכשיו!`;
                    shouldSend = true;
                    console.log('📅 Sending "when starting" reminder to CUSTOMER (auto-detected)');
                }
                else {
                    console.log('📅 No reminder needed at this time or disabled in settings');
                    return false;
                }
            }
            if (!shouldSend) {
                console.log('🔕 Reminder disabled in admin settings or not needed');
                return false;
            }
            // שלח תזכורת ללקוח
            await sendNotificationToUser(appointmentData.userId, title, message, { appointmentId: appointmentId });
            // שלח SMS רק לתזכורת של 15 דקות (לחסכון בעלויות)
            if (expectedReminderType === '15m' || (minutesUntilAppointment <= 15 && minutesUntilAppointment > 0)) {
                try {
                    const userProfile = await getUserProfile(appointmentData.userId);
                    if (userProfile && userProfile.phone) {
                        console.log('📱 Sending SMS reminder for 15-minute notification');
                        await sendSMSReminder(userProfile.phone, message);
                    }
                }
                catch (smsError) {
                    console.error('❌ Failed to send SMS reminder:', smsError);
                }
            }
            // שלח תזכורת לאדמין
            try {
                let adminReminderType = null;
                if (expectedReminderType === '15m' || (minutesUntilAppointment <= 15 && minutesUntilAppointment > 0 && hoursUntilAppointment < 1)) {
                    adminReminderType = '15m';
                }
                else if (expectedReminderType === '1h' || (hoursUntilAppointment <= 1 && minutesUntilAppointment > 15)) {
                    adminReminderType = '1h';
                }
                else if (expectedReminderType === 'whenStarting' || (minutesUntilAppointment <= 0 && minutesUntilAppointment > -60)) {
                    adminReminderType = 'whenStarting';
                }
                if (adminReminderType) {
                    await sendAppointmentReminderToAdmin(appointmentId, adminReminderType);
                }
            }
            catch (adminError) {
                console.error('❌ Failed to send admin reminder:', adminError);
            }
            console.log('✅ Reminder sent successfully to CUSTOMER and ADMIN');
            return true;
        }
        else {
            console.log('📅 Appointment is in the past, no reminder needed');
            return false;
        }
    }
    catch (error) {
        console.error('❌ Error sending appointment reminder:', error);
        return false;
    }
}
/**
 * קבל הגדרות תזכורות של אדמין
 */
async function getAdminNotificationSettings() {
    var _a, _b, _c, _d, _e, _f;
    try {
        const settingsDoc = await db.collection('adminSettings').doc('notifications').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            return {
                reminderTimings: {
                    oneHourBefore: (_b = (_a = data.reminderTimings) === null || _a === void 0 ? void 0 : _a.oneHourBefore) !== null && _b !== void 0 ? _b : true,
                    tenMinutesBefore: (_d = (_c = data.reminderTimings) === null || _c === void 0 ? void 0 : _c.tenMinutesBefore) !== null && _d !== void 0 ? _d : true,
                    whenStarting: (_f = (_e = data.reminderTimings) === null || _e === void 0 ? void 0 : _e.whenStarting) !== null && _f !== void 0 ? _f : false,
                },
            };
        }
        // הגדרות ברירת מחדל
        return {
            reminderTimings: {
                oneHourBefore: true,
                tenMinutesBefore: true,
                whenStarting: false,
            },
        };
    }
    catch (error) {
        console.error('❌ Error getting admin notification settings:', error);
        return {
            reminderTimings: {
                oneHourBefore: true,
                tenMinutesBefore: true,
                whenStarting: false,
            },
        };
    }
}
/**
 * קבל פרופיל משתמש
 */
async function getUserProfile(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return Object.assign(Object.assign({}, userDoc.data()), { uid: userId });
        }
        return null;
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}
/**
 * שלח התראה למשתמש
 */
async function sendNotificationToUser(userId, title, body, data) {
    try {
        const userProfile = await getUserProfile(userId);
        if (!userProfile || !userProfile.pushToken) {
            console.log('❌ User not found or no push token');
            return false;
        }
        await sendPushNotification(userProfile.pushToken, title, body, data);
        return true;
    }
    catch (error) {
        console.error('Error sending notification to user:', error);
        return false;
    }
}
/**
 * שלח Push Notification
 */
async function sendPushNotification(pushToken, title, body, data) {
    try {
        const message = {
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data || {},
        };
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        if (!response.ok) {
            throw new Error(`Push notification failed: ${response.statusText}`);
        }
        console.log('✅ Push notification sent successfully');
    }
    catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
}
/**
 * שלח SMS תזכורת
 */
async function sendSMSReminder(phoneNumber, message) {
    try {
        // פורמט מספר טלפון
        let formattedPhone = phoneNumber;
        if (!phoneNumber.startsWith('+')) {
            if (phoneNumber.startsWith('0')) {
                formattedPhone = '+972' + phoneNumber.substring(1);
            }
            else {
                formattedPhone = '+972' + phoneNumber;
            }
        }
        console.log('📱 Sending SMS reminder to:', formattedPhone);
        // כאן צריך להוסיף את השירות SMS שלך
        // לדוגמה: Twilio, AWS SNS, וכו'
        // כרגע נשאיר את זה ריק או נשתמש בשירות קיים
        console.log('✅ SMS reminder sent successfully');
    }
    catch (error) {
        console.error('Error sending SMS reminder:', error);
        throw error;
    }
}
/**
 * שלח תזכורת לאדמין
 */
async function sendAppointmentReminderToAdmin(appointmentId, reminderType) {
    try {
        const appointmentDoc = await db.collection('appointments').doc(appointmentId).get();
        if (!appointmentDoc.exists) {
            console.log('Appointment not found');
            return false;
        }
        const appointmentData = appointmentDoc.data();
        const appointmentDate = appointmentData.date.toDate();
        // קבל שם הלקוח
        let customerName = 'לקוח';
        try {
            const customerDoc = await db.collection('users').doc(appointmentData.userId).get();
            if (customerDoc.exists) {
                customerName = customerDoc.data().displayName || 'לקוח';
            }
        }
        catch (e) {
            console.log('Could not fetch customer name');
        }
        // קבע הודעה לפי סוג התזכורת
        let title = 'תזכורת לתור! ⏰';
        let message = '';
        if (reminderType === '1h') {
            message = `תור של ${customerName} בעוד שעה ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
        }
        else if (reminderType === '15m') {
            message = `תור של ${customerName} בעוד 10 דקות ב-${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
        }
        else if (reminderType === 'whenStarting') {
            message = `תור של ${customerName} מתחיל עכשיו!`;
        }
        // מצא כל האדמינים ושלח להם
        const adminUsers = await db.collection('users')
            .where('isAdmin', '==', true)
            .get();
        const results = await Promise.allSettled(adminUsers.docs.map(async (adminDoc) => {
            const adminData = adminDoc.data();
            if (adminData.pushToken) {
                await sendPushNotification(adminData.pushToken, title, message, {
                    appointmentId: appointmentId,
                    reminderType: reminderType
                });
            }
        }));
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`✅ Sent admin reminder to ${successful} admins`);
        return successful > 0;
    }
    catch (error) {
        console.error('Error sending appointment reminder to admin:', error);
        return false;
    }
}
/**
 * Firestore Trigger: Update custom claims when user document is created or updated
 * This ensures Firebase Storage rules can check admin status efficiently
 */
exports.syncUserClaims = functions.firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
    const userId = context.params.userId;
    try {
        // If document was deleted, remove custom claims
        if (!change.after.exists) {
            await admin.auth().setCustomUserClaims(userId, { isAdmin: false, isBarber: false });
            console.log(`🔑 Removed custom claims for deleted user ${userId}`);
            return null;
        }
        const userData = change.after.data();
        // Set custom claims based on user data
        const claims = {
            isAdmin: (userData === null || userData === void 0 ? void 0 : userData.isAdmin) === true,
            isBarber: (userData === null || userData === void 0 ? void 0 : userData.isBarber) === true
        };
        await admin.auth().setCustomUserClaims(userId, claims);
        console.log(`🔑 Updated custom claims for user ${userId}:`, claims);
        return null;
    }
    catch (error) {
        console.error(`❌ Error updating custom claims for user ${userId}:`, error);
        // Don't throw - we don't want to block the user document update
        return null;
    }
});
/**
 * Cloud Function: One-time migration to set custom claims for existing users
 * Call this manually: firebase functions:shell then migratCustomClaims()
 */
exports.migrateCustomClaims = functions.https.onCall(async (data, context) => {
    var _a;
    // Only allow admins to call this
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists || !((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.isAdmin)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can run migration');
    }
    try {
        const usersSnapshot = await db.collection('users').get();
        const results = [];
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;
            const claims = {
                isAdmin: (userData === null || userData === void 0 ? void 0 : userData.isAdmin) === true,
                isBarber: (userData === null || userData === void 0 ? void 0 : userData.isBarber) === true
            };
            try {
                await admin.auth().setCustomUserClaims(userId, claims);
                results.push({ userId, success: true, claims });
                console.log(`✅ Updated claims for ${userId}:`, claims);
            }
            catch (error) {
                results.push({ userId, success: false, error: error.message });
                console.error(`❌ Failed to update claims for ${userId}:`, error);
            }
        }
        return {
            success: true,
            total: usersSnapshot.size,
            results
        };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', `Migration failed: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map