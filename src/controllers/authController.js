const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const { verifyFirebaseToken, getFirebaseUser } = require('../config/firebase');

const COLLECTION = 'users';

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, firebaseToken } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Provide name, email and password' });
    }

    // Firebase token is required for registration
    if (!firebaseToken) {
      return res.status(400).json({ msg: 'Firebase token is required for registration' });
    }

    // Verify Firebase token
    let firebaseUser;
    try {
      const decodedToken = await verifyFirebaseToken(firebaseToken);
      firebaseUser = await getFirebaseUser(decodedToken.uid);
    } catch (firebaseError) {
      return res.status(401).json({ msg: 'Invalid Firebase token. User must be registered in Firebase first.' });
    }

    // Check if Firebase user email matches the provided email
    if (firebaseUser.email !== email.toLowerCase()) {
      return res.status(400).json({ msg: 'Email does not match Firebase account' });
    }

    const db = getDB();
    const users = db.collection(COLLECTION);

    // Check if user already exists in MongoDB
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ msg: 'Email already registered in MongoDB' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Create new user in MongoDB users collection
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashed,
      firebaseUID: firebaseUser.uid, // Store Firebase UID for reference
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newUser);

    const userSafe = { 
      id: result.insertedId.toString(), 
      name: newUser.name, 
      email: newUser.email,
      firebaseUID: newUser.firebaseUID
    };
    const token = createToken({ userId: userSafe.id });

    return res.status(201).json({ token, user: userSafe });
  } catch (err) {
    console.error('Register error:', err);
    // handle duplicate key more gracefully
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Email already registered' });
    }
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, firebaseToken } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ msg: 'Provide email and password' });
    }

    // Firebase token is required for login
    if (!firebaseToken) {
      return res.status(400).json({ msg: 'Firebase token is required for login' });
    }

    // Verify Firebase token first
    let firebaseUser;
    try {
      const decodedToken = await verifyFirebaseToken(firebaseToken);
      firebaseUser = await getFirebaseUser(decodedToken.uid);
    } catch (firebaseError) {
      return res.status(401).json({ msg: 'Invalid Firebase token. User must be registered in Firebase first.' });
    }

    // Check if Firebase user email matches the provided email
    if (firebaseUser.email !== email.toLowerCase()) {
      return res.status(400).json({ msg: 'Email does not match Firebase account' });
    }

    const db = getDB();
    const users = db.collection(COLLECTION);

    // Load user from MongoDB users collection
    const user = await users.findOne({ email: email.toLowerCase() });
    
    // If user doesn't exist in MongoDB, they need to register first
    if (!user) {
      return res.status(404).json({ 
        msg: 'User not found. Please register first. User must exist in MongoDB users collection.' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Verify Firebase UID matches (if stored)
    if (user.firebaseUID && user.firebaseUID !== firebaseUser.uid) {
      return res.status(400).json({ msg: 'Firebase UID mismatch' });
    }

    const userSafe = { 
      id: user._id.toString(), 
      name: user.name, 
      email: user.email,
      role: user.role || 'user'
    };
    const token = createToken({ userId: userSafe.id });

    return res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// FIX: Removed the duplicate 'exports.getProfile' function that was here.
// This is the correct version you had.
exports.getProfile = async (req, res) => {
  try {
    const db = getDB();
    const users = db.collection(COLLECTION);
    const userId = req.userId; // set by middleware

    // This use of 'new ObjectId(userId)' is correct for mongodb v7+
    const user = await users.findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.id = user._id.toString();
    delete user._id;
    return res.json({ user });
  } catch (err) {
    console.error('GetProfile error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};