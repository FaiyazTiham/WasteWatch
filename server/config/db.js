const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const net = require('net');
const os = require('os');
const envPath = fs.existsSync(path.resolve(__dirname, '../../.env'))
  ? path.resolve(__dirname, '../../.env')
  : path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

let dbPool = null;
let isMysqlActive = false;

// Persistent In-Memory / File Storage
const BUNDLED_DATA_FILE = path.join(__dirname, '..', 'data_store.json');
const DATA_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'wastewatch_data_store.json')
  : BUNDLED_DATA_FILE;

class FallbackDB {
  constructor() {
    this.data = {
      users: [],
      categories: [],
      reports: [],
      report_photos: [],
      report_status_logs: [],
      upvotes: [],
      comments: [],
      flags: [],
      notifications: [],
      contact_messages: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else if (fs.existsSync(BUNDLED_DATA_FILE)) {
        const raw = fs.readFileSync(BUNDLED_DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (process.env.VERCEL) {
          try {
            fs.writeFileSync(DATA_FILE, raw, 'utf-8');
          } catch (wErr) {
            console.warn('Fallback store initial /tmp copy warning:', wErr.message);
          }
        }
      }
    } catch (err) {
      console.warn('Fallback store load error, using memory:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Fallback store save error:', err.message);
    }
  }

  getNextId(table) {
    if (!this.data[table] || this.data[table].length === 0) return 1;
    const maxId = this.data[table].reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    return maxId + 1;
  }
}

const fallbackStore = new FallbackDB();

// Quick TCP port check to avoid hanging if local MySQL is not running
function isPortOpen(host, port, timeout = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOpened = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isOpened = true;
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function initDB() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'wastewatch_db';
  const port = Number(process.env.DB_PORT) || 3306;

  const isLocal = host === 'localhost' || host === '127.0.0.1';
  // Allow cloud databases up to 4000ms for network latency; local check gets 500ms
  const checkTimeout = isLocal ? 500 : 4000;
  const isCloudHost = !isLocal;
  const sslOptions = (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' || isCloudHost)
    ? { rejectUnauthorized: false }
    : undefined;

  const portAvailable = await isPortOpen(host, port, checkTimeout);

  if (portAvailable) {
    try {
      // For managed cloud MySQL, CREATE DATABASE may fail if privileges are restricted; that is OK
      try {
        const connection = await mysql.createConnection({
          host,
          user,
          password,
          port,
          ssl: sslOptions,
          connectTimeout: checkTimeout
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        await connection.end();
      } catch (cdErr) {
        // Cloud providers usually don't grant global CREATE DATABASE privileges to app users; proceed safely
      }

      dbPool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true,
        ssl: sslOptions,
        connectTimeout: checkTimeout
      });

      // Quick ping to confirm pool readiness
      const [pingResult] = await dbPool.query('SELECT 1 as alive');
      if (pingResult) {
        isMysqlActive = true;
        console.log(`[Database] Connected to MySQL database: ${database} on ${host}:${port}`);
        await createMysqlTables();
        return true;
      }
    } catch (err) {
      console.log(`[Database] MySQL connection error (${err.message}). Using local persistent database.`);
      isMysqlActive = false;
      return false;
    }
  } else {
    console.log(`[Database] MySQL server not reachable on ${host}:${port}. Using local high-performance persistent engine.`);
    isMysqlActive = false;
    return false;
  }
}

async function createMysqlTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin', 'cleanup_staff') NOT NULL DEFAULT 'user',
      avatar VARCHAR(500) DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      status ENUM('active', 'pending_approval', 'banned') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description VARCHAR(255) DEFAULT NULL,
      icon VARCHAR(50) DEFAULT 'Trash2',
      color VARCHAR(20) DEFAULT '#10B981',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      category_id INT NOT NULL,
      severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
      status ENUM('reported', 'verified', 'assigned', 'in_progress', 'cleaned', 'closed') NOT NULL DEFAULT 'reported',
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      address VARCHAR(255) NOT NULL,
      area_district VARCHAR(100) DEFAULT 'Downtown',
      primary_photo VARCHAR(500) NOT NULL,
      cleaned_photo VARCHAR(500) DEFAULT NULL,
      assigned_to INT DEFAULT NULL,
      verified_at TIMESTAMP NULL DEFAULT NULL,
      cleaned_at TIMESTAMP NULL DEFAULT NULL,
      closed_at TIMESTAMP NULL DEFAULT NULL,
      views_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS report_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      report_id INT NOT NULL,
      photo_url VARCHAR(500) NOT NULL,
      photo_type ENUM('before', 'after', 'progress') DEFAULT 'before',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS report_status_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      report_id INT NOT NULL,
      changed_by_user_id INT NOT NULL,
      from_status VARCHAR(50) DEFAULT NULL,
      to_status VARCHAR(50) NOT NULL,
      notes TEXT DEFAULT NULL,
      photo_url VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS upvotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      report_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_report_upvote (report_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      report_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS flags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      report_id INT NOT NULL,
      user_id INT NOT NULL,
      reason VARCHAR(100) NOT NULL,
      details TEXT DEFAULT NULL,
      status ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'system',
      link_url VARCHAR(255) DEFAULT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      subject VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('new', 'read', 'resolved') DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tables) {
    await dbPool.query(sql);
  }

  try {
    await dbPool.query("ALTER TABLE users MODIFY COLUMN status ENUM('active', 'pending_approval', 'banned') NOT NULL DEFAULT 'active'");
  } catch (err) {
    // Already modified
  }
}

async function query(sql, params = []) {
  if (isMysqlActive && dbPool) {
    const [results] = await dbPool.query(sql, params);
    return results;
  }
  return null;
}

module.exports = {
  initDB,
  query,
  getPool: () => dbPool,
  get isMysqlActive() { return isMysqlActive; },
  fallbackStore
};
