const db = require('../config/db');

exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    if (db.isMysqlActive) {
      await db.getPool().query(
        'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
        [name.trim(), email.trim(), subject ? subject.trim() : 'General Inquiry', message.trim()]
      );
    } else {
      db.fallbackStore.data.contact_messages.push({
        id: db.fallbackStore.getNextId('contact_messages'),
        name: name.trim(),
        email: email.trim(),
        subject: subject ? subject.trim() : 'General Inquiry',
        message: message.trim(),
        status: 'new',
        created_at: new Date().toISOString()
      });
      db.fallbackStore.save();
    }

    return res.json({
      success: true,
      message: 'Thank you for contacting WasteWatch! Your message has been received by our environmental support team.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit contact message', error: err.message });
  }
};
