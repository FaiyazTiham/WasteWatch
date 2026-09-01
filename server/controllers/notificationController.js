const db = require('../config/db');

// 1. Get User Notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    if (db.isMysqlActive) {
      const [notifications] = await db.getPool().query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      const [unreadCount] = await db.getPool().query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return res.json({
        success: true,
        unread_count: unreadCount[0]?.count || 0,
        notifications
      });
    }

    const notifications = db.fallbackStore.data.notifications
      .filter(n => Number(n.user_id) === Number(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.json({
      success: true,
      unread_count: unreadCount,
      notifications
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: err.message });
  }
};

// 2. Mark Single Notification as Read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (db.isMysqlActive) {
      await db.getPool().query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
      return res.json({ success: true, message: 'Notification marked as read' });
    }

    const n = db.fallbackStore.data.notifications.find(item => Number(item.id) === Number(id) && Number(item.user_id) === Number(userId));
    if (n) {
      n.is_read = true;
      db.fallbackStore.save();
    }
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification', error: err.message });
  }
};

// 3. Mark All Notifications as Read
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    if (db.isMysqlActive) {
      await db.getPool().query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    db.fallbackStore.data.notifications.forEach(n => {
      if (Number(n.user_id) === Number(userId)) {
        n.is_read = true;
      }
    });
    db.fallbackStore.save();

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark all as read', error: err.message });
  }
};
