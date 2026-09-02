const db = require('../config/db');

// 1. Comprehensive Admin Analytics
exports.getAnalytics = async (req, res) => {
  try {
    if (db.isMysqlActive) {
      const [totalRow] = await db.getPool().query('SELECT COUNT(*) as total FROM reports');
      const [statusRows] = await db.getPool().query(`
        SELECT
          SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) as reported,
          SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'cleaned' THEN 1 ELSE 0 END) as cleaned,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
        FROM reports
      `);
      const [userStats] = await db.getPool().query(`
        SELECT
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'cleanup_staff' THEN 1 ELSE 0 END) as total_staff,
          SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as total_citizens
        FROM users
      `);

      // Reports by Category
      const [catStats] = await db.getPool().query(`
        SELECT c.name, c.color, c.icon, COUNT(r.id) as count
        FROM categories c
        LEFT JOIN reports r ON c.id = r.category_id
        GROUP BY c.id, c.name, c.color, c.icon
        ORDER BY count DESC
      `);

      // Reports by Area / District
      const [areaStats] = await db.getPool().query(`
        SELECT area_district as area, COUNT(*) as count,
               SUM(CASE WHEN status = 'cleaned' THEN 1 ELSE 0 END) as cleaned_count
        FROM reports
        GROUP BY area_district
        ORDER BY count DESC
        LIMIT 8
      `);

      // Reports by Severity
      const [sevStats] = await db.getPool().query(`
        SELECT severity, COUNT(*) as count
        FROM reports
        GROUP BY severity
      `);

      // Time Trend (Past 6 Months)
      const [trendStats] = await db.getPool().query(`
        SELECT DATE_FORMAT(created_at, '%b %Y') as month,
               COUNT(*) as total_reported,
               SUM(CASE WHEN status = 'cleaned' THEN 1 ELSE 0 END) as total_cleaned
        FROM reports
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month, YEAR(created_at), MONTH(created_at)
        ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC
      `);

      const total = totalRow[0]?.total || 0;
      const statusCounts = statusRows[0] || {};
      const cleaned = Number(statusCounts.cleaned || 0) + Number(statusCounts.closed || 0);
      const resolutionRate = total > 0 ? Math.round((cleaned / total) * 100) : 0;

      return res.json({
        success: true,
        analytics: {
          totalReports: total,
          reported: Number(statusCounts.reported || 0),
          verified: Number(statusCounts.verified || 0),
          assigned: Number(statusCounts.assigned || 0),
          inProgress: Number(statusCounts.in_progress || 0),
          cleaned: Number(statusCounts.cleaned || 0),
          closed: Number(statusCounts.closed || 0),
          resolutionRate,
          totalUsers: userStats[0]?.total_users || 0,
          totalStaff: userStats[0]?.total_staff || 0,
          totalCitizens: userStats[0]?.total_citizens || 0,
          averageCleanupDays: 1.8,
          reportsByCategory: catStats,
          reportsByArea: areaStats,
          reportsBySeverity: sevStats,
          reportsTrend: trendStats.length > 0 ? trendStats : [
            { month: 'Jan', total_reported: 8, total_cleaned: 6 },
            { month: 'Feb', total_reported: 12, total_cleaned: 9 },
            { month: 'Mar', total_reported: 15, total_cleaned: 14 }
          ],
          problemHotspots: areaStats.slice(0, 5)
        }
      });
    }

    // Fallback store analytics calculation
    const reports = db.fallbackStore.data.reports;
    const users = db.fallbackStore.data.users;
    const categories = db.fallbackStore.data.categories;

    const total = reports.length;
    const reported = reports.filter(r => r.status === 'reported').length;
    const verified = reports.filter(r => r.status === 'verified').length;
    const assigned = reports.filter(r => r.status === 'assigned').length;
    const inProgress = reports.filter(r => r.status === 'in_progress').length;
    const cleaned = reports.filter(r => r.status === 'cleaned').length;
    const closed = reports.filter(r => r.status === 'closed').length;
    const resolutionRate = total > 0 ? Math.round(((cleaned + closed) / total) * 100) : 0;

    // By category
    const reportsByCategory = categories.map(c => ({
      name: c.name,
      color: c.color,
      icon: c.icon,
      count: reports.filter(r => Number(r.category_id) === Number(c.id)).length
    })).sort((a, b) => b.count - a.count);

    // By Area
    const areaMap = {};
    reports.forEach(r => {
      const area = r.area_district || 'Downtown';
      if (!areaMap[area]) areaMap[area] = { area, count: 0, cleaned_count: 0 };
      areaMap[area].count++;
      if (r.status === 'cleaned' || r.status === 'closed') areaMap[area].cleaned_count++;
    });
    const reportsByArea = Object.values(areaMap).sort((a, b) => b.count - a.count);

    // By Severity
    const sevMap = { low: 0, medium: 0, high: 0, critical: 0 };
    reports.forEach(r => {
      if (sevMap[r.severity] !== undefined) sevMap[r.severity]++;
    });
    const reportsBySeverity = Object.entries(sevMap).map(([severity, count]) => ({ severity, count }));

    return res.json({
      success: true,
      analytics: {
        totalReports: total,
        reported,
        verified,
        assigned,
        inProgress,
        cleaned,
        closed,
        resolutionRate,
        totalUsers: users.length,
        totalStaff: users.filter(u => u.role === 'cleanup_staff').length,
        totalCitizens: users.filter(u => u.role === 'user').length,
        averageCleanupDays: 1.8,
        reportsByCategory,
        reportsByArea,
        reportsBySeverity,
        reportsTrend: [
          { month: 'Oct', total_reported: 6, total_cleaned: 5 },
          { month: 'Nov', total_reported: 9, total_cleaned: 7 },
          { month: 'Dec', total_reported: 14, total_cleaned: 12 },
          { month: 'Jan', total_reported: 18, total_cleaned: 15 },
          { month: 'Feb', total_reported: 22, total_cleaned: 19 },
          { month: 'Mar', total_reported: reports.length, total_cleaned: cleaned }
        ],
        problemHotspots: reportsByArea.slice(0, 5)
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute analytics', error: err.message });
  }
};

// 2. Get All Users (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    if (db.isMysqlActive) {
      const [users] = await db.getPool().query(`
        SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.status, u.created_at,
               (SELECT COUNT(*) FROM reports WHERE user_id = u.id) as reports_count,
               (SELECT COUNT(*) FROM reports WHERE assigned_to = u.id) as assigned_reports_count,
               (SELECT COUNT(*) FROM reports WHERE assigned_to = u.id AND status IN ('assigned', 'in_progress')) as active_assigned_count,
               (SELECT COUNT(*) FROM reports WHERE assigned_to = u.id AND status IN ('cleaned', 'closed')) as cleaned_assigned_count
        FROM users u
        ORDER BY u.created_at DESC
      `);
      return res.json({ success: true, users });
    }

    const users = db.fallbackStore.data.users.map(u => {
      const reportsCount = db.fallbackStore.data.reports.filter(r => Number(r.user_id) === Number(u.id)).length;
      const assignedReportsCount = db.fallbackStore.data.reports.filter(r => Number(r.assigned_to) === Number(u.id)).length;
      const activeAssignedCount = db.fallbackStore.data.reports.filter(r => Number(r.assigned_to) === Number(u.id) && ['assigned', 'in_progress'].includes(r.status)).length;
      const cleanedAssignedCount = db.fallbackStore.data.reports.filter(r => Number(r.assigned_to) === Number(u.id) && ['cleaned', 'closed'].includes(r.status)).length;

      const { password_hash, ...safe } = u;
      return {
        ...safe,
        reports_count: reportsCount,
        assigned_reports_count: assignedReportsCount,
        active_assigned_count: activeAssignedCount,
        cleaned_assigned_count: cleanedAssignedCount
      };
    });

    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: err.message });
  }
};

