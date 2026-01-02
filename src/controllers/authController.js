const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyFirebaseToken } = require('../config/firebase');

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, photoURL, firebaseToken } = req.body;
    const db = getDB();
    const users = db.collection('users');

    let verifiedEmail = email;
    let isSocialLogin = false;

    // Verify Firebase Token if provided
    if (firebaseToken) {
        try {
            const decodedToken = await verifyFirebaseToken(firebaseToken);
            verifiedEmail = decodedToken.email;
            isSocialLogin = true;
        } catch (e) {
            return res.status(401).json({ success: false, msg: 'Invalid social login token' });
        }
    }

    // Check if user exists
    const userExists = await users.findOne({ email: verifiedEmail });
    if (userExists) {
        // If it's a social login, we might want to just log them in or return error
        // For register, usually better to say "already exists" or just return the token
        if (isSocialLogin) {
             const token = generateToken(userExists._id);
             return res.status(200).json({
                success: true,
                token,
                user: {
                  _id: userExists._id,
                  name: userExists.name,
                  email: userExists.email,
                  role: userExists.role,
                  photoURL: userExists.photoURL
                }
             });
        }
      return res.status(400).json({
        success: false,
        msg: 'Email already registered'
      });
    }

    // Hash password if provided (not required for social login)
    let hashedPassword = null;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
    } else if (!isSocialLogin) {
        return res.status(400).json({ success: false, msg: 'Password is required' });
    }

    // Create user
    const newUser = {
      name,
      email: verifiedEmail,
      password: hashedPassword,
      photoURL: photoURL || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'user'
    };

    const result = await users.insertOne(newUser);
    const user = await users.findOne({ _id: result.insertedId });

    // Return token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, firebaseToken } = req.body;
    const db = getDB();
    const users = db.collection('users');

    let targetEmail = email;
    let isSocialLogin = false;

    if (firebaseToken) {
        try {
            const decodedToken = await verifyFirebaseToken(firebaseToken);
            targetEmail = decodedToken.email;
            isSocialLogin = true;
        } catch (e) {
             return res.status(401).json({ success: false, msg: 'Invalid social login token' });
        }
    }

    // Check for user
    const user = await users.findOne({ email: targetEmail });
    if (!user) {
      if (isSocialLogin) {
          // If social login and user not found in DB, arguably we could auto-register or return 404
          // Client AuthContext handles 404 by then trying to register. So 404 is correct.
          return res.status(404).json({ success: false, msg: 'User not found' });
      }
      return res.status(400).json({ success: false, msg: 'Invalid credentials' });
    }

    // Check password if standard login
    if (!isSocialLogin) {
        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
          return res.status(400).json({ success: false, msg: 'Invalid credentials' });
        }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        sentRequests: user.sentRequests || []
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        sentRequests: user.sentRequests || []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const db = getDB();
    
    const updatedFields = { updatedAt: new Date() };
    if (name) updatedFields.name = name;
    if (email) updatedFields.email = email;

    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(req.user._id) },
      { $set: updatedFields },
      { returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/me
// @access  Private
exports.deleteProfile = async (req, res) => {
  try {
    const db = getDB();
    await db.collection('users').deleteOne({ _id: new ObjectId(req.user._id) });
    res.status(200).json({ success: true, msg: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Send request
// @route   POST /api/auth/request/send/:partnerId
// @access  Private
exports.sendRequest = async (req, res) => {
  try {
    const { partnerId } = req.params;
    if (!partnerId) return res.status(400).json({ success: false, msg: 'Partner ID required' });

    const db = getDB();
    const users = db.collection('users');

    await users.updateOne(
      { _id: new ObjectId(req.user._id) },
      { $addToSet: { sentRequests: partnerId } }
    );

    res.status(200).json({ success: true, msg: 'Request sent successfully' });
  } catch (err) {
    console.error('sendRequest error:', err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Cancel request
// @route   DELETE /api/auth/request/cancel/:partnerId
// @access  Private
exports.cancelRequest = async (req, res) => {
  try {
    const { partnerId } = req.params;
    if (!partnerId) return res.status(400).json({ success: false, msg: 'Partner ID required' });

    const db = getDB();
    const users = db.collection('users');

    await users.updateOne(
      { _id: new ObjectId(req.user._id) },
      { $pull: { sentRequests: partnerId } }
    );

    res.status(200).json({ success: true, msg: 'Request cancelled successfully' });
  } catch (err) {
    console.error('cancelRequest error:', err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Get requests
// @route   GET /api/auth/requests
// @access  Private
exports.getRequests = async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
    
    res.status(200).json({ success: true, data: user?.sentRequests || [] });
  } catch (err) {
    console.error('getRequests error:', err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};
