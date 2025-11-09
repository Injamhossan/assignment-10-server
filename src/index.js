const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./config/db');

// Check if MONGO_URI exists without exposing the actual URL
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}
console.log('✅ MONGO_URI loaded successfully (hidden for security)');

const app = express();
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    console.log('Starting server bootstrap...');
    await connectToDatabase(process.env.MONGO_URI);
    app.use(cors());
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