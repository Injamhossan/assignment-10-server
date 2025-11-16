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
    
    if (!name || !email) {
      return res.status(400).json({ msg: 'Provide name and email' });
    }

 
    if (!firebaseToken) {
      return res.status(400).json({ msg: 'Firebase token is required for registration' });
    }

  
    let firebaseUser;
    try {
      const decodedToken = await verifyFirebaseToken(firebaseToken);
      firebaseUser = await getFirebaseUser(decodedToken.uid);
    } catch (firebaseError) {
      return res.status(401).json({ msg: 'Invalid Firebase token. User must be registered in Firebase first.' });
    }

   
    if (firebaseUser.email !== email.toLowerCase()) {
      return res.status(400).json({ msg: 'Email does not match Firebase account' });
    }

    const db = getDB();
    const users = db.collection(COLLECTION);

    
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ msg: 'Email already registered in MongoDB' });
    }

   
    let hashed;
    if (password) {
     
      const salt = await bcrypt.genSalt(10);
      hashed = await bcrypt.hash(password, salt);
    } else {
      
      hashed = 'social_login_placeholder_hash';
    }

    
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashed, 
      firebaseUID: firebaseUser.uid, 
      role: 'user',
      sentRequests: [], 
      receivedRequests: [], 
      connections: [], 
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newUser);

    const userSafe = { 
      id: result.insertedId.toString(), 
      name: newUser.name, 
      email: newUser.email,
      firebaseUID: newUser.firebaseUID,
      sentRequests: newUser.sentRequests 
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
    
    if (!email) {
      return res.status(400).json({ msg: 'Provide email' });
    }

    if (!firebaseToken) {
      return res.status(400).json({ msg: 'Firebase token is required for login' });
    }


    let firebaseUser;
    try {
      const decodedToken = await verifyFirebaseToken(firebaseToken);
      firebaseUser = await getFirebaseUser(decodedToken.uid);
    } catch (firebaseError) {
      return res.status(401).json({ msg: 'Invalid Firebase token. User must be registered in Firebase first.' });
    }


    if (firebaseUser.email !== email.toLowerCase()) {
      return res.status(400).json({ msg: 'Email does not match Firebase account' });
    }

    const db = getDB();
    const users = db.collection(COLLECTION);


    const user = await users.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ 
        msg: 'User not found. Please register first. User must exist in MongoDB users collection.' 
      });
    }

  
    if (password) {

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
    }
  
    if (user.firebaseUID && user.firebaseUID !== firebaseUser.uid) {
      return res.status(400).json({ msg: 'Firebase UID mismatch' });
    }

    const userSafe = { 
      id: user._id.toString(), 
      name: user.name, 
      email: user.email,
      role: user.role || 'user',
      sentRequests: user.sentRequests || [] 
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
    const userId = req.userId; 

    
    const user = await users.findOne(
      { _id: new ObjectId(userId) }, 
      { projection: { password: 0 } } 
    );

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
    const { name, password, bio, location, phone, photoURL, interests, education } = req.body;
    const userId = req.userId; 
    const db = getDB();
    const users = db.collection(COLLECTION);

   
    const updatedFields = {
      updatedAt: new Date()
    };

    if (name) updatedFields.name = name;
    if (bio) updatedFields.bio = bio;
    if (location) updatedFields.location = location;
    if (phone) updatedFields.phone = phone;
    if (photoURL) updatedFields.photoURL = photoURL;
    if (interests) updatedFields.interests = interests;
    if (education) updatedFields.education = education;


    
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
        returnDocument: 'after', 
        projection: { password: 0 } 
      }
    );

    if (!result) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // result object-e ekhon notun user data ache
    const updatedUser = result;
    updatedUser.id = updatedUser._id.toString(); 
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

exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.userId; 
    const db = getDB();
    const users = db.collection(COLLECTION);
    const partners = db.collection('partners'); 
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const userEmail = user.email;

    await users.deleteOne({ _id: new ObjectId(userId) });

    if (userEmail) {
      await partners.deleteOne({ email: userEmail });
    }

    return res.status(200).json({ 
      msg: 'User and associated partner profile deleted successfully' 
    });

  } catch (err)
 {
    console.error('DeleteProfile error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.sendRequest = async (req, res) => {
  try {
    const { partnerId } = req.params; 
    const userId = req.userId; 

    if (!partnerId || partnerId.length !== 24) {
      return res.status(400).json({ msg: 'Invalid Partner ID' });
    }
    
    if (partnerId === userId) {
      return res.status(400).json({ msg: 'You cannot send a request to yourself' });
    }

    const db = getDB();
    const users = db.collection(COLLECTION);
    const partners = db.collection('partners');
    const requests = db.collection('requests');


    // Check if request already sent in user's sentRequests array
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // First, try to find partner by ID in partners collection
    let partner = await partners.findOne({ _id: new ObjectId(partnerId) });
    let partnerUser;
    let receiverUserId;

    if (partner && partner.email) {
      // Partner found, get user by email
      partnerUser = await users.findOne({ email: partner.email });
      if (partnerUser) {
        receiverUserId = partnerUser._id.toString();
      } else {
        // Partner profile exists but user not found by email
        // Try to find user directly by ID (for demo users or edge cases)
        partnerUser = await users.findOne({ _id: new ObjectId(partnerId) });
        if (!partnerUser) {
          return res.status(404).json({ msg: 'Partner user not found for this partner profile' });
        }
        receiverUserId = partnerId;
      }
    } else {
      // Partner not found in partners collection, try to find user directly by ID
      // This handles demo users and cases where partnerId is actually a user ID
      partnerUser = await users.findOne({ _id: new ObjectId(partnerId) });
      if (!partnerUser) {
        return res.status(404).json({ msg: 'Partner user not found' });
      }
      receiverUserId = partnerId;
    }

    // Check if request already sent
    if (user.sentRequests && user.sentRequests.some(id => id.toString() === receiverUserId)) {
      return res.status(200).json({ msg: 'Request already sent' });
    }

    // Check if request already exists in requests collection
    const existingRequest = await requests.findOne({
      senderId: new ObjectId(userId),
      receiverId: new ObjectId(receiverUserId)
    });

    if (existingRequest) {
      return res.status(200).json({ msg: 'Request already sent' });
    }

    // Create request document in requests collection
    const requestDocument = {
      senderId: new ObjectId(userId),
      receiverId: new ObjectId(receiverUserId),
      senderName: user.name || '',
      receiverName: partnerUser.name || '',
      status: 'pending', // pending, accepted, rejected, cancelled
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const requestResult = await requests.insertOne(requestDocument);

    // Update sender's sentRequests array
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { sentRequests: new ObjectId(receiverUserId) } } 
    );

    // Update receiver's receivedRequests array
    await users.updateOne(
      { _id: new ObjectId(receiverUserId) },
      { $addToSet: { receivedRequests: new ObjectId(userId) } } 
    );

    // Increment partner request count using $inc operator
    if (partnerUser.email) {
      await partners.updateOne(
        { email: partnerUser.email },
        { 
          $inc: { requestCount: 1 },
          $setOnInsert: {
            email: partnerUser.email,
            name: partnerUser.name || '',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    return res.status(200).json({ 
      msg: 'Request sent successfully',
      requestId: requestResult.insertedId.toString()
    });

  } catch (err) {
    console.error('SendRequest error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const { partnerId } = req.params; 
    const userId = req.userId;

    if (!partnerId || partnerId.length !== 24) {
      return res.status(400).json({ msg: 'Invalid Partner ID' });
    }

    const db = getDB();
    const users = db.collection(COLLECTION);
    const partners = db.collection('partners');
    const requests = db.collection('requests');

    // First, try to find partner by ID in partners collection
    let partner = await partners.findOne({ _id: new ObjectId(partnerId) });
    let partnerUser;
    let receiverUserId;

    if (partner && partner.email) {
      // Partner found, get user by email
      partnerUser = await users.findOne({ email: partner.email });
      if (partnerUser) {
        receiverUserId = partnerUser._id.toString();
      } else {
        // Partner profile exists but user not found by email
        // Try to find user directly by ID (for demo users or edge cases)
        partnerUser = await users.findOne({ _id: new ObjectId(partnerId) });
        if (!partnerUser) {
          return res.status(404).json({ msg: 'Partner user not found for this partner profile' });
        }
        receiverUserId = partnerId;
      }
    } else {
      // Partner not found in partners collection, try to find user directly by ID
      // This handles demo users and cases where partnerId is actually a user ID
      partnerUser = await users.findOne({ _id: new ObjectId(partnerId) });
      if (!partnerUser) {
        return res.status(404).json({ msg: 'Partner user not found' });
      }
      receiverUserId = partnerId;
    }
    
    // Delete request from requests collection
    const deleteResult = await requests.deleteOne({
      senderId: new ObjectId(userId),
      receiverId: new ObjectId(receiverUserId)
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ msg: 'Request not found' });
    }
    
    // Remove request from sender's sentRequests array
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { sentRequests: new ObjectId(receiverUserId) } } 
    );

    // Remove request from receiver's receivedRequests array
    await users.updateOne(
      { _id: new ObjectId(receiverUserId) },
      { $pull: { receivedRequests: new ObjectId(userId) } } 
    );
    
    // Decrement partner request count using $inc operator
    if (partnerUser && partnerUser.email) {
      await partners.updateOne(
        { email: partnerUser.email },
        { $inc: { requestCount: -1 } }
      );
    }

    return res.status(200).json({ msg: 'Request cancelled successfully' });

  } catch (err) {
    console.error('CancelRequest error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// GET - Get all requests (sent and received)
exports.getRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query; // 'sent', 'received', or 'all' (default)

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const db = getDB();
    const requests = db.collection('requests');
    const users = db.collection(COLLECTION);

    let query = {};
    
    // Filter based on type
    if (type === 'sent') {
      query = { senderId: new ObjectId(userId) };
    } else if (type === 'received') {
      query = { receiverId: new ObjectId(userId) };
    } else {
      // Get both sent and received requests
      query = {
        $or: [
          { senderId: new ObjectId(userId) },
          { receiverId: new ObjectId(userId) }
        ]
      };
    }

    // Fetch requests from database
    const allRequests = await requests.find(query).sort({ createdAt: -1 }).toArray();

    // Format the requests with user details
    const formattedRequests = await Promise.all(
      allRequests.map(async (request) => {
        // Get sender details
        const sender = await users.findOne(
          { _id: request.senderId },
          { projection: { name: 1, email: 1, _id: 1 } }
        );

        // Get receiver details
        const receiver = await users.findOne(
          { _id: request.receiverId },
          { projection: { name: 1, email: 1, _id: 1 } }
        );

        return {
          _id: request._id.toString(),
          requestId: request._id.toString(),
          senderId: request.senderId.toString(),
          receiverId: request.receiverId.toString(),
          senderName: sender?.name || request.senderName || '',
          receiverName: receiver?.name || request.receiverName || '',
          senderEmail: sender?.email || '',
          receiverEmail: receiver?.email || '',
          status: request.status || 'pending',
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          isSentByMe: request.senderId.toString() === userId,
          isReceivedByMe: request.receiverId.toString() === userId
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      type: type || 'all',
      data: formattedRequests
    });

  } catch (err) {
    console.error('GetRequests error:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching requests',
      error: err.message 
    });
  }
};
