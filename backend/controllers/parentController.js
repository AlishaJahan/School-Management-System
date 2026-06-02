const { getPool } = require('../config/db');

// Reuse of the AI Insights heuristic solver for parent insights calculations
function computeChildAverages(studentName, marks, attendance, classGrade) {
  let avgMarks = 0;
  let totalScore = 0;
  let subjectsCount = 0;
  const subjectAverages = {};

  if (marks && marks.length > 0) {
    marks.forEach(m => {
      const obtained = parseFloat(m.marks_obtained);
      const max = parseFloat(m.max_marks || 100);
      const percentage = (obtained / max) * 100;
      
      if (!subjectAverages[m.subject]) {
        subjectAverages[m.subject] = { sum: 0, count: 0 };
      }
      subjectAverages[m.subject].sum += percentage;
      subjectAverages[m.subject].count += 1;
    });

    Object.keys(subjectAverages).forEach(sub => {
      const avg = parseFloat((subjectAverages[sub].sum / subjectAverages[sub].count).toFixed(1));
      subjectAverages[sub].average = avg;
      totalScore += avg;
      subjectsCount += 1;
    });

    avgMarks = parseFloat((totalScore / subjectsCount).toFixed(1));
  }

  let attendanceRate = 100;
  let presentDays = 0;
  let totalDays = 0;

  if (attendance && attendance.length > 0) {
    attendance.forEach(a => {
      if (a.status === 'present') {
        presentDays += 1;
      }
      totalDays += 1;
    });
    attendanceRate = parseFloat(((presentDays / totalDays) * 100).toFixed(1));
  }

  return {
    studentName,
    classGrade,
    metrics: {
      avgMarks,
      attendanceRate,
      presentDays,
      totalDays,
      subjectsCount
    },
    subjectAverages
  };
}

// @route   GET api/parent/child-insights
// @desc    Get child academic averages and attendance stats
// @access  Private (Parents only)
exports.getChildInsights = async (req, res) => {
  try {
    const pool = getPool();

    // 1. Fetch parent record to find linked student
    const [parents] = await pool.query(
      'SELECT student_id FROM parents WHERE user_id = ?',
      [req.user.id]
    );

    if (parents.length === 0) {
      return res.status(404).json({ message: 'No student links associated with this parent user.' });
    }

    const childStudentId = parents[0].student_id;

    // 2. Fetch student details
    const [studentInfo] = await pool.query(`
      SELECT s.id AS student_id, u.name, s.roll_no, s.class_grade, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [childStudentId]);

    if (studentInfo.length === 0) {
      return res.status(404).json({ message: 'Linked student record not found.' });
    }

    const child = studentInfo[0];

    // 3. Fetch child marks and attendance
    const [marks] = await pool.query('SELECT * FROM marks WHERE student_id = ?', [childStudentId]);
    const [attendance] = await pool.query('SELECT * FROM attendance WHERE student_id = ?', [childStudentId]);

    const calculations = computeChildAverages(child.name, marks, attendance, child.class_grade);

    // Sort marks chronological
    const sortedMarks = marks.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
    // Sort attendance newest first
    const sortedAttendance = attendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      student_id: child.student_id,
      studentName: child.name,
      rollNo: child.roll_no,
      email: child.email,
      ...calculations,
      rawMarksHistory: sortedMarks,
      rawAttendanceLogs: sortedAttendance.slice(0, 10)
    });

  } catch (err) {
    console.error('Error fetching parent-child insights:', err);
    res.status(500).json({ message: 'Internal server error pulling child academic records.' });
  }
};

// @route   GET api/parent/teachers
// @desc    Get list of all teachers to contact
// @access  Private (Parents only)
exports.getChildTeachers = async (req, res) => {
  try {
    const pool = getPool();
    const [teachers] = await pool.query(`
      SELECT t.id AS teacher_id, u.id AS user_id, u.name, t.subject, u.email, t.phone
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'active'
      ORDER BY u.name ASC
    `);

    res.json(teachers);
  } catch (err) {
    console.error('Error loading child instructors:', err);
    res.status(500).json({ message: 'Internal server error pulling faculty details.' });
  }
};

// @route   GET api/parent/messages/:targetId
// @desc    Get message thread between logged-in user and target user
// @access  Private (Parents, Teachers)
exports.getMessageThread = async (req, res) => {
  const { targetId } = req.params;
  const currentUserId = req.user.id;

  try {
    const pool = getPool();

    // Mark messages sent by target to me as read
    await pool.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
      [targetId, currentUserId]
    );

    // Fetch conversation thread
    const [messages] = await pool.query(`
      SELECT m.id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
             u_sender.name AS sender_name, u_receiver.name AS receiver_name
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_receiver ON m.receiver_id = u_receiver.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [currentUserId, targetId, targetId, currentUserId]);

    res.json(messages);
  } catch (err) {
    console.error('Error loading message threads:', err);
    res.status(500).json({ message: 'Internal server error fetching message thread logs.' });
  }
};

// @route   POST api/parent/messages/send
// @desc    Send a secure chat message to a parent/teacher
// @access  Private (Parents, Teachers)
exports.sendMessage = async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !message || !message.trim()) {
    return res.status(400).json({ message: 'Receiver ID and non-empty message body is required.' });
  }

  try {
    const pool = getPool();
    
    // Insert new message
    const [result] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, FALSE)',
      [senderId, receiverId, message.trim()]
    );

    const [newMessage] = await pool.query(`
      SELECT m.id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
             u_sender.name AS sender_name, u_receiver.name AS receiver_name
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_receiver ON m.receiver_id = u_receiver.id
      WHERE m.id = ?
    `, [result.insertId]);

    res.json(newMessage[0]);
  } catch (err) {
    console.error('Error dispatching message:', err);
    res.status(500).json({ message: 'Internal server error sending private message.' });
  }
};

// @route   GET api/parent/contacts
// @desc    Get messaging contact list (teachers for parents, parents for teachers)
// @access  Private (Parents, Teachers)
exports.getInboxContacts = async (req, res) => {
  const roleLower = req.user.role?.toLowerCase();

  try {
    const pool = getPool();

    if (roleLower === 'parent') {
      // Parents contact teachers
      const [teachers] = await pool.query(`
        SELECT u.id AS user_id, u.name, t.subject AS detail, u.email, 'teacher' as role
        FROM teachers t
        JOIN users u ON t.user_id = u.id
        WHERE t.status = 'active'
        ORDER BY u.name ASC
      `);
      res.json(teachers);
    } else if (roleLower === 'teacher') {
      // Teachers contact parents (joined to their student names)
      const [parents] = await pool.query(`
        SELECT u.id AS user_id, u.name, CONCAT('Parent of ', u_child.name, ' (', s.class_grade, ')') AS detail, u.email, 'parent' as role
        FROM parents p
        JOIN users u ON p.user_id = u.id
        JOIN students s ON p.student_id = s.id
        JOIN users u_child ON s.user_id = u_child.id
        ORDER BY u.name ASC
      `);
      res.json(parents);
    } else {
      // Admins contact both
      const [all] = await pool.query(`
        SELECT id AS user_id, name, CONCAT(UPPER(role), ' Account') AS detail, email, role
        FROM users
        WHERE id != ?
        ORDER BY name ASC
      `, [req.user.id]);
      res.json(all);
    }
  } catch (err) {
    console.error('Error fetching contact indexes:', err);
    res.status(500).json({ message: 'Internal server error loading contact threads.' });
  }
};
