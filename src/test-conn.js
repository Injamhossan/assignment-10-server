// test-conn.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function test() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('No MONGO_URI in .env');
    process.exit(1);
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const admin = client.db().admin();
    const info = await admin.serverStatus();
    console.log('Mongo connected. version:', info.version);
  } catch (err) {
    console.error('Mongo connection failed:');
    console.error(err);
  } finally {
    await client.close();
  }
}
test();
