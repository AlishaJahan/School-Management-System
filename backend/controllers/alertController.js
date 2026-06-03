const { getPool } = require('../config/db');
const { sendMockEmail, sendMockSMS } = require('../services/notificationService');

// @route   POST api/alerts
// @desc    Create a new emergency alert and broadcast it
// @access  Private (Admins only)
exports.createAlert = async (req, res) => {
  const { title, message, severity, channels } = req.body;
  const adminId = req.user.id;

  if (!title || !message || !severity || !channels || channels.length === 0) {
    return res.status(400).json({ message: 'All alert fields and at least one channel are required.' });
  }

  // Ensure severity is valid
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!validSeverities.includes(severity.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid severity level.' });
  }

  try {
    const pool = getPool();
    const channelsStr = Array.isArray(channels) ? channels.join(',') : channels;

    // 1. Insert alert into the database
    const [result] = await pool.query(`
      INSERT INTO emergency_alerts (sender_id, title, message, severity, channels)
      VALUES (?, ?, ?, ?, ?)
    `, [adminId, title.trim(), message.trim(), severity.toLowerCase(), channelsStr]);

    // 2. Fetch active teachers
    const [teachers] = await pool.query(`
      SELECT u.name, u.email, t.phone, 'teacher' AS role
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      WHERE t.status = 'active'
    `);

    // 3. Fetch active students (with optional parent phone numbers as student contact)
    const [students] = await pool.query(`
      SELECT u.name, u.email, p.phone AS parent_phone, 'student' AS role
      FROM users u
      JOIN students s ON u.id = s.user_id
      LEFT JOIN parents p ON s.id = p.student_id
      WHERE s.status = 'active'
    `);

    // Combine targets
    const targets = [...teachers, ...students];
    const dispatchChannels = channelsStr.split(',');

    let emailSentCount = 0;
    let smsSentCount = 0;

    // 4. Trigger simulated SMS/Email broadcasts
    for (const target of targets) {
      const email = target.email;
      const phone = target.phone || target.parent_phone || '+91 99999 88888';

      // Send Email
      if (dispatchChannels.includes('email') && email) {
        await sendMockEmail(email, target.name, title, message);
        emailSentCount += 1;
      }

      // Send SMS
      if (dispatchChannels.includes('sms') && phone) {
        await sendMockSMS(phone, target.name, title, message);
        smsSentCount += 1;
      }
    }

    res.json({
      message: 'Emergency alert successfully logged and broadcasted to all cohorts.',
      alert: {
        id: result.insertId,
        title,
        message,
        severity,
        channels: channelsStr,
        created_at: new Date()
      },
      stats: {
        totalTargets: targets.length,
        emailSent: emailSentCount,
        smsSent: smsSentCount
      }
    });

  } catch (err) {
    console.error('Error creating emergency alert:', err);
    res.status(500).json({ message: 'Internal server error broadcasting emergency alert.' });
  }
};

// @route   GET api/alerts
// @desc    Get all recent emergency alerts
// @access  Private (All authenticated roles)
exports.getAlerts = async (req, res) => {
  try {
    const pool = getPool();
    const [alerts] = await pool.query(`
      SELECT e.*, u.name AS publisher
      FROM emergency_alerts e
      JOIN users u ON e.sender_id = u.id
      ORDER BY e.created_at DESC
    `);

    res.json(alerts);
  } catch (err) {
    console.error('Error fetching emergency alerts:', err);
    res.status(500).json({ message: 'Internal server error fetching emergency alerts.' });
  }
};

// @route   DELETE api/alerts/:id
// @desc    Delete/retract an emergency alert
// @access  Private (Admins only)
exports.deleteAlert = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = getPool();
    
    // Verify alert exists
    const [alertCheck] = await pool.query('SELECT id FROM emergency_alerts WHERE id = ?', [id]);
    if (alertCheck.length === 0) {
      return res.status(404).json({ message: 'Alert record not found.' });
    }

    await pool.query('DELETE FROM emergency_alerts WHERE id = ?', [id]);
    
    res.json({ message: 'Emergency alert record retracted/removed successfully.' });
  } catch (err) {
    console.error('Error deleting emergency alert:', err);
    res.status(500).json({ message: 'Internal server error removing emergency alert.' });
  }
};
