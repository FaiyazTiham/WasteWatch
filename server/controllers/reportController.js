const db = require('../config/db');

// Helper to create notifications
async function createNotification({ userId, title, message, type = 'system', linkUrl = null }) {
  if (!userId) return;
  try {
    if (db.isMysqlActive) {
      await db.getPool().query(
        'INSERT INTO notifications (user_id, title, message, type, link_url, is_read) VALUES (?, ?, ?, ?, ?, FALSE)',
        [userId, title, message, type, linkUrl]
      );
    } else {
      const newId = db.fallbackStore.getNextId('notifications');
      db.fallbackStore.data.notifications.unshift({
        id: newId,
        user_id: Number(userId),
        title,
        message,
        type,
        link_url: linkUrl,
        is_read: false,
        created_at: new Date().toISOString()
      });
      db.fallbackStore.save();
    }
  } catch (e) {
    console.warn('Failed to send notification:', e.message);
  }
}

// Get Public Homepage Statistics (Live real counts)
exports.getPublicStats = async (req, res) => {
  try {
    if (db.isMysqlActive) {
      const [repRows] = await db.getPool().query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status IN ('cleaned', 'closed') THEN 1 ELSE 0 END) as cleaned,
          SUM(CASE WHEN status IN ('in_progress', 'assigned') THEN 1 ELSE 0 END) as in_progress
        FROM reports
      `);

      const [userRows] = await db.getPool().query(`
        SELECT COUNT(*) as total FROM users WHERE status = 'active'
      `);

      return res.json({
        success: true,
        stats: {
          total: repRows[0]?.total || 0,
          cleaned: repRows[0]?.cleaned || 0,
          inProgress: repRows[0]?.in_progress || 0,
          activeUsers: userRows[0]?.total || 0
        }
      });
    }

    const reports = db.fallbackStore.data.reports || [];
    const users = db.fallbackStore.data.users || [];

    const total = reports.length;
    const cleaned = reports.filter(r => r.status === 'cleaned' || r.status === 'closed').length;
    const inProgress = reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length;
    const activeUsers = users.filter(u => u.status === 'active').length;

    return res.json({
      success: true,
      stats: {
        total,
        cleaned,
        inProgress,
        activeUsers
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: err.message });
  }
};

// 1. Get All Reports with Advanced Filters
exports.getReports = async (req, res) => {
  try {
    const {
      category,
      status,
      severity,
      search,
      district,
      sort = 'newest',
      assigned_to,
      page = 1,
      limit = 50
    } = req.query;

    const currentUserId = req.user ? req.user.id : null;

    if (db.isMysqlActive) {
      let conditions = ['1=1'];
      const params = [];

      if (category && category !== 'all') {
        conditions.push('(c.slug = ? OR c.id = ?)');
        params.push(category, isNaN(category) ? -1 : Number(category));
      }
      if (status && status !== 'all') {
        conditions.push('r.status = ?');
        params.push(status);
      }
      if (severity && severity !== 'all') {
        conditions.push('r.severity = ?');
        params.push(severity);
      }
      if (district && district !== 'all') {
        conditions.push('r.area_district LIKE ?');
        params.push(`%${district}%`);
      }
      if (assigned_to && assigned_to !== 'all') {
        conditions.push('r.assigned_to = ?');
        params.push(Number(assigned_to));
      }
      if (search && search.trim()) {
        conditions.push('(r.title LIKE ? OR r.description LIKE ? OR r.address LIKE ? OR r.area_district LIKE ?)');
        const s = `%${search.trim()}%`;
        params.push(s, s, s, s);
      }

      let orderBy = 'r.created_at DESC';
      if (sort === 'popular') {
        orderBy = 'upvotes_count DESC, r.created_at DESC';
      } else if (sort === 'oldest') {
        orderBy = 'r.created_at ASC';
      } else if (sort === 'severity') {
        orderBy = "FIELD(r.severity, 'critical', 'high', 'medium', 'low'), r.created_at DESC";
      }

      const offset = (Number(page) - 1) * Number(limit);

      const querySql = `
        SELECT r.*,
               u.name as reporter_name, u.avatar as reporter_avatar,
               c.name as category_name, c.slug as category_slug, c.color as category_color, c.icon as category_icon,
               (SELECT COUNT(*) FROM upvotes WHERE report_id = r.id) as upvotes_count,
               (SELECT COUNT(*) FROM comments WHERE report_id = r.id) as comments_count,
               ${currentUserId ? '(SELECT COUNT(*) > 0 FROM upvotes WHERE report_id = r.id AND user_id = ' + Number(currentUserId) + ')' : '0'} as has_upvoted
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      params.push(Number(limit), Number(offset));
      const [reports] = await db.getPool().query(querySql, params);

      return res.json({ success: true, count: reports.length, reports });
    }

    // Fallback In-Memory / JSON Store
    let result = db.fallbackStore.data.reports.map(r => {
      const user = db.fallbackStore.data.users.find(u => Number(u.id) === Number(r.user_id));
      const categoryItem = db.fallbackStore.data.categories.find(c => Number(c.id) === Number(r.category_id));
      const upvotesCount = db.fallbackStore.data.upvotes.filter(u => Number(u.report_id) === Number(r.id)).length;
      const commentsCount = db.fallbackStore.data.comments.filter(c => Number(c.report_id) === Number(r.id)).length;
      const hasUpvoted = currentUserId ? db.fallbackStore.data.upvotes.some(u => Number(u.report_id) === Number(r.id) && Number(u.user_id) === Number(currentUserId)) : false;

      return {
        ...r,
        reporter_name: user ? user.name : 'Citizen',
        reporter_avatar: user ? user.avatar : null,
        category_name: categoryItem ? categoryItem.name : 'Other',
        category_slug: categoryItem ? categoryItem.slug : 'other',
        category_color: categoryItem ? categoryItem.color : '#10B981',
        category_icon: categoryItem ? categoryItem.icon : 'Trash2',
        upvotes_count: upvotesCount,
        comments_count: commentsCount,
        has_upvoted: hasUpvoted
      };
    });

    // Apply filters
    if (category && category !== 'all') {
      result = result.filter(r => r.category_slug === category || String(r.category_id) === String(category));
    }
    if (status && status !== 'all') {
      result = result.filter(r => r.status === status);
    }
    if (severity && severity !== 'all') {
      result = result.filter(r => r.severity === severity);
    }
    if (district && district !== 'all') {
      result = result.filter(r => r.area_district?.toLowerCase().includes(district.toLowerCase()));
    }
    if (assigned_to && assigned_to !== 'all') {
      result = result.filter(r => Number(r.assigned_to) === Number(assigned_to));
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.area_district?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === 'popular') {
      result.sort((a, b) => b.upvotes_count - a.upvotes_count || new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sort === 'severity') {
      const weights = { critical: 4, high: 3, medium: 2, low: 1 };
      result.sort((a, b) => (weights[b.severity] || 0) - (weights[a.severity] || 0) || new Date(b.created_at) - new Date(a.created_at));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return res.json({ success: true, count: result.length, reports: result });
  } catch (err) {
    console.error('getReports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports', error: err.message });
  }
};

