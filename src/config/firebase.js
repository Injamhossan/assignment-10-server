const admin = require('firebase-admin');
try {
  
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!serviceAccountBase64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
  }

  
  const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');

  
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  admin.initializeApp({
   
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('Firebase Admin SDK initialized successfully from env');
} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error.message);
  throw error;
}


async function verifyFirebaseToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error('Invalid Firebase token');
  }
}


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