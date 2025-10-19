import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const deleteUserAuth = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || !callerDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users');
  }

  const { userId } = data;
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot delete admin users');
    }

    await admin.auth().deleteUser(userId);
    console.log(`✅ Deleted user ${userId} from Authentication`);
    
    return { success: true, message: 'User deleted from Authentication' };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return { success: true, message: 'User already deleted' };
    }
    throw new functions.https.HttpsError('internal', `Failed: ${error.message}`);
  }
});