// 2. Get Single Report Details
exports.getReportById = async (req, res) => {
  try {
    const reportId = req.params.id;
    if (isNaN(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID.' });
    }
    const currentUserId = req.user ? req.user.id : null;

    if (db.isMysqlActive) {
      // Increment views
      await db.getPool().query('UPDATE reports SET views_count = views_count + 1 WHERE id = ?', [reportId]);

      const [rows] = await db.getPool().query(
        `SELECT r.*,
                u.name as reporter_name, u.avatar as reporter_avatar, u.email as reporter_email,
                staff.name as assigned_staff_name, staff.avatar as assigned_staff_avatar,
                c.name as category_name, c.slug as category_slug, c.color as category_color, c.icon as category_icon,
                (SELECT COUNT(*) FROM upvotes WHERE report_id = r.id) as upvotes_count,
                (SELECT COUNT(*) FROM comments WHERE report_id = r.id) as comments_count,
                ${currentUserId ? '(SELECT COUNT(*) > 0 FROM upvotes WHERE report_id = r.id AND user_id = ' + Number(currentUserId) + ')' : '0'} as has_upvoted
         FROM reports r
         JOIN users u ON r.user_id = u.id
         JOIN categories c ON r.category_id = c.id
         LEFT JOIN users staff ON r.assigned_to = staff.id
         WHERE r.id = ?`,
        [reportId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      const report = rows[0];

      // Photos
      const [photos] = await db.getPool().query('SELECT * FROM report_photos WHERE report_id = ?', [reportId]);
      // Status history logs
      const [logs] = await db.getPool().query(
        `SELECT l.*, u.name as changed_by_name, u.role as changed_by_role, u.avatar as changed_by_avatar
         FROM report_status_logs l
         JOIN users u ON l.changed_by_user_id = u.id
         WHERE l.report_id = ?
         ORDER BY l.created_at ASC`,
        [reportId]
      );
      // Comments
      const [comments] = await db.getPool().query(
        `SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.role as user_role
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.report_id = ?
         ORDER BY c.created_at ASC`,
        [reportId]
      );

      return res.json({
        success: true,
        report: {
          ...report,
          photos,
          status_logs: logs,
          comments
        }
      });
    }

    // Fallback store
    const r = db.fallbackStore.data.reports.find(item => Number(item.id) === Number(reportId));
    if (!r) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    r.views_count = (r.views_count || 0) + 1;
    db.fallbackStore.save();

    const reporter = db.fallbackStore.data.users.find(u => Number(u.id) === Number(r.user_id));
    const staff = db.fallbackStore.data.users.find(u => Number(u.id) === Number(r.assigned_to));
    const cat = db.fallbackStore.data.categories.find(c => Number(c.id) === Number(r.category_id));
    const upvotesCount = db.fallbackStore.data.upvotes.filter(u => Number(u.report_id) === Number(r.id)).length;
    const hasUpvoted = currentUserId ? db.fallbackStore.data.upvotes.some(u => Number(u.report_id) === Number(r.id) && Number(u.user_id) === Number(currentUserId)) : false;

    const photos = db.fallbackStore.data.report_photos.filter(p => Number(p.report_id) === Number(r.id));
    const logs = db.fallbackStore.data.report_status_logs
      .filter(l => Number(l.report_id) === Number(r.id))
      .map(l => {
        const u = db.fallbackStore.data.users.find(user => Number(user.id) === Number(l.changed_by_user_id));
        return {
          ...l,
          changed_by_name: u?.name || 'Municipal Officer',
          changed_by_role: u?.role || 'staff',
          changed_by_avatar: u?.avatar || null
        };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const comments = db.fallbackStore.data.comments
      .filter(c => Number(c.report_id) === Number(r.id))
      .map(c => {
        const u = db.fallbackStore.data.users.find(user => Number(user.id) === Number(c.user_id));
        return {
          ...c,
          user_name: u?.name || 'Citizen',
          user_avatar: u?.avatar || null,
          user_role: u?.role || 'user'
        };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.json({
      success: true,
      report: {
        ...r,
        reporter_name: reporter?.name || 'Citizen',
        reporter_avatar: reporter?.avatar || null,
        reporter_email: reporter?.email || null,
        assigned_staff_name: staff?.name || null,
        assigned_staff_avatar: staff?.avatar || null,
        category_name: cat?.name || 'Other',
        category_slug: cat?.slug || 'other',
        category_color: cat?.color || '#10B981',
        category_icon: cat?.icon || 'Trash2',
        upvotes_count: upvotesCount,
        comments_count: comments.length,
        has_upvoted: hasUpvoted,
        photos,
        status_logs: logs,
        comments
      }
    });
  } catch (err) {
    console.error('getReportById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch report details', error: err.message });
  }
};

// 3. Create Report (Photo Upload + Location + Details)
exports.createReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      category_id,
      severity = 'medium',
      latitude,
      longitude,
      address,
      area_district,
      photo_url // Support direct image URL or uploaded file
    } = req.body;

    if (!title || !description || !category_id || !latitude || !longitude || !address) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, latitude, longitude, and address are required.'
      });
    }

    let primaryPhoto = photo_url || req.body.primary_photo || 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
    if (req.files && req.files.length > 0) {
      primaryPhoto = `/uploads/${req.files[0].filename}`;
    } else if (req.file) {
      primaryPhoto = `/uploads/${req.file.filename}`;
    }

    const district = area_district || 'Downtown Metro';

    if (db.isMysqlActive) {
      const [result] = await db.getPool().query(
        `INSERT INTO reports (user_id, title, description, category_id, severity, status, latitude, longitude, address, area_district, primary_photo, views_count)
         VALUES (?, ?, ?, ?, ?, 'reported', ?, ?, ?, ?, ?, 0)`,
        [userId, title.trim(), description.trim(), Number(category_id), severity, Number(latitude), Number(longitude), address.trim(), district, primaryPhoto]
      );

      const reportId = result.insertId;

      // Additional photos
      if (req.files && req.files.length > 1) {
        for (let i = 1; i < req.files.length; i++) {
          await db.getPool().query(
            'INSERT INTO report_photos (report_id, photo_url, photo_type) VALUES (?, ?, ?)',
            [reportId, `/uploads/${req.files[i].filename}`, 'before']
          );
        }
      }

      // Initial status log
      await db.getPool().query(
        'INSERT INTO report_status_logs (report_id, changed_by_user_id, from_status, to_status, notes) VALUES (?, ?, NULL, ?, ?)',
        [reportId, userId, 'reported', 'Citizen complaint submitted.']
      );

      // Notification
      await createNotification({
        userId,
        title: 'Report Submitted! 📋',
        message: `Your complaint "${title.trim().slice(0, 40)}..." has been logged for municipal review.`,
        type: 'status_change',
        linkUrl: `/reports/${reportId}`
      });

      const newReport = { id: reportId, title: title.trim(), description: description.trim(), category_id: Number(category_id), severity, status: 'reported' };
      return res.status(201).json({
        success: true,
        message: 'Waste report submitted successfully!',
        reportId,
        report: newReport
      });
    }

    // Fallback store
    const reportId = db.fallbackStore.getNextId('reports');
    const newReport = {
      id: reportId,
      user_id: Number(userId),
      title: title.trim(),
      description: description.trim(),
      category_id: Number(category_id),
      severity,
      status: 'reported',
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address.trim(),
      area_district: district,
      primary_photo: primaryPhoto,
      cleaned_photo: null,
      assigned_to: null,
      verified_at: null,
      cleaned_at: null,
      closed_at: null,
      views_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.fallbackStore.data.reports.unshift(newReport);

    // Additional photos
    if (req.files && req.files.length > 1) {
      for (let i = 1; i < req.files.length; i++) {
        db.fallbackStore.data.report_photos.push({
          id: db.fallbackStore.getNextId('report_photos'),
          report_id: reportId,
          photo_url: `/uploads/${req.files[i].filename}`,
          photo_type: 'before',
          created_at: new Date().toISOString()
        });
      }
    }

    // Status log
    db.fallbackStore.data.report_status_logs.push({
      id: db.fallbackStore.getNextId('report_status_logs'),
      report_id: reportId,
      changed_by_user_id: Number(userId),
      from_status: null,
      to_status: 'reported',
      notes: 'Citizen complaint submitted.',
      photo_url: null,
      created_at: new Date().toISOString()
    });

    db.fallbackStore.save();

    await createNotification({
      userId,
      title: 'Report Submitted! 📋',
      message: `Your complaint "${title.trim().slice(0, 40)}..." has been logged for municipal review.`,
      type: 'status_change',
      linkUrl: `/reports/${reportId}`
    });

    return res.status(201).json({
      success: true,
      message: 'Waste report submitted successfully!',
      reportId
    });
  } catch (err) {
    console.error('createReport error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create report', error: err.message });
  }
};

