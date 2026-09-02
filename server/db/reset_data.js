const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function resetAllData() {
  console.log('🔄 Resetting database: removing all profiles & reports, setting Faiyaz as default admin...');

  const passwordHash = await bcrypt.hash('7799fftt', 10);

  const categories = [
    { id: 1, name: 'Household Waste', slug: 'household-waste', description: 'Domestic trash, organic waste, kitchen leftovers & bags', icon: 'Trash2', color: '#10B981' },
    { id: 2, name: 'Plastic & Packaging', slug: 'plastic', description: 'Bottles, single-use bags, packaging materials, styrofoam', icon: 'ShoppingBag', color: '#3B82F6' },
    { id: 3, name: 'Construction Debris', slug: 'construction-waste', description: 'Bricks, concrete rubble, wood tiles, drywall remnants', icon: 'HardHat', color: '#F59E0B' },
    { id: 4, name: 'Industrial Waste', slug: 'industrial-waste', description: 'Chemical drums, metal scraps, rubber tires, toxic containers', icon: 'Factory', color: '#EF4444' },
    { id: 5, name: 'Drain & Sewer Waste', slug: 'drain-sewer', description: 'Clogged storm drains, overflowing sewers, grease runoff', icon: 'Droplets', color: '#8B5CF6' },
    { id: 6, name: 'Roadside Garbage', slug: 'roadside-garbage', description: 'Littered sidewalks, median dumpings, highway roadside piles', icon: 'AlertTriangle', color: '#EC4899' },
    { id: 7, name: 'Water Pollution', slug: 'water-pollution', description: 'Contaminated lakes, floating river trash, coastal canal plastics', icon: 'Waves', color: '#06B6D4' },
    { id: 8, name: 'Other Hazardous Waste', slug: 'other', description: 'Electronic waste, broken glass, batteries, medical materials', icon: 'HelpCircle', color: '#6B7280' }
  ];

  const adminUser = {
    id: 1,
    name: 'Faiyaz',
    email: 'faiyaz@gmail.com',
    password_hash: passwordHash,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'System Administrator & WasteWatch Lead Supervisor',
    phone: '+1 (555) 019-9999',
    status: 'active',
    created_at: new Date().toISOString()
  };

  // 1. Reset JSON Fallback Store
  const freshData = {
    users: [adminUser],
    categories: categories,
    reports: [],
    report_photos: [],
    report_status_logs: [],
    upvotes: [],
    comments: [],
    flags: [],
    notifications: [],
    contact_messages: []
  };

  fs.writeFileSync(path.join(__dirname, '../data_store.json'), JSON.stringify(freshData, null, 2), 'utf-8');
  console.log('✅ Fallback data_store.json reset successfully.');

  // 2. Reset MySQL
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
      database,
      multipleStatements: true
    });

    // Disable foreign key checks to cleanly clear tables
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE flags');
    await connection.query('TRUNCATE TABLE comments');
    await connection.query('TRUNCATE TABLE upvotes');
    await connection.query('TRUNCATE TABLE report_status_logs');
    await connection.query('TRUNCATE TABLE report_photos');
    await connection.query('TRUNCATE TABLE reports');
    await connection.query('TRUNCATE TABLE notifications');
    await connection.query('TRUNCATE TABLE contact_messages');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Insert categories
    for (const c of categories) {
      await connection.query(
        'INSERT INTO categories (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [c.id, c.name, c.slug, c.description, c.icon, c.color]
      );
    }

    // Insert Default Admin Faiyaz
    await connection.query(
      'INSERT INTO users (id, name, email, password_hash, role, avatar, bio, phone, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [adminUser.id, adminUser.name, adminUser.email, adminUser.password_hash, adminUser.role, adminUser.avatar, adminUser.bio, adminUser.phone, adminUser.status, new Date()]
    );

    console.log('✅ MySQL Database wastewatch_db tables cleared and default admin Faiyaz created.');
    await connection.end();
  } catch (err) {
    console.warn('MySQL warning during reset:', err.message);
  }
}

resetAllData();
