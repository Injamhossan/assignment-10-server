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
    if (!name || !email) {
      return res.status(400).json({ msg: 'Provide name and email' });
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

    // Hash password ONLY if it's provided
    let hashed;
    if (password) {
      // Email/Password registration
      const salt = await bcrypt.genSalt(10);
      hashed = await bcrypt.hash(password, salt);
    } else {
      // Google Sign In registration (no password)
      // We can store a placeholder or 'null'. Using a placeholder.
      hashed = 'social_login_placeholder_hash';
    }

    // Create new user in MongoDB users collection
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashed, // Hashed password ba placeholder
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
    if (!email) {
      return res.status(400).json({ msg: 'Provide email' });
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

    // Verify password ONLY if it's provided
    if (password) {
      // This is an Email/Password login
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
    }
    // If no password is provided (Google Sign In), we skip password check
    // because the firebaseToken verification is enough.

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

exports.updateProfile = async (req, res) => {
  try {
    const { name, password, bio, location, phone } = req.body;
    const userId = req.userId; // authMiddleware theke ashche

    const db = getDB();
    const users = db.collection(COLLECTION);

    // Kon field gulo update kora hobe shegulo toiri kori
    const updatedFields = {
      updatedAt: new Date()
    };

    if (name) updatedFields.name = name;
    if (bio) updatedFields.bio = bio;
    if (location) updatedFields.location = location;
    if (phone) updatedFields.phone = phone;

    // Jodi notun password deya hoy, tobe hash kore update korte hobe
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      updatedFields.password = await bcrypt.hash(password, salt);
    }

    // Database e update operation chalai
    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updatedFields },
      { 
        returnDocument: 'after', // Update korar *porer* document-ti return korbe
        projection: { password: 0 } // Password baad diye data return korbe
      }
    );

    if (!result) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // result object-e ekhon notun user data ache
    const updatedUser = result;
    updatedUser.id = updatedUser._id.toString(); // ID format thik kora
    delete updatedUser._id;

    return res.status(200).json({ 
      user: updatedUser, 
      msg: 'Profile updated successfully' 
    });

  } catch (err) {
    console.error('UpdateProfile error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};