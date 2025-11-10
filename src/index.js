const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./config/db');
// Initialize Firebase Admin SDK
require('./config/firebase');

// Check if MONGO_URI exists without exposing the actual URL
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}
console.log('✅ MONGO_URI loaded successfully (hidden for security)');

// Check if JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in .env');
  process.exit(1);
}
console.log('✅ JWT_SECRET loaded successfully (hidden for security)');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - Allow client-side connections
const corsOptions = {
  origin: process.env.CLIENT_URL || '*', // Allow all origins in development, set specific URL in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

async function start() {
  try {
    console.log('Starting server bootstrap...');
    await connectToDatabase(process.env.MONGO_URI);
    app.use(cors(corsOptions));
    app.use(express.json());

    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/partners', require('./routes/partnersRoutes'));

    app.get('/', (req, res) => res.send('API running'));

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });

      const shutdown = async () => {
      console.log('Shutdown initiated');
      server.close(() => console.log('HTTP server closed'));
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error('Failed to start server — fatal:');
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

start();