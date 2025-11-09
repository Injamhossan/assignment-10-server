const { MongoClient } = require('mongodb');

let client;
let db;

// Extract database name from MongoDB URI if provided
function getDatabaseNameFromURI(uri, defaultName = 'study_mate') {
  try {
    // Check if database name is in environment variable
    if (process.env.DB_NAME) {
      return process.env.DB_NAME;
    }
    
    // Try to extract from URI
    // MongoDB URI format: mongodb+srv://user:pass@host/dbname?options
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    if (match && match[1]) {
      const dbName = match[1];
      // Exclude common query parameter values
      if (dbName !== 'admin' && dbName !== 'test' && dbName.length > 0) {
        return dbName;
      }
    }
  } catch (err) {
    console.warn('Could not parse database name from URI, using default');
  }
  return defaultName;
}

async function connectToDatabase(uri, dbName = null) {
  if (db) return { client, db };
  
  // Get database name from URI or environment variable or use default
  // Default database name is 'study_mate' (with underscore) as shown in MongoDB Compass
  const actualDbName = dbName || getDatabaseNameFromURI(uri, 'study_mate');
  
  console.log('🔌 Connecting to MongoDB...');
  console.log('   Database name:', actualDbName);
  
  client = new MongoClient(uri, { maxPoolSize: 10 });
  
  try {
    await client.connect();
    db = client.db(actualDbName);

    // List all collections for debugging
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('   Available collections:', collectionNames.length > 0 ? collectionNames.join(', ') : 'none');

    // Ensure unique index on users.email (only if collection exists)
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
    } catch (indexError) {
      // Index might already exist or collection doesn't exist yet
      if (indexError.code !== 85 && indexError.code !== 86) {
        // Ignore duplicate index errors
      }
    }

    console.log('✅ MongoDB connected successfully');
    console.log('   Database:', db.databaseName);
    return { client, db };
  } catch (error) {
    // Don't expose the MongoDB URI in error messages
    console.error('❌ MongoDB connection failed');
    console.error('Error:', error.message);
    throw new Error('Failed to connect to database');
  }
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call connectToDatabase first.');
  return db;
}

function closeDB() {
  if (client) return client.close();
  return Promise.resolve();
}

module.exports = { connectToDatabase, getDB, closeDB };