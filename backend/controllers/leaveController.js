const { getPool } = require('../config/db');

// @route   POST api/leaves/apply
// @desc    Submit a new leave application
// @access  Private (Students, Teachers, Parents)
exports.applyLeave = async (req, res) => {
  const { start_date, end_date, reason } = req.body;

  if (!start_date || !end_date || !reason || !reason.trim()) {
    return res.status(400).json({ message: 'Start date, end date, and reason are required.' });
  }

  const pool = getPool();
  try {
    let targetUserId = req.user.id;

    // If parent is applying, resolve the child's user_id
    if (req.user.role === 'parent') {
      const [parentCheck] = await pool.query('SELECT student_id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parentCheck.length === 0) {
        return res.status(404).json({ message: 'No student associated with this parent account.' });
      }
      
      const childStudentId = parentCheck[0].student_id;
      const [childCheck] = await pool.query('SELECT user_id FROM students WHERE id = ?', [childStudentId]);
      if (childCheck.length === 0) {
        return res.status(404).json({ message: 'Linked student user account not found.' });
      }

      targetUserId = childCheck[0].user_id;
    }

    // Insert leave request
    await pool.query(
      'INSERT INTO leave_requests (user_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, "pending")',
      [targetUserId, start_date, end_date, reason.trim()]
    );

    return res.status(201).json({ message: 'Leave application submitted successfully!' });

  } catch (err) {
    console.error('Error applying for leave:', err);
    return res.status(500).json({ message: 'Internal server error submitting leave application.' });
  }
};

// @route   GET api/leaves/history
// @desc    Get leave requests history log
// @access  Private (All Roles)
exports.getLeaveHistory = async (req, res) => {
  const pool = getPool();
  try {
    const roleLower = req.user.role?.toLowerCase();

    // 1. Admin/Principal View: See all requests in system
    if (roleLower === 'admin') {
      const [requests] = await pool.query(`
        SELECT lr.id, lr.start_date, lr.end_date, lr.reason, lr.status, lr.review_remarks, lr.created_at,
               u.name AS applicant_name, u.role AS applicant_role, u.email AS applicant_email,
               u_rev.name AS reviewer_name
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        LEFT JOIN users u_rev ON lr.reviewed_by = u_rev.id
        ORDER BY FIELD(lr.status, 'pending', 'approved', 'rejected'), lr.created_at DESC
      `);
      return res.json(requests);
    }

    // 2. Parent View: See child's leave history
    if (roleLower === 'parent') {
      const [parentCheck] = await pool.query('SELECT student_id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parentCheck.length === 0) {
        return res.json([]); // No linked student
      }
      
      const childStudentId = parentCheck[0].student_id;
      const [childCheck] = await pool.query('SELECT user_id FROM students WHERE id = ?', [childStudentId]);
      if (childCheck.length === 0) {
        return res.json([]);
      }

      const childUserId = childCheck[0].user_id;

      const [requests] = await pool.query(`
        SELECT lr.id, lr.start_date, lr.end_date, lr.reason, lr.status, lr.review_remarks, lr.created_at,
               u_rev.name AS reviewer_name
        FROM leave_requests lr
        LEFT JOIN users u_rev ON lr.reviewed_by = u_rev.id
        WHERE lr.user_id = ?
        ORDER BY lr.created_at DESC
      `, [childUserId]);
      
      return res.json(requests);
    }

    // 3. Student/Teacher View: See own leave history
    const [requests] = await pool.query(`
      SELECT lr.id, lr.start_date, lr.end_date, lr.reason, lr.status, lr.review_remarks, lr.created_at,
             u_rev.name AS reviewer_name
      FROM leave_requests lr
      LEFT JOIN users u_rev ON lr.reviewed_by = u_rev.id
      WHERE lr.user_id = ?
      ORDER BY lr.created_at DESC
    `, [req.user.id]);

    return res.json(requests);

  } catch (err) {
    console.error('Error fetching leave history:', err);
    return res.status(500).json({ message: 'Internal server error loading leave records.' });
  }
};

// @route   POST api/leaves/review
// @desc    Approve or reject a leave request
// @access  Private (Admins / Principal Only)
exports.reviewLeave = async (req, res) => {
  const { requestId, status, remarks } = req.body;

  if (!requestId || !status) {
    return res.status(400).json({ message: 'requestId and status are required.' });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Status must be "approved" or "rejected".' });
  }

  const pool = getPool();
  try {
    // Check if request exists
    const [requestCheck] = await pool.query('SELECT id FROM leave_requests WHERE id = ?', [requestId]);
    if (requestCheck.length === 0) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    // Update status
    await pool.query(
      'UPDATE leave_requests SET status = ?, reviewed_by = ?, review_remarks = ? WHERE id = ?',
      [status, req.user.id, remarks ? remarks.trim() : null, requestId]
    );

    return res.json({ message: `Leave request successfully ${status}!` });

  } catch (err) {
    console.error('Error reviewing leave request:', err);
    return res.status(500).json({ message: 'Internal server error reviewing leave request.' });
  }
};
