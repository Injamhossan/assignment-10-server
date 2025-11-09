const { getDB } = require('../config/db');

// Debug endpoint - Get database info
exports.getDatabaseInfo = async (req, res) => {
  try {
    const db = getDB();
    const databaseName = db.databaseName;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Get document counts for each collection
    const collectionInfo = await Promise.all(
      collectionNames.map(async (name) => {
        try {
          const count = await db.collection(name).countDocuments({});
          const sampleDoc = await db.collection(name).findOne({});
          return {
            name,
            count,
            hasData: count > 0,
            sampleFields: sampleDoc ? Object.keys(sampleDoc) : []
          };
        } catch (err) {
          return {
            name,
            error: err.message
          };
        }
      })
    );
    
    return res.status(200).json({
      success: true,
      database: databaseName,
      collections: collectionInfo,
      totalCollections: collectionNames.length
    });
  } catch (err) {
    console.error('Debug info error:', err);
    return res.status(500).json({
      success: false,
      msg: 'Error getting database info',
      error: err.message
    });
  }
};