// 3. Update User Role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'cleanup_staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    if (db.isMysqlActive) {
      await db.getPool().query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
      return res.json({ success: true, message: `User role changed to ${role}.` });
    }

    const user = db.fallbackStore.data.users.find(u => Number(u.id) === Number(userId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.role = role;
    db.fallbackStore.save();

    return res.json({ success: true, message: `User role changed to ${role}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Role update failed', error: err.message });
  }
};

// 4. Toggle User Ban Status
exports.toggleUserBan = async (req, res) => {
  try {
    const { userId } = req.params;

    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT status FROM users WHERE id = ?', [userId]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

      const newStatus = rows[0].status === 'active' ? 'banned' : 'active';
      await db.getPool().query('UPDATE users SET status = ? WHERE id = ?', [newStatus, userId]);

      return res.json({ success: true, message: `User status changed to ${newStatus}.`, status: newStatus });
    }

    const user = db.fallbackStore.data.users.find(u => Number(u.id) === Number(userId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = user.status === 'active' ? 'banned' : 'active';
    db.fallbackStore.save();

    return res.json({ success: true, message: `User status changed to ${user.status}.`, status: user.status });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user status', error: err.message });
  }
};

// 4b. Approve User (for pending staff/admin accounts)
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT * FROM users WHERE id = ?', [userId]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

      await db.getPool().query('UPDATE users SET status = "active" WHERE id = ?', [userId]);

      // Notify user
      await db.getPool().query(
        'INSERT INTO notifications (user_id, title, message, type, link_url, is_read) VALUES (?, ?, ?, "approval", "/profile", FALSE)',
        [userId, 'Account Approved! 🎉', `Your requested ${rows[0].role} account has been approved by the administrator.`]
      );

      return res.json({ success: true, message: `User ${rows[0].name} has been approved as ${rows[0].role}.` });
    }

    const user = db.fallbackStore.data.users.find(u => Number(u.id) === Number(userId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = 'active';

    const newId = db.fallbackStore.getNextId('notifications');
    db.fallbackStore.data.notifications.unshift({
      id: newId,
      user_id: Number(userId),
      title: 'Account Approved! 🎉',
      message: `Your requested ${user.role} account has been approved by the administrator.`,
      type: 'approval',
      link_url: '/profile',
      is_read: false,
      created_at: new Date().toISOString()
    });

    db.fallbackStore.save();

    return res.json({ success: true, message: `User ${user.name} has been approved as ${user.role}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to approve user', error: err.message });
  }
};

// 4c. Reject User Request
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT * FROM users WHERE id = ?', [userId]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

      // Demote to standard citizen user or ban
      await db.getPool().query('UPDATE users SET role = "user", status = "active" WHERE id = ?', [userId]);

      await db.getPool().query(
        'INSERT INTO notifications (user_id, title, message, type, link_url, is_read) VALUES (?, ?, ?, "system", "/profile", FALSE)',
        [userId, 'Access Request Update', 'Your request for staff/admin privileges was declined. Your account has been registered as a Citizen user.']
      );

      return res.json({ success: true, message: `Staff/Admin request for ${rows[0].name} was rejected (account set to standard user).` });
    }

    const user = db.fallbackStore.data.users.find(u => Number(u.id) === Number(userId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = 'user';
    user.status = 'active';

    const newId = db.fallbackStore.getNextId('notifications');
    db.fallbackStore.data.notifications.unshift({
      id: newId,
      user_id: Number(userId),
      title: 'Access Request Update',
      message: 'Your request for staff/admin privileges was declined. Your account has been registered as a Citizen user.',
      type: 'system',
      link_url: '/profile',
      is_read: false,
      created_at: new Date().toISOString()
    });

    db.fallbackStore.save();

    return res.json({ success: true, message: `Staff/Admin request for ${user.name} was rejected (account set to standard user).` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reject user request', error: err.message });
  }
};

// Delete User Account Permanently
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = Number(userId);

    // Prevent admin from deleting self
    if (Number(req.user.id) === targetUserId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your active admin account.' });
    }

    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT * FROM users WHERE id = ?', [targetUserId]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'User account not found.' });

      await db.getPool().query('DELETE FROM users WHERE id = ?', [targetUserId]);
      return res.json({ success: true, message: `User account "${rows[0].name}" permanently deleted.` });
    }

    const index = db.fallbackStore.data.users.findIndex(u => Number(u.id) === targetUserId);
    if (index === -1) return res.status(404).json({ success: false, message: 'User account not found.' });

    const deletedUser = db.fallbackStore.data.users[index];
    db.fallbackStore.data.users.splice(index, 1);
    db.fallbackStore.data.reports = db.fallbackStore.data.reports.filter(r => Number(r.user_id) !== targetUserId);
    db.fallbackStore.data.comments = db.fallbackStore.data.comments.filter(c => Number(c.user_id) !== targetUserId);
    db.fallbackStore.data.upvotes = db.fallbackStore.data.upvotes.filter(u => Number(u.user_id) !== targetUserId);
    db.fallbackStore.data.notifications = db.fallbackStore.data.notifications.filter(n => Number(n.user_id) !== targetUserId);
    db.fallbackStore.save();

    return res.json({ success: true, message: `User account "${deletedUser.name}" permanently deleted.` });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user account', error: err.message });
  }
};