// 4. Update Report Status (Admin / Cleanup Staff)
exports.updateReportStatus = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status, notes, assigned_to, cleaned_photo } = req.body;
    const changedByUserId = req.user.id;

    let afterPhoto = cleaned_photo || null;
    if (req.file) {
      afterPhoto = `/uploads/${req.file.filename}`;
    }

    let report = null;
    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT * FROM reports WHERE id = ?', [reportId]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Report not found' });
      report = rows[0];

      // Staff Permission Check: Staff can ONLY update reports assigned to them
      if (req.user.role === 'cleanup_staff' && Number(report.assigned_to) !== Number(changedByUserId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update waste reports that are assigned to you.'
        });
      }

      const fromStatus = report.status;
      const toStatus = status || fromStatus;

      let verifiedAt = report.verified_at;
      let cleanedAt = report.cleaned_at;
      let closedAt = report.closed_at;

      if (toStatus === 'verified' && !verifiedAt) verifiedAt = new Date();
      if (toStatus === 'cleaned' && !cleanedAt) cleanedAt = new Date();
      if (toStatus === 'closed' && !closedAt) closedAt = new Date();

      const finalAssignedTo = req.user.role === 'cleanup_staff'
        ? report.assigned_to
        : (assigned_to !== undefined ? (assigned_to ? Number(assigned_to) : null) : report.assigned_to);
      const finalCleanedPhoto = afterPhoto || report.cleaned_photo;

      await db.getPool().query(
        `UPDATE reports SET
          status = ?,
          assigned_to = ?,
          cleaned_photo = ?,
          verified_at = ?,
          cleaned_at = ?,
          closed_at = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [toStatus, finalAssignedTo, finalCleanedPhoto, verifiedAt, cleanedAt, closedAt, reportId]
      );

      // Log status change
      await db.getPool().query(
        'INSERT INTO report_status_logs (report_id, changed_by_user_id, from_status, to_status, notes, photo_url) VALUES (?, ?, ?, ?, ?, ?)',
        [reportId, changedByUserId, fromStatus, toStatus, notes || `Status updated to ${toStatus}`, afterPhoto]
      );

      // Notify assigned staff member if newly assigned
      if (finalAssignedTo && Number(finalAssignedTo) !== Number(report.assigned_to)) {
        await createNotification({
          userId: finalAssignedTo,
          title: 'New Cleanup Assignment 🧹',
          message: `You have been assigned to handle report #${reportId}: "${report.title.slice(0, 35)}...".`,
          type: 'assignment',
          linkUrl: `/reports/${reportId}`
        });
      }

      // Notify reporter
      await createNotification({
        userId: report.user_id,
        title: `Status Update: ${toStatus.toUpperCase()}`,
        message: `Your report "${report.title.slice(0, 35)}..." moved to status: ${toStatus}.${notes ? ` Note: ${notes}` : ''}`,
        type: 'status_change',
        linkUrl: `/reports/${reportId}`
      });

      return res.json({ success: true, message: `Report status updated to ${toStatus}!` });
    }

    // Fallback store
    report = db.fallbackStore.data.reports.find(r => Number(r.id) === Number(reportId));
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    // Staff Permission Check: Staff can ONLY update reports assigned to them
    if (req.user.role === 'cleanup_staff' && Number(report.assigned_to) !== Number(changedByUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update waste reports that are assigned to you.'
      });
    }

    const fromStatus = report.status;
    const toStatus = status || fromStatus;

    if (toStatus === 'verified' && !report.verified_at) report.verified_at = new Date().toISOString();
    if (toStatus === 'cleaned' && !report.cleaned_at) report.cleaned_at = new Date().toISOString();
    if (toStatus === 'closed' && !report.closed_at) report.closed_at = new Date().toISOString();

    const previousAssignedTo = report.assigned_to;
    report.status = toStatus;
    if (req.user.role !== 'cleanup_staff' && assigned_to !== undefined) {
      report.assigned_to = assigned_to ? Number(assigned_to) : null;
    }
    if (afterPhoto) report.cleaned_photo = afterPhoto;
    report.updated_at = new Date().toISOString();

    db.fallbackStore.data.report_status_logs.push({
      id: db.fallbackStore.getNextId('report_status_logs'),
      report_id: Number(reportId),
      changed_by_user_id: Number(changedByUserId),
      from_status: fromStatus,
      to_status: toStatus,
      notes: notes || `Status updated to ${toStatus}`,
      photo_url: afterPhoto,
      created_at: new Date().toISOString()
    });

    db.fallbackStore.save();

    // Notify assigned staff member if newly assigned
    if (report.assigned_to && Number(report.assigned_to) !== Number(previousAssignedTo)) {
      await createNotification({
        userId: report.assigned_to,
        title: 'New Cleanup Assignment 🧹',
        message: `You have been assigned to handle report #${reportId}: "${report.title.slice(0, 35)}...".`,
        type: 'assignment',
        linkUrl: `/reports/${reportId}`
      });
    }

    await createNotification({
      userId: report.user_id,
      title: `Status Update: ${toStatus.toUpperCase()}`,
      message: `Your report "${report.title.slice(0, 35)}..." moved to status: ${toStatus}.${notes ? ` Note: ${notes}` : ''}`,
      type: 'status_change',
      linkUrl: `/reports/${reportId}`
    });

    return res.json({ success: true, message: `Report status updated to ${toStatus}!` });
  } catch (err) {
    console.error('updateReportStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update report status', error: err.message });
  }
};

