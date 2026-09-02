const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { initDB } = require('./config/db');
const { seedDatabase } = require('./db/seedData');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Lazy Database Initialization for Serverless & Standalone
let dbInitialized = false;
let dbInitPromise = null;

async function ensureDbInit() {
  if (dbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        await initDB();
        await seedDatabase();
        dbInitialized = true;
      } catch (err) {
        console.error('[Database] Initialization error:', err);
      }
    })();
  }
  return dbInitPromise;
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB is initialized before processing any request
app.use(async (req, res, next) => {
  try {
    await ensureDbInit();
  } catch (err) {
    console.warn('DB initialization check warning:', err.message);
  }
  next();
});

// Serve Uploaded Files Statically
const bundledUploadsPath = path.join(__dirname, 'uploads');
const tmpUploadsPath = path.join(os.tmpdir(), 'wastewatch_uploads');

if (fs.existsSync(bundledUploadsPath)) {
  app.use('/uploads', express.static(bundledUploadsPath));
}
if (process.env.VERCEL) {
  if (!fs.existsSync(tmpUploadsPath)) {
    try { fs.mkdirSync(tmpUploadsPath, { recursive: true }); } catch (e) {}
  }
  app.use('/uploads', express.static(tmpUploadsPath));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);

// API Root & Health Check
app.get(['/api', '/api/health'], (req, res) => {
  res.json({
    status: 'online',
    service: 'WasteWatch Core API',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'standalone',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled API error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server (only when run directly in standalone mode)
if (!process.env.VERCEL && require.main === module) {
  ensureDbInit().then(() => {
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 WasteWatch Server running on port ${PORT}`);
      console.log(`📡 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });
  }).catch((err) => {
    console.error('Failed to start standalone server:', err);
  });
}

module.exports = app;

