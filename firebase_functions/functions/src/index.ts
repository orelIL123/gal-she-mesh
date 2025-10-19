import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function to delete a user from Firebase Authentication
 * This is callable from the app by admin users only
 */
export const deleteUserAuth = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to delete users'
    );
  }

  // Check if the caller is an admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || !callerDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete users'
    );
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId is required'
    );
  }

  try {
    // Check if the user to delete exists and is not an admin
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (userDoc.exists && userDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot delete admin users'
      );
    }

    // Delete from Firebase Authentication
    await admin.auth().deleteUser(userId);
    
    console.log(`✅ Successfully deleted user ${userId} from Authentication`);
    
    return {
      success: true,
      message: `User ${userId} deleted from Authentication successfully`
    };
  } catch (error: any) {
    console.error(`❌ Error deleting user ${userId}:`, error);
    
    // If user not found in Auth, that's okay (might already be deleted)
    if (error.code === 'auth/user-not-found') {
      return {
        success: true,
        message: 'User already deleted from Authentication'
      };
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to delete user: ${error.message}`
    );
  }
});
