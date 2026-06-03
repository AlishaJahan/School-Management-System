const { getPool } = require('../config/db');
const crypto = require('crypto');

// Helper to generate verification key for certificates
function generateVerificationCode(studentId, eventId, studentName, eventDate) {
  const input = `${studentId}-${eventId}-${studentName}-${eventDate}-eduprime-security-salt`;
  const hash = crypto.createHash('sha256').update(input).digest('hex').substring(0, 8).toUpperCase();
  return `CERT-EP-${eventId}-${studentId}-${hash}`;
}

// @route   POST api/events
// @desc    Create a new school event (Admins & Teachers only)
// @access  Private (Admin, Teacher)
exports.createEvent = async (req, res) => {
  const { title, description, event_date, location } = req.body;

  if (!title || !description || !event_date || !location) {
    return res.status(400).json({ message: 'Title, description, event date, and location are required.' });
  }

  try {
    const pool = getPool();
    await pool.query(`
      INSERT INTO events (creator_id, title, description, event_date, location)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, title, description, event_date, location]);

    res.status(201).json({ message: 'School event published successfully!' });

  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Server error publishing school event.' });
  }
};

// @route   GET api/events
// @desc    Get all events split into upcoming and past (All authenticated users)
// @access  Private
exports.getEvents = async (req, res) => {
  const pool = getPool();
  let eventsQuery = '';
  let queryParams = [];

  try {
    if (req.user.role === 'student') {
      // Resolve student ID
      const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      const studentId = studentRows.length > 0 ? studentRows[0].id : null;

      eventsQuery = `
        SELECT e.id, e.title, e.description, e.event_date, e.location, e.created_at,
               IF(er.id IS NOT NULL, 1, 0) AS is_registered,
               er.attendance_status
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.student_id = ?
        ORDER BY e.event_date DESC
      `;
      queryParams.push(studentId);
    } else {
      eventsQuery = `
        SELECT e.id, e.title, e.description, e.event_date, e.location, e.created_at
        FROM events e
        ORDER BY e.event_date DESC
      `;
    }

    const [allEvents] = await pool.query(eventsQuery, queryParams);

    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = [];
    const past = [];

    for (const ev of allEvents) {
      const evDateStr = new Date(ev.event_date).toISOString().split('T')[0];
      if (evDateStr >= todayStr) {
        upcoming.push(ev);
      } else {
        past.push(ev);
      }
    }

    res.json({ upcoming, past });

  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Server error retrieving school events catalog.' });
  }
};

// @route   POST api/events/:id/register
// @desc    Register for an upcoming event (Students only)
// @access  Private (Student)
exports.registerForEvent = async (req, res) => {
  const { id } = req.params; // event_id
  const pool = getPool();

  try {
    // 1. Resolve student ID
    const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    const studentId = studentRows[0].id;

    // 2. Verify event exists and is in the future
    const [eventRows] = await pool.query('SELECT event_date FROM events WHERE id = ?', [id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const evDateStr = new Date(eventRows[0].event_date).toISOString().split('T')[0];
    if (evDateStr < todayStr) {
      return res.status(400).json({ message: 'Cannot register for past events.' });
    }

    // 3. Register student (ignore duplicate entries)
    await pool.query(`
      INSERT IGNORE INTO event_registrations (event_id, student_id, attendance_status)
      VALUES (?, ?, 'registered')
    `, [id, studentId]);

    res.json({ message: 'Successfully registered for this event!' });

  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ message: 'Server error processing registration.' });
  }
};

// @route   POST api/events/:id/unregister
// @desc    Unregister from an upcoming event (Students only)
// @access  Private (Student)
exports.unregisterFromEvent = async (req, res) => {
  const { id } = req.params; // event_id
  const pool = getPool();

  try {
    // 1. Resolve student ID
    const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    const studentId = studentRows[0].id;

    // 2. Verify registration exists and status is 'registered' (meaning attendance isn't marked yet)
    const [regCheck] = await pool.query(`
      SELECT er.id, e.event_date 
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.event_id = ? AND er.student_id = ? AND er.attendance_status = 'registered'
    `, [id, studentId]);

    if (regCheck.length === 0) {
      return res.status(400).json({ message: 'No pending registration found to cancel.' });
    }

    // 3. Delete registration
    await pool.query('DELETE FROM event_registrations WHERE id = ?', [regCheck[0].id]);

    res.json({ message: 'Successfully cancelled event registration.' });

  } catch (err) {
    console.error('Error unregistering from event:', err);
    res.status(500).json({ message: 'Server error processing cancellation.' });
  }
};

// @route   GET api/events/:id/registrations
// @desc    Get list of registrations for an event (Admins & Teachers only)
// @access  Private (Admin, Teacher)
exports.getEventRegistrations = async (req, res) => {
  const { id } = req.params; // event_id
  const pool = getPool();

  try {
    // Fetch event detail
    const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Fetch registered students
    const [registrations] = await pool.query(`
      SELECT er.id AS registration_id, s.id AS student_id, u.name AS student_name, s.roll_no, s.class_grade, er.attendance_status, er.registered_at
      FROM event_registrations er
      JOIN students s ON er.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE er.event_id = ?
      ORDER BY u.name ASC
    `, [id]);

    res.json({
      event: events[0],
      registrations
    });

  } catch (err) {
    console.error('Error fetching event registrations:', err);
    res.status(500).json({ message: 'Server error fetching registrations list.' });
  }
};

// @route   POST api/events/:id/attendance
// @desc    Mark student attendance for an event (Admins & Teachers only)
// @access  Private (Admin, Teacher)
exports.markEventAttendance = async (req, res) => {
  const { id } = req.params; // event_id
  const { studentId, status } = req.body;

  if (!studentId || !status) {
    return res.status(400).json({ message: 'Student ID and status are required.' });
  }

  const validStatuses = ['registered', 'present', 'absent'];
  if (!validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid attendance status value.' });
  }

  try {
    const pool = getPool();

    // Check if registration exists
    const [regCheck] = await pool.query(
      'SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?',
      [id, studentId]
    );

    if (regCheck.length === 0) {
      return res.status(404).json({ message: 'This student has not registered for this event.' });
    }

    // Update attendance status
    await pool.query(
      'UPDATE event_registrations SET attendance_status = ? WHERE event_id = ? AND student_id = ?',
      [status.toLowerCase(), id, studentId]
    );

    res.json({ message: 'Student event attendance updated successfully!' });

  } catch (err) {
    console.error('Error marking event attendance:', err);
    res.status(500).json({ message: 'Server error updating attendance records.' });
  }
};

// @route   GET api/events/my-certificates
// @desc    Get all events student has attended and generate verification keys (Students only)
// @access  Private (Student)
exports.getMyCertificates = async (req, res) => {
  const pool = getPool();

  try {
    // 1. Resolve student ID
    const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    const studentId = studentRows[0].id;

    // 2. Fetch attended events
    const [attendedEvents] = await pool.query(`
      SELECT e.id AS event_id, e.title, e.description, e.event_date, e.location, er.registered_at, u.name AS student_name
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN students s ON er.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE er.student_id = ? AND er.attendance_status = 'present'
      ORDER BY e.event_date DESC
    `, [studentId]);

    // 3. Map certificate details with generated validation codes
    const certificates = attendedEvents.map((ev) => {
      const formattedDate = new Date(ev.event_date).toISOString().split('T')[0];
      const verifyCode = generateVerificationCode(studentId, ev.event_id, ev.student_name, formattedDate);
      
      return {
        event_id: ev.event_id,
        title: ev.title,
        description: ev.description,
        event_date: ev.event_date,
        location: ev.location,
        student_name: ev.student_name,
        verification_code: verifyCode
      };
    });

    res.json(certificates);

  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({ message: 'Server error generating certificate validation lists.' });
  }
};
