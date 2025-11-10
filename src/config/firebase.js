const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = path.resolve(__dirname, '../../study-mate-firebase-adminsdk.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  throw error;
}

// Verify Firebase ID Token
async function verifyFirebaseToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error('Invalid Firebase token');
  }
}

// Get user from Firebase by UID
async function getFirebaseUser(uid) {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Firebase user fetch failed:', error.message);
    throw new Error('User not found in Firebase');
  }
}

module.exports = {
  admin,
  verifyFirebaseToken,
  getFirebaseUser
};

