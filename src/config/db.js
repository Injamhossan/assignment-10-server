const { MongoClient } = require('mongodb');

let client;
let db;

async function connectToDatabase(uri, dbName = 'studymate') {
  if (db) return { client, db };
  client = new MongoClient(uri, { maxPoolSize: 10 });
  await client.connect();
  db = client.db(dbName);

 
  await db.collection('users').createIndex({ email: 1 }, { unique: true });

  console.log('✅ MongoDB connected:', db.databaseName);
  return { client, db };
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