const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function restore() {
  console.log('🔄 Restoring MySQL Database from seed.sql...');
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'wastewatch_db';

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    const sqlContent = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await connection.query(sqlContent);
    console.log('✅ MySQL Database wastewatch_db restored successfully with all tables and seed records!');
    await connection.end();
  } catch (err) {
    console.error('❌ Restore failed:', err.message);
  }
}

restore();
