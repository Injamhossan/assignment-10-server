const { MongoClient } = require('mongodb');

let client;
let db;


function getDatabaseNameFromURI(uri, defaultName = 'study_mate') {
  try {
    
    if (process.env.DB_NAME) {
      return process.env.DB_NAME;
    }
    
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    if (match && match[1]) {
      const dbName = match[1];
      
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

  const actualDbName = dbName || getDatabaseNameFromURI(uri, 'study_mate');
  
  console.log('🔌 Connecting to MongoDB...');
  console.log('   Database name:', actualDbName);
  
  client = new MongoClient(uri, { maxPoolSize: 10 });
  
  try {
    await client.connect();
    db = client.db(actualDbName);

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('   Available collections:', collectionNames.length > 0 ? collectionNames.join(', ') : 'none');

   
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
    } catch (indexError) {
   
      if (indexError.code !== 85 && indexError.code !== 86) {
       
      }
    }

    console.log(' MongoDB connected successfully');
    console.log('   Database:', db.databaseName);
    return { client, db };
  } catch (error) {
 
    console.error(' MongoDB connection failed');
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