// 5. Toggle Upvote
exports.toggleUpvote = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const userId = Number(req.user.id);

    if (db.isMysqlActive) {
      const [existing] = await db.getPool().query('SELECT id FROM upvotes WHERE report_id = ? AND user_id = ?', [reportId, userId]);

      let hasUpvoted = false;
      if (existing.length > 0) {
        await db.getPool().query('DELETE FROM upvotes WHERE report_id = ? AND user_id = ?', [reportId, userId]);
        hasUpvoted = false;
      } else {
        await db.getPool().query('INSERT INTO upvotes (report_id, user_id) VALUES (?, ?)', [reportId, userId]);
        hasUpvoted = true;

        // Notify report owner
        const [rep] = await db.getPool().query('SELECT user_id, title FROM reports WHERE id = ?', [reportId]);
        if (rep.length > 0 && Number(rep[0].user_id) !== userId) {
          await createNotification({
            userId: rep[0].user_id,
            title: 'Report Upvoted! 👍',
            message: `${req.user.name} upvoted your report "${rep[0].title.slice(0, 30)}..."`,
            type: 'upvote',
            linkUrl: `/reports/${reportId}`
          });
        }
      }

      const [countRow] = await db.getPool().query('SELECT COUNT(*) as count FROM upvotes WHERE report_id = ?', [reportId]);
      return res.json({ success: true, has_upvoted: hasUpvoted, upvotes_count: countRow[0].count });
    }

    // Fallback store
    const existingIndex = db.fallbackStore.data.upvotes.findIndex(u => Number(u.report_id) === reportId && Number(u.user_id) === userId);
    let hasUpvoted = false;

    if (existingIndex >= 0) {
      db.fallbackStore.data.upvotes.splice(existingIndex, 1);
      hasUpvoted = false;
    } else {
      db.fallbackStore.data.upvotes.push({
        id: db.fallbackStore.getNextId('upvotes'),
        report_id: reportId,
        user_id: userId,
        created_at: new Date().toISOString()
      });
      hasUpvoted = true;

      const report = db.fallbackStore.data.reports.find(r => Number(r.id) === reportId);
      if (report && Number(report.user_id) !== userId) {
        await createNotification({
          userId: report.user_id,
          title: 'Report Upvoted! 👍',
          message: `${req.user.name} upvoted your report "${report.title.slice(0, 30)}..."`,
          type: 'upvote',
          linkUrl: `/reports/${reportId}`
        });
      }
    }

    db.fallbackStore.save();
    const upvotesCount = db.fallbackStore.data.upvotes.filter(u => Number(u.report_id) === reportId).length;
    return res.json({ success: true, has_upvoted: hasUpvoted, upvotes_count: upvotesCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Upvote toggle failed', error: err.message });
  }
};

