const { getPool } = require('../config/db');

// @route   POST api/complaints
// @desc    Submit a new complaint or suggestion (Students only)
// @access  Private (Student)
exports.submitComplaint = async (req, res) => {
  const { title, category, description, type } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({ message: 'Title, category, and description are required.' });
  }

  const validTypes = ['complaint', 'suggestion'];
  const ticketType = type && validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'complaint';

  const validCategories = ['academic', 'facilities', 'harassment', 'extracurricular', 'other'];
  if (!validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid category specified.' });
  }

  try {
    const pool = getPool();

    // 1. Resolve student ID
    const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Only registered students can submit complaints or suggestions.' });
    }
    const studentId = studentRows[0].id;

    // 2. Generate unique ticket key
    const prefix = ticketType === 'suggestion' ? 'SUG' : 'COMP';
    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `${prefix}-${year}-${randomCode}`;

    // 3. Save ticket
    await pool.query(`
      INSERT INTO complaints (student_id, ticket_id, type, title, category, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [studentId, ticketId, ticketType, title, category.toLowerCase(), description]);

    res.status(201).json({
      message: `Your ${ticketType} has been successfully and anonymously reported to the Principal.`,
      ticket_id: ticketId
    });

  } catch (err) {
    console.error('Error submitting complaint:', err);
    res.status(500).json({ message: 'Server error processing report submission.' });
  }
};

// @route   GET api/complaints/my
// @desc    Retrieve tickets submitted by the logged-in student (for tracking)
// @access  Private (Student)
exports.getStudentComplaints = async (req, res) => {
  try {
    const pool = getPool();

    // 1. Resolve student ID
    const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    const studentId = studentRows[0].id;

    // 2. Get student's complaints
    const [complaints] = await pool.query(`
      SELECT id, ticket_id, type, title, category, description, status, resolution_remarks, created_at, resolved_at
      FROM complaints
      WHERE student_id = ?
      ORDER BY created_at DESC
    `, [studentId]);

    res.json(complaints);

  } catch (err) {
    console.error('Error fetching student complaints:', err);
    res.status(500).json({ message: 'Server error retrieving status logs.' });
  }
};

// @route   GET api/complaints/admin
// @desc    Retrieve all tickets (Admins/Principal only) - Strictly Anonymous
// @access  Private (Admin)
exports.getAdminComplaints = async (req, res) => {
  try {
    const pool = getPool();

    // Fetch all complaints. OMIT student_id and any student metadata to guarantee absolute anonymity
    const [complaints] = await pool.query(`
      SELECT id, ticket_id, type, title, category, description, status, resolution_remarks, created_at, resolved_at
      FROM complaints
      ORDER BY created_at DESC
    `);

    res.json(complaints);

  } catch (err) {
    console.error('Error fetching admin complaints:', err);
    res.status(500).json({ message: 'Server error retrieving complaints queue.' });
  }
};

// @route   PUT api/complaints/:id/status
// @desc    Update complaint status and attach resolution feedback (Admins/Principal only)
// @access  Private (Admin)
exports.updateComplaintStatus = async (req, res) => {
  const { id } = req.params;
  const { status, resolution_remarks } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed'];
  if (!validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid status state specified.' });
  }

  try {
    const pool = getPool();

    // Verify complaint exists
    const [complaintRows] = await pool.query('SELECT id FROM complaints WHERE id = ?', [id]);
    if (complaintRows.length === 0) {
      return res.status(404).json({ message: 'Complaint ticket not found.' });
    }

    const updatedStatus = status.toLowerCase();
    const remarks = resolution_remarks || null;

    if (updatedStatus === 'resolved' || updatedStatus === 'dismissed') {
      await pool.query(`
        UPDATE complaints 
        SET status = ?, resolution_remarks = ?, resolved_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [updatedStatus, remarks, id]);
    } else {
      await pool.query(`
        UPDATE complaints 
        SET status = ?, resolution_remarks = ?, resolved_at = NULL 
        WHERE id = ?
      `, [updatedStatus, remarks, id]);
    }

    res.json({ message: 'Ticket status successfully updated!' });

  } catch (err) {
    console.error('Error updating complaint status:', err);
    res.status(500).json({ message: 'Server error updating ticket.' });
  }
};
