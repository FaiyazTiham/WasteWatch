const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function updateAdminPassword() {
  console.log('🔒 Updating Faiyaz password to 7799fftt...');
  const newHash = await bcrypt.hash('7799fftt', 10);

  // 1. Update data_store.json
  const jsonPath = path.join(__dirname, '../data_store.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    data.users = data.users.map(u => u.email === 'faiyaz@gmail.com' ? { ...u, password_hash: newHash } : u);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✅ Fallback store password updated.');
  }

  // 2. Update MySQL
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'wastewatch_db';

  try {
    const connection = await mysql.createConnection({ host, port, user, password, database });
    await connection.query('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, 'faiyaz@gmail.com']);
    console.log('✅ MySQL password updated for faiyaz@gmail.com.');
    await connection.end();
  } catch (err) {
    console.warn('MySQL warning:', err.message);
  }
}

updateAdminPassword();
