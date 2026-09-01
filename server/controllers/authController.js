const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 1. Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = (role === 'admin' || role === 'cleanup_staff') ? role : 'user';

    // Check existing email
    if (db.isMysqlActive) {
      const [existing] = await db.getPool().query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

      const [result] = await db.getPool().query(
        'INSERT INTO users (name, email, password_hash, role, avatar, bio, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name.trim(), cleanEmail, passwordHash, assignedRole, defaultAvatar, bio || null, phone || null, 'active']
      );

      const newUser = {
        id: result.insertId,
        name: name.trim(),
        email: cleanEmail,
        role: assignedRole,
        avatar: defaultAvatar,
        bio: bio || null,
        phone: phone || null,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const token = generateToken(newUser);
      return res.status(201).json({ success: true, message: 'Account created successfully!', token, user: newUser });
    }

    // Fallback store
    const existing = db.fallbackStore.data.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    const newId = db.fallbackStore.getNextId('users');

    const newUser = {
      id: newId,
      name: name.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      role: assignedRole,
      avatar: defaultAvatar,
      bio: bio || null,
      phone: phone || null,
      status: 'active',
      created_at: new Date().toISOString()
    };

    db.fallbackStore.data.users.push(newUser);
    db.fallbackStore.save();

    const { password_hash, ...safeUser } = newUser;
    const token = generateToken(safeUser);
    return res.status(201).json({ success: true, message: 'Account created successfully!', token, user: safeUser });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
};

// 2. Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = null;
    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
      user = rows[0] || null;
    } else {
      user = db.fallbackStore.data.users.find(u => u.email.toLowerCase() === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated by administrators.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    return res.json({ success: true, message: 'Logged in successfully!', token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
};

// 3. Demo Quick Login
exports.demoLogin = async (req, res) => {
  try {
    const { role } = req.params; // citizen, admin, staff
    let targetEmail = 'citizen@wastewatch.org';
    if (role === 'admin') targetEmail = 'admin@wastewatch.org';
    if (role === 'staff' || role === 'cleanup_staff') targetEmail = 'staff@wastewatch.org';

    let user = null;
    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT * FROM users WHERE email = ?', [targetEmail]);
      user = rows[0];
    } else {
      user = db.fallbackStore.data.users.find(u => u.email === targetEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: `Demo user for role ${role} not found.` });
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    return res.json({ success: true, message: `Logged in as demo ${safeUser.role}!`, token, user: safeUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Demo login error', error: err.message });
  }
};

// 4. Get Current Authenticated User (Profile + Stats)
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    let stats = { totalReports: 0, cleanedReports: 0, totalUpvotesReceived: 0, totalUpvotesGiven: 0 };

    if (db.isMysqlActive) {
      const [repRows] = await db.getPool().query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status = "cleaned" THEN 1 ELSE 0 END) as cleaned FROM reports WHERE user_id = ?',
        [userId]
      );
      const [upvoteGiven] = await db.getPool().query('SELECT COUNT(*) as total FROM upvotes WHERE user_id = ?', [userId]);
      const [upvoteReceived] = await db.getPool().query(
        'SELECT COUNT(u.id) as total FROM upvotes u JOIN reports r ON u.report_id = r.id WHERE r.user_id = ?',
        [userId]
      );

      stats.totalReports = repRows[0]?.total || 0;
      stats.cleanedReports = repRows[0]?.cleaned || 0;
      stats.totalUpvotesGiven = upvoteGiven[0]?.total || 0;
      stats.totalUpvotesReceived = upvoteReceived[0]?.total || 0;
    } else {
      const userReports = db.fallbackStore.data.reports.filter(r => Number(r.user_id) === Number(userId));
      stats.totalReports = userReports.length;
      stats.cleanedReports = userReports.filter(r => r.status === 'cleaned').length;
      stats.totalUpvotesGiven = db.fallbackStore.data.upvotes.filter(u => Number(u.user_id) === Number(userId)).length;
      const userReportIds = new Set(userReports.map(r => Number(r.id)));
      stats.totalUpvotesReceived = db.fallbackStore.data.upvotes.filter(u => userReportIds.has(Number(u.report_id))).length;
    }

    return res.json({ success: true, user: req.user, stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.', error: err.message });
  }
};

// 5. Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, phone, avatar } = req.body;

    let updatedAvatar = avatar || req.user.avatar;
    if (req.file) {
      updatedAvatar = `/uploads/${req.file.filename}`;
    }

    const updatedName = (name && name.trim()) || req.user.name;
    const updatedBio = bio !== undefined ? bio : req.user.bio;
    const updatedPhone = phone !== undefined ? phone : req.user.phone;

    if (db.isMysqlActive) {
      await db.getPool().query(
        'UPDATE users SET name = ?, bio = ?, phone = ?, avatar = ?, updated_at = NOW() WHERE id = ?',
        [updatedName, updatedBio, updatedPhone, updatedAvatar, userId]
      );
    } else {
      const user = db.fallbackStore.data.users.find(u => Number(u.id) === Number(userId));
      if (user) {
        user.name = updatedName;
        user.bio = updatedBio;
        user.phone = updatedPhone;
        user.avatar = updatedAvatar;
        user.updated_at = new Date().toISOString();
        db.fallbackStore.save();
      }
    }

    const updatedUser = {
      ...req.user,
      name: updatedName,
      bio: updatedBio,
      phone: updatedPhone,
      avatar: updatedAvatar
    };

    return res.json({ success: true, message: 'Profile updated successfully!', user: updatedUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating profile.', error: err.message });
  }
};

// 6. Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    let userRecord = null;
    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT * FROM users WHERE id = ?', [userId]);
      userRecord = rows[0];
    } else {
      userRecord = db.fallbackStore.data.users.find(u => Number(u.id) === Number(userId));
    }

    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, userRecord.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    if (db.isMysqlActive) {
      await db.getPool().query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    } else {
      userRecord.password_hash = newHash;
      db.fallbackStore.save();
    }

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error changing password.', error: err.message });
  }
};

// 7. Get My Submitted Reports
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;
    let reports = [];

    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query(
        `SELECT r.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
                (SELECT COUNT(*) FROM upvotes WHERE report_id = r.id) as upvotes_count,
                (SELECT COUNT(*) FROM comments WHERE report_id = r.id) as comments_count
         FROM reports r
         LEFT JOIN categories c ON r.category_id = c.id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
      );
      reports = rows;
    } else {
      reports = db.fallbackStore.data.reports
        .filter(r => Number(r.user_id) === Number(userId))
        .map(r => {
          const cat = db.fallbackStore.data.categories.find(c => Number(c.id) === Number(r.category_id));
          const upvotes_count = db.fallbackStore.data.upvotes.filter(u => Number(u.report_id) === Number(r.id)).length;
          const comments_count = db.fallbackStore.data.comments.filter(c => Number(c.report_id) === Number(r.id)).length;
          return {
            ...r,
            category_name: cat?.name || 'General',
            category_color: cat?.color || '#10B981',
            category_icon: cat?.icon || 'Trash2',
            upvotes_count,
            comments_count
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return res.json({ success: true, reports });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user reports.', error: err.message });
  }
};