// 6. Add Comment
exports.addComment = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const userId = Number(req.user.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const cleanContent = content.trim();

    if (db.isMysqlActive) {
      const [result] = await db.getPool().query(
        'INSERT INTO comments (report_id, user_id, content) VALUES (?, ?, ?)',
        [reportId, userId, cleanContent]
      );

      const [rep] = await db.getPool().query('SELECT user_id, title FROM reports WHERE id = ?', [reportId]);
      if (rep.length > 0 && Number(rep[0].user_id) !== userId) {
        await createNotification({
          userId: rep[0].user_id,
          title: 'New Comment 💬',
          message: `${req.user.name} commented on "${rep[0].title.slice(0, 30)}..."`,
          type: 'comment',
          linkUrl: `/reports/${reportId}`
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Comment posted!',
        comment: {
          id: result.insertId,
          report_id: reportId,
          user_id: userId,
          user_name: req.user.name,
          user_avatar: req.user.avatar,
          user_role: req.user.role,
          content: cleanContent,
          created_at: new Date().toISOString()
        }
      });
    }

    // Fallback store
    const commentId = db.fallbackStore.getNextId('comments');
    const newComment = {
      id: commentId,
      report_id: reportId,
      user_id: userId,
      user_name: req.user.name,
      user_avatar: req.user.avatar,
      user_role: req.user.role,
      content: cleanContent,
      created_at: new Date().toISOString()
    };

    db.fallbackStore.data.comments.push(newComment);
    db.fallbackStore.save();

    const report = db.fallbackStore.data.reports.find(r => Number(r.id) === reportId);
    if (report && Number(report.user_id) !== userId) {
      await createNotification({
        userId: report.user_id,
        title: 'New Comment 💬',
        message: `${req.user.name} commented on "${report.title.slice(0, 30)}..."`,
        type: 'comment',
        linkUrl: `/reports/${reportId}`
      });
    }

    return res.status(201).json({ success: true, message: 'Comment posted!', comment: newComment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add comment', error: err.message });
  }
};

// 7. Flag / Report Inappropriate Content
exports.flagReport = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const userId = Number(req.user.id);
    const { reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required to submit a flag.' });
    }

    if (db.isMysqlActive) {
      await db.getPool().query(
        'INSERT INTO flags (report_id, user_id, reason, details, status) VALUES (?, ?, ?, ?, "pending")',
        [reportId, userId, reason, details || null]
      );
      const [admins] = await db.getPool().query('SELECT id FROM users WHERE role = "admin" AND status = "active"');
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: 'Flagged Report Queue ⚠️',
          message: `Report #${reportId} was flagged for "${reason}" by a citizen.`,
          type: 'flag',
          linkUrl: '/admin/moderation'
        });
      }
    } else {
      db.fallbackStore.data.flags.push({
        id: db.fallbackStore.getNextId('flags'),
        report_id: reportId,
        user_id: userId,
        reason,
        details: details || null,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      db.fallbackStore.save();

      const admins = db.fallbackStore.data.users.filter(u => u.role === 'admin' && u.status === 'active');
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: 'Flagged Report Queue ⚠️',
          message: `Report #${reportId} was flagged for "${reason}" by a citizen.`,
          type: 'flag',
          linkUrl: '/admin/moderation'
        });
      }
    }

    return res.json({ success: true, message: 'Thank you. The report has been flagged for municipal moderation.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to flag report', error: err.message });
  }
};

