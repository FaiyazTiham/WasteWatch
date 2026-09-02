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

// Helper to notify all active administrators
async function notifyAdmins({ title, message, type = 'approval_request', linkUrl = '/admin/users' }) {
  try {
    if (db.isMysqlActive) {
      const [admins] = await db.getPool().query('SELECT id FROM users WHERE role = "admin" AND status = "active"');
      for (const admin of admins) {
        await db.getPool().query(
          'INSERT INTO notifications (user_id, title, message, type, link_url, is_read) VALUES (?, ?, ?, ?, ?, FALSE)',
          [admin.id, title, message, type, linkUrl]
        );
      }
    } else {
      const admins = db.fallbackStore.data.users.filter(u => u.role === 'admin' && u.status === 'active');
      for (const admin of admins) {
        const newId = db.fallbackStore.getNextId('notifications');
        db.fallbackStore.data.notifications.unshift({
          id: newId,
          user_id: Number(admin.id),
          title,
          message,
          type,
          link_url: linkUrl,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
      db.fallbackStore.save();
    }
  } catch (err) {
    console.warn('Failed to notify admins:', err.message);
  }
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
    const isStaffOrAdmin = assignedRole === 'admin' || assignedRole === 'cleanup_staff';
    const initialStatus = isStaffOrAdmin ? 'pending_approval' : 'active';

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
        [name.trim(), cleanEmail, passwordHash, assignedRole, defaultAvatar, bio || null, phone || null, initialStatus]
      );

      const newUser = {
        id: result.insertId,
        name: name.trim(),
        email: cleanEmail,
        role: assignedRole,
        avatar: defaultAvatar,
        bio: bio || null,
        phone: phone || null,
        status: initialStatus,
        created_at: new Date().toISOString()
      };

      if (isStaffOrAdmin) {
        await notifyAdmins({
          title: 'New Access Approval Request 🛡️',
          message: `${newUser.name} (${newUser.email}) has registered as ${assignedRole === 'admin' ? 'Administrator' : 'Cleanup Staff'} and is waiting for your approval.`,
          type: 'approval_request',
          linkUrl: '/admin/users'
        });

        return res.status(201).json({
          success: true,
          pending_approval: true,
          message: 'Account created! Since you registered for Staff/Admin privileges, current administrators must approve your account before you can log in.',
          user: newUser
        });
      }

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
      status: initialStatus,
      created_at: new Date().toISOString()
    };

    db.fallbackStore.data.users.push(newUser);
    db.fallbackStore.save();

    const { password_hash, ...safeUser } = newUser;

    if (isStaffOrAdmin) {
      await notifyAdmins({
        title: 'New Access Approval Request 🛡️',
        message: `${safeUser.name} (${safeUser.email}) has registered as ${assignedRole === 'admin' ? 'Administrator' : 'Cleanup Staff'} and is waiting for your approval.`,
        type: 'approval_request',
        linkUrl: '/admin/users'
      });

      return res.status(201).json({
        success: true,
        pending_approval: true,
        message: 'Account created! Since you registered for Staff/Admin privileges, current administrators must approve your account before you can log in.',
        user: safeUser
      });
    }

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

    if (user.status === 'pending_approval') {
      await notifyAdmins({
        title: 'Pending Staff/Admin Login Attempt ⚠️',
        message: `${user.name} (${user.email}) attempted to log in as ${user.role} while pending approval.`,
        type: 'approval_request',
        linkUrl: '/admin/users'
      });

      return res.status(403).json({
        success: false,
        pending_approval: true,
        message: 'Your account is pending supervisor approval. Current administrators have been notified to review your account access.'
      });
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

// 3. Demo Quick Login (Disabled)
exports.demoLogin = async (req, res) => {
  return res.status(403).json({ success: false, message: 'Demo login has been disabled.' });
};

// 4. Get Current Authenticated User (Profile + Stats)
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    let stats = { totalReports: 0, cleanedReports: 0, totalUpvotesReceived: 0, totalUpvotesGiven: 0 };

    if (db.isMysqlActive) {
      try {
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
      } catch (sqlErr) {
        console.warn('[getMe] MySQL stats error, using default stats:', sqlErr.message);
      }
    } else {
      const allReports = db.fallbackStore.data.reports || [];
      const allUpvotes = db.fallbackStore.data.upvotes || [];
      const userReports = allReports.filter(r => Number(r.user_id) === Number(userId));
      stats.totalReports = userReports.length;
      stats.cleanedReports = userReports.filter(r => r.status === 'cleaned').length;
      stats.totalUpvotesGiven = allUpvotes.filter(u => Number(u.user_id) === Number(userId)).length;
      const userReportIds = new Set(userReports.map(r => Number(r.id)));
      stats.totalUpvotesReceived = allUpvotes.filter(u => userReportIds.has(Number(u.report_id))).length;
    }

    return res.json({ success: true, user: req.user, stats });
  } catch (err) {
    console.error('getMe error:', err);
    // Return the authenticated req.user even if stats failed
    if (req.user) {
      return res.json({
        success: true,
        user: req.user,
        stats: { totalReports: 0, cleanedReports: 0, totalUpvotesReceived: 0, totalUpvotesGiven: 0 }
      });
    }
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