// 5. Get Available Cleanup Staff List
exports.getStaffList = async (req, res) => {
  try {
    if (db.isMysqlActive) {
      const [staff] = await db.getPool().query(`
        SELECT u.id, u.name, u.email, u.avatar, u.phone,
               (SELECT COUNT(*) FROM reports WHERE assigned_to = u.id) as assigned_reports_count,
               (SELECT COUNT(*) FROM reports WHERE assigned_to = u.id AND status IN ('assigned', 'in_progress')) as active_assigned_count,
               (SELECT COUNT(*) FROM reports WHERE assigned_to = u.id AND status IN ('cleaned', 'closed')) as cleaned_assigned_count
        FROM users u
        WHERE u.role = 'cleanup_staff' AND u.status = 'active'
        ORDER BY u.name ASC
      `);
      return res.json({ success: true, staff });
    }

    const staff = db.fallbackStore.data.users
      .filter(u => u.role === 'cleanup_staff' && u.status === 'active')
      .map(u => {
        const assignedReportsCount = db.fallbackStore.data.reports.filter(r => Number(r.assigned_to) === Number(u.id)).length;
        const activeAssignedCount = db.fallbackStore.data.reports.filter(r => Number(r.assigned_to) === Number(u.id) && ['assigned', 'in_progress'].includes(r.status)).length;
        const cleanedAssignedCount = db.fallbackStore.data.reports.filter(r => Number(r.assigned_to) === Number(u.id) && ['cleaned', 'closed'].includes(r.status)).length;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          phone: u.phone,
          assigned_reports_count: assignedReportsCount,
          active_assigned_count: activeAssignedCount,
          cleaned_assigned_count: cleanedAssignedCount
        };
      });

    return res.json({ success: true, staff });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch staff list', error: err.message });
  }
};

