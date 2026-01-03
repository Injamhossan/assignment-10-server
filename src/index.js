const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./config/db');
require('./config/firebase');


if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in .env');
  process.exit(1);
}
console.log('MONGO_URI loaded successfully (hidden for security)');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in .env');
  process.exit(1);
}
console.log('JWT_SECRET loaded successfully (hidden for security)');
const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://studymate-ih.netlify.app',
  'https://studymate-ih.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/partners', require('./routes/partnersRoutes'));
app.get('/api/test', (req, res) => {
  res.send('API test route is working!');
});

app.get('/', (req, res) => res.send('API running and API Connected'));

const dbConnectionPromise = connectToDatabase(process.env.MONGO_URI)
  .catch(err => {
    console.error('--- FATAL: Initial DB Connection Failed ---');
    console.error(err);
    process.exit(1); 
  });

// Check if running locally or on Vercel
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

if (isVercel) {
  // Vercel serverless function handler
  module.exports = async (req, res) => {
    try {
      await dbConnectionPromise;
      return app(req, res);
    } catch (error) {
      console.error('Unhandled error in request handler:', error);
      res.status(500).send('Internal Server Error');
    }
  };
} else {
  // Local development - start Express server
  const PORT = process.env.PORT || 5000;
  
  dbConnectionPromise.then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

