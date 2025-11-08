const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const COLLECTION = 'users';

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Provide name, email and password' });

    const db = getDB();
    const users = db.collection(COLLECTION);

    // check existing
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ msg: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: 'user',
      createdAt: new Date()
    };

    const result = await users.insertOne(newUser);

    const userSafe = { id: result.insertedId.toString(), name: newUser.name, email: newUser.email };
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
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Provide email and password' });

    const db = getDB();
    const users = db.collection(COLLECTION);

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const userSafe = { id: user._id.toString(), name: user.name, email: user.email };
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