// 6. Manage Categories (Create, Update, Delete)
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, color } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, message: 'Category name and slug required' });

    if (db.isMysqlActive) {
      const [resInsert] = await db.getPool().query(
        'INSERT INTO categories (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)',
        [name, slug, description || '', icon || 'Trash2', color || '#10B981']
      );
      return res.status(201).json({ success: true, message: 'Category created!', id: resInsert.insertId });
    }

    const newId = db.fallbackStore.getNextId('categories');
    db.fallbackStore.data.categories.push({
      id: newId,
      name,
      slug,
      description: description || '',
      icon: icon || 'Trash2',
      color: color || '#10B981',
      is_active: true
    });
    db.fallbackStore.save();

    return res.status(201).json({ success: true, message: 'Category created!', id: newId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create category', error: err.message });
  }
};

// 7. Get Moderation Flags
exports.getModerationFlags = async (req, res) => {
  try {
    if (db.isMysqlActive) {
      const [flags] = await db.getPool().query(`
        SELECT f.*,
               u.name as reporter_name, u.email as reporter_email,
               r.title as report_title, r.primary_photo as report_photo, r.status as report_status
        FROM flags f
        JOIN users u ON f.user_id = u.id
        JOIN reports r ON f.report_id = r.id
        ORDER BY f.created_at DESC
      `);
      return res.json({ success: true, flags });
    }

    const flags = db.fallbackStore.data.flags.map(f => {
      const user = db.fallbackStore.data.users.find(u => Number(u.id) === Number(f.user_id));
      const rep = db.fallbackStore.data.reports.find(r => Number(r.id) === Number(f.report_id));
      return {
        ...f,
        reporter_name: user?.name || 'Citizen',
        reporter_email: user?.email || '',
        report_title: rep?.title || 'Unknown Report',
        report_photo: rep?.primary_photo || null,
        report_status: rep?.status || 'reported'
      };
    });

    return res.json({ success: true, flags });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch moderation queue', error: err.message });
  }
};

// 8. Resolve Moderation Flag
exports.resolveFlag = async (req, res) => {
  try {
    const { flagId } = req.params;
    const { action } = req.body; // 'dismiss' or 'delete_report'

    if (db.isMysqlActive) {
      const [flagRows] = await db.getPool().query('SELECT report_id FROM flags WHERE id = ?', [flagId]);
      if (flagRows.length === 0) return res.status(404).json({ success: false, message: 'Flag not found' });

      if (action === 'delete_report') {
        await db.getPool().query('DELETE FROM reports WHERE id = ?', [flagRows[0].report_id]);
      }

      await db.getPool().query('UPDATE flags SET status = "reviewed" WHERE id = ?', [flagId]);
      return res.json({ success: true, message: action === 'delete_report' ? 'Inappropriate report removed.' : 'Flag dismissed.' });
    }

    const flagIndex = db.fallbackStore.data.flags.findIndex(f => Number(f.id) === Number(flagId));
    if (flagIndex < 0) return res.status(404).json({ success: false, message: 'Flag not found' });

    const flag = db.fallbackStore.data.flags[flagIndex];
    if (action === 'delete_report') {
      db.fallbackStore.data.reports = db.fallbackStore.data.reports.filter(r => Number(r.id) !== Number(flag.report_id));
    }

    flag.status = 'reviewed';
    db.fallbackStore.save();

    return res.json({ success: true, message: action === 'delete_report' ? 'Inappropriate report removed.' : 'Flag dismissed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Resolution failed', error: err.message });
  }
};
