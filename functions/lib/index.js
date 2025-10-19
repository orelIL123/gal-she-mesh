"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAuth = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
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
//# sourceMappingURL=index.js.map