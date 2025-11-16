const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const COLLECTION = 'partners';

// GET all partners
exports.getAllPartners = async (req, res) => {
  try {
    const db = getDB();
    const databaseName = db.databaseName;
    const partners = db.collection(COLLECTION);
    
    // Debug: Log database and collection info
    console.log('Fetching partners from:');
    console.log('Database:', databaseName);
    console.log('Collection:', COLLECTION);
    
    // Get total count for debugging
    const totalCount = await partners.countDocuments({});
    console.log('   Total documents in collection:', totalCount);
    
    const allPartners = await partners.find({}).toArray();
    console.log('   Documents fetched:', allPartners.length);
    
    if (allPartners.length === 0) {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log('⚠️  No partners found. Available collections:', collectionNames);
    }
    
    const formattedPartners = allPartners.map(partner => ({
      _id: partner._id ? partner._id.toString() : '',

      email: partner.email || '', 
      image: partner.image || '',
      name: partner.name || '',
      subject: partner.subject || '',
      level: partner.level || '',
      activeStatus: partner.activeStatus || 'Offline',
      rating: typeof partner.rating === 'number' ? partner.rating : (parseFloat(partner.rating) || 0),
      about: partner.about || '',
      location: partner.location || '',
      availability: partner.availability || '',
      requestCount: typeof partner.requestCount === 'number' ? partner.requestCount : 0
    }));
    
    return res.status(200).json({ 
      success: true,
      count: formattedPartners.length,
      database: databaseName,
      collection: COLLECTION,
      data: formattedPartners 
    });
  } catch (err) {
    console.error('Get partners error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching partners',
      error: err.message 
    });
  }
};


exports.getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id || id.length !== 24) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid partner ID format' 
      });
    }
    
    const db = getDB();
    const databaseName = db.databaseName;
    const partners = db.collection(COLLECTION);
    
    console.log(' Fetching partner by ID:');
    console.log('   Database:', databaseName);
    console.log('   Collection:', COLLECTION);
    console.log('   ID:', id);
    
    // Convert string ID to ObjectId
    let partner;
    try {
      partner = await partners.findOne({ _id: new ObjectId(id) });
    } catch (objectIdError) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid partner ID format' 
      });
    }
    
    if (!partner) {
      return res.status(404).json({ 
        success: false,
        msg: 'Partner not found' 
      });
    }
    
    // Format the partner data
    const formattedPartner = {
      _id: partner._id ? partner._id.toString() : '',
      email: partner.email || '', 
      image: partner.image || '',
      name: partner.name || '',
      subject: partner.subject || '',
      level: partner.level || '',
      activeStatus: partner.activeStatus || 'Offline',
      rating: typeof partner.rating === 'number' ? partner.rating : (parseFloat(partner.rating) || 0),
      about: partner.about || '',
      location: partner.location || '',
      availability: partner.availability || '',
      requestCount: typeof partner.requestCount === 'number' ? partner.requestCount : 0,
      createdAt: partner.createdAt || null,
      updatedAt: partner.updatedAt || null
    };
    
    console.log('✅ Partner found:', formattedPartner.name);
    
    return res.status(200).json({ 
      success: true,
      data: formattedPartner 
    });
  } catch (err) {
    console.error('Get partner by ID error:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching partner',
      error: err.message 
    });
  }
};

// POST - Create a new partner
exports.createPartner = async (req, res) => {
  try {

    const { email, image, name, subject, level, activeStatus, rating, about, location, availability } = req.body;
    
    // Validate required fields
    if (!email || !name || !subject || !level) {
      return res.status(400).json({ 
        success: false,
        msg: 'Please provide email, name, subject, and level' 
      });
    }
    
    const db = getDB();
    const databaseName = db.databaseName;
    const partners = db.collection(COLLECTION);

    // Check if partner profile already exists for this email
    const existingPartner = await partners.findOne({ email: email.toLowerCase() });
    if (existingPartner) {
      return res.status(400).json({ 
        success: false,
        msg: 'A partner profile already exists for this email'
      });
    }
    
    console.log('📝 Creating partner in:');
    console.log('   Database:', databaseName);
    console.log('   Collection:', COLLECTION);
    
    // Create new partner object
    const newPartner = {
      email: email.toLowerCase(), 
      image: image || '',
      name: name.trim(),
      subject: subject.trim(),
      level: level.trim(),
      activeStatus: activeStatus || 'Offline',
      rating: rating !== undefined && rating !== null ? parseFloat(rating) || 0 : 0,
      about: about || '',
      location: location || '',
      availability: availability || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert into database
    const result = await partners.insertOne(newPartner);
    
    // Return the created partner
    const createdPartner = {
      _id: result.insertedId.toString(),
      ...newPartner,
      createdAt: newPartner.createdAt,
      updatedAt: newPartner.updatedAt
    };
    
    return res.status(201).json({ 
      success: true,
      msg: 'Partner created successfully',
      data: createdPartner 
    });
  } catch (err) {
    console.error('Create partner error:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Server error while creating partner' 
    });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params; 
    const userId = req.userId; 
    const { image, name, subject, level, activeStatus, about, location, availability } = req.body;

    if (!id || id.length !== 24) {
      return res.status(400).json({ success: false, msg: 'Invalid partner ID' });
    }
    
    const db = getDB();
    const partners = db.collection(COLLECTION);
    const users = db.collection('users'); 
    const loggedInUser = await users.findOne({ _id: new ObjectId(userId) });
    if (!loggedInUser) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

  
    const partnerToUpdate = await partners.findOne({ _id: new ObjectId(id) });
    if (!partnerToUpdate) {
      return res.status(404).json({ success: false, msg: 'Partner profile not found' });
    }
    if (partnerToUpdate.email !== loggedInUser.email) {
      return res.status(403).json({ success: false, msg: 'Authorization denied' });
    }


    const updatedFields = {
      updatedAt: new Date()
    };
    if (name) updatedFields.name = name.trim();
    if (image !== undefined) updatedFields.image = image;
    if (subject) updatedFields.subject = subject.trim();
    if (level) updatedFields.level = level.trim();
    if (activeStatus) updatedFields.activeStatus = activeStatus;
    if (about !== undefined) updatedFields.about = about;
    if (location) updatedFields.location = location;
    if (availability) updatedFields.availability = availability;

    // Perform the update
    const result = await partners.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedFields },
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      msg: 'Partner profile updated successfully',
      data: result
    });

  } catch (err) {
    console.error('Update partner error:', err);
    return res.status(500).json({ 
      success: false,
      msg: 'Server error while updating partner' 
    });
  }
};