// 8. Delete Report (Owner or Admin)
exports.deleteReport = async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const userId = Number(req.user.id);
    const userRole = req.user.role;

    if (db.isMysqlActive) {
      const [rows] = await db.getPool().query('SELECT user_id FROM reports WHERE id = ?', [reportId]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Report not found' });

      if (userRole !== 'admin' && Number(rows[0].user_id) !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete this report.' });
      }

      await db.getPool().query('DELETE FROM reports WHERE id = ?', [reportId]);
      return res.json({ success: true, message: 'Report deleted successfully.' });
    }

    // Fallback store
    const repIndex = db.fallbackStore.data.reports.findIndex(r => Number(r.id) === reportId);
    if (repIndex < 0) return res.status(404).json({ success: false, message: 'Report not found' });

    const rep = db.fallbackStore.data.reports[repIndex];
    if (userRole !== 'admin' && Number(rep.user_id) !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this report.' });
    }

    db.fallbackStore.data.reports.splice(repIndex, 1);
    db.fallbackStore.data.comments = db.fallbackStore.data.comments.filter(c => Number(c.report_id) !== reportId);
    db.fallbackStore.data.upvotes = db.fallbackStore.data.upvotes.filter(u => Number(u.report_id) !== reportId);
    db.fallbackStore.data.report_status_logs = db.fallbackStore.data.report_status_logs.filter(l => Number(l.report_id) !== reportId);
    db.fallbackStore.save();

    return res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete report', error: err.message });
  }
};

// 9. Get Categories
exports.getCategories = async (req, res) => {
  try {
    if (db.isMysqlActive) {
      const [categories] = await db.getPool().query(
        `SELECT c.*, (SELECT COUNT(*) FROM reports WHERE category_id = c.id) as report_count
         FROM categories c
         WHERE c.is_active = TRUE
         ORDER BY c.name ASC`
      );
      return res.json({ success: true, categories });
    }

    const categories = db.fallbackStore.data.categories
      .filter(c => c.is_active !== false)
      .map(c => {
        const count = db.fallbackStore.data.reports.filter(r => Number(r.category_id) === Number(c.id)).length;
        return { ...c, report_count: count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.json({ success: true, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories', error: err.message });
  }
};
