require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./config/db');
require('dotenv').config();
console.log('MONGO_URI from env:', !!process.env.MONGO_URI); // true হলে আছে


const app = express();
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    console.log('Starting server bootstrap...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }
    await connectToDatabase(process.env.MONGO_URI);
    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', require('./routes/authRoutes'));

    app.get('/', (req, res) => res.send('API running'));

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });

    // graceful shutdown
    const shutdown = async () => {
      console.log('Shutdown initiated');
      server.close(() => console.log('HTTP server closed'));
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (err) {
    console.error('Failed to start server — fatal:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

start();
