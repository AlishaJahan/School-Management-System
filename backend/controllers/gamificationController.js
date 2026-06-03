const { getPool } = require('../config/db');

// Helper to check and automatically award system badges
async function checkAndAwardSystemBadges(pool, studentId) {
  try {
    // 1. Perfect Attendance Badge (attendance rate >= 95% and at least 5 logs)
    const [attRows] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present 
       FROM attendance WHERE student_id = ?`,
      [studentId]
    );
    if (attRows.length > 0 && attRows[0].total >= 5) {
      const total = attRows[0].total;
      const present = attRows[0].present;
      const rate = (present / total) * 100;
      if (rate >= 95.0) {
        const [badge] = await pool.query("SELECT id FROM badges WHERE name = 'Perfect Attendance'");
        if (badge.length > 0) {
          await pool.query(
            "INSERT IGNORE INTO student_badges (student_id, badge_id, awarded_by) VALUES (?, ?, NULL)",
            [studentId, badge[0].id]
          );
        }
      }
    }

    // 2. Top Performer Badge (exam average >= 90% and at least 3 exams)
    const [markRows] = await pool.query(
      `SELECT COUNT(*) AS count, AVG((marks_obtained / max_marks) * 100) AS avg_pct 
       FROM marks WHERE student_id = ? AND exam_type != 'HW_ASK'`,
      [studentId]
    );
    if (markRows.length > 0 && markRows[0].count >= 3 && markRows[0].avg_pct !== null) {
      const avg = parseFloat(markRows[0].avg_pct);
      if (avg >= 90.0) {
        const [badge] = await pool.query("SELECT id FROM badges WHERE name = 'Top Performer'");
        if (badge.length > 0) {
          await pool.query(
            "INSERT IGNORE INTO student_badges (student_id, badge_id, awarded_by) VALUES (?, ?, NULL)",
            [studentId, badge[0].id]
          );
        }
      }
    }

    // 3. Consistent Learner Badge (at least 3 homework helper logs)
    const [hwRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM marks WHERE student_id = ? AND exam_type = 'HW_ASK'",
      [studentId]
    );
    if (hwRows.length > 0 && hwRows[0].count >= 3) {
      const [badge] = await pool.query("SELECT id FROM badges WHERE name = 'Consistent Learner'");
      if (badge.length > 0) {
        await pool.query(
          "INSERT IGNORE INTO student_badges (student_id, badge_id, awarded_by) VALUES (?, ?, NULL)",
          [studentId, badge[0].id]
        );
      }
    }
  } catch (err) {
    console.error("Error auto-awarding system badges:", err.message);
  }
}

// Helper to aggregate points for all students and rank them
async function calculateAllStudentsPoints(pool) {
  // Fetch all students with user profiles
  const [students] = await pool.query(`
    SELECT s.id AS student_id, u.name, s.class_grade, s.roll_no
    FROM students s
    JOIN users u ON s.user_id = u.id
  `);

  const leaderboard = [];
  for (const s of students) {
    // 1. Attendance points: +10 pts for each present attendance
    const [att] = await pool.query(
      "SELECT COUNT(*) AS count FROM attendance WHERE student_id = ? AND status = 'present'", 
      [s.student_id]
    );
    const attendancePoints = att[0].count * 10;

    // 2. Exam/Assignment points: +20 pts for each mark entry (excluding HW helper logs)
    const [exams] = await pool.query(
      "SELECT COUNT(*) AS count FROM marks WHERE student_id = ? AND exam_type != 'HW_ASK'", 
      [s.student_id]
    );
    const examPoints = exams[0].count * 20;

    // 3. Socratic HW helper points: +10 pts for each HW helper session log
    const [hw] = await pool.query(
      "SELECT COUNT(*) AS count FROM marks WHERE student_id = ? AND exam_type = 'HW_ASK'", 
      [s.student_id]
    );
    const hwPoints = hw[0].count * 10;

    // 4. Manual logs: sum of manual points awarded
    const [manual] = await pool.query(
      "SELECT IFNULL(SUM(points), 0) AS total FROM points_log WHERE student_id = ?", 
      [s.student_id]
    );
    const manualPoints = parseInt(manual[0].total);

    const totalPoints = attendancePoints + examPoints + hwPoints + manualPoints;

    // Badges count
    const [badges] = await pool.query(
      "SELECT COUNT(*) AS count FROM student_badges WHERE student_id = ?", 
      [s.student_id]
    );

    leaderboard.push({
      student_id: s.student_id,
      name: s.name,
      class_grade: s.class_grade,
      roll_no: s.roll_no,
      points: totalPoints,
      badgeCount: badges[0].count,
      breakdown: {
        attendance: attendancePoints,
        assignments: examPoints,
        homeworkHelper: hwPoints,
        manual: manualPoints
      }
    });
  }

  // Sort descending by points
  leaderboard.sort((a, b) => b.points - a.points);
  
  // Assign ranks
  let currentRank = 1;
  for (let i = 0; i < leaderboard.length; i++) {
    if (i > 0 && leaderboard[i].points < leaderboard[i - 1].points) {
      currentRank = i + 1;
    }
    leaderboard[i].rank = currentRank;
  }

  return leaderboard;
}

// @route   GET api/gamification/status/:studentId
// @desc    Get individual student gamification profile (points breakdown, badges case, rank)
// @access  Private (Admins, Teachers, or matching Student)
exports.getStudentGamificationStatus = async (req, res) => {
  let { studentId } = req.params;
  const pool = getPool();

  try {
    // Resolve own student ID if token matches student role
    if (studentId === 'me') {
      const [ownStudent] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (ownStudent.length === 0) {
        return res.status(404).json({ message: 'No student profile associated with this user.' });
      }
      studentId = ownStudent[0].id;
    } else {
      // Authorization check: Students can only query themselves
      if (req.user.role === 'student') {
        const [ownStudent] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
        if (ownStudent.length === 0 || ownStudent[0].id !== parseInt(studentId)) {
          return res.status(403).json({ message: 'Access denied: You can only view your own gamification profile.' });
        }
      }
    }

    // Verify student exists
    const [studentCheck] = await pool.query(`
      SELECT s.id AS student_id, u.name, s.roll_no, s.class_grade
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [studentId]);

    if (studentCheck.length === 0) {
      return res.status(404).json({ message: 'Student record not found in system.' });
    }

    const studentInfo = studentCheck[0];

    // Trigger auto-award checks for system badges
    await checkAndAwardSystemBadges(pool, studentId);

    // Calculate Points Breakdown
    const [att] = await pool.query("SELECT COUNT(*) AS count FROM attendance WHERE student_id = ? AND status = 'present'", [studentId]);
    const attendancePoints = att[0].count * 10;

    const [exams] = await pool.query("SELECT COUNT(*) AS count FROM marks WHERE student_id = ? AND exam_type != 'HW_ASK'", [studentId]);
    const examPoints = exams[0].count * 20;

    const [hw] = await pool.query("SELECT COUNT(*) AS count FROM marks WHERE student_id = ? AND exam_type = 'HW_ASK'", [studentId]);
    const hwPoints = hw[0].count * 10;

    const [manual] = await pool.query("SELECT IFNULL(SUM(points), 0) AS total FROM points_log WHERE student_id = ?", [studentId]);
    const manualPoints = parseInt(manual[0].total);

    const totalPoints = attendancePoints + examPoints + hwPoints + manualPoints;

    // Fetch earned badges details
    const [badges] = await pool.query(`
      SELECT b.id, b.name, b.description, b.icon, b.type, sb.awarded_at, u.name AS awarded_by_name
      FROM student_badges sb
      JOIN badges b ON sb.badge_id = b.id
      LEFT JOIN users u ON sb.awarded_by = u.id
      WHERE sb.student_id = ?
      ORDER BY sb.awarded_at DESC
    `, [studentId]);

    // Fetch manual points transaction history
    const [pointsHistory] = await pool.query(`
      SELECT id, points, category, description, created_at
      FROM points_log
      WHERE student_id = ?
      ORDER BY created_at DESC
    `, [studentId]);

    // Get rank from leaderboard
    const allRankings = await calculateAllStudentsPoints(pool);
    const matchedRank = allRankings.find(r => r.student_id === parseInt(studentId));
    const rank = matchedRank ? matchedRank.rank : 1;

    return res.json({
      student_id: studentInfo.student_id,
      name: studentInfo.name,
      roll_no: studentInfo.roll_no,
      class_grade: studentInfo.class_grade,
      rank,
      totalPoints,
      pointsBreakdown: {
        attendance: attendancePoints,
        assignments: examPoints,
        homeworkHelper: hwPoints,
        manual: manualPoints
      },
      badges,
      pointsHistory
    });

  } catch (err) {
    console.error('Error fetching student gamification profile:', err);
    return res.status(500).json({ message: 'Internal server error computing gamification parameters.' });
  }
};

// @route   GET api/gamification/leaderboard
// @desc    Get list of all students ranked by points
// @access  Private (All Authenticated Users)
exports.getLeaderboard = async (req, res) => {
  const pool = getPool();
  try {
    const leaderboard = await calculateAllStudentsPoints(pool);
    return res.json(leaderboard);
  } catch (err) {
    console.error('Error compiling leaderboard rankings:', err);
    return res.status(500).json({ message: 'Internal server error compiling leaderboard rankings.' });
  }
};

// @route   GET api/gamification/badges
// @desc    Get list of all available badges
// @access  Private (All Authenticated Users)
exports.getBadges = async (req, res) => {
  const pool = getPool();
  try {
    const [badges] = await pool.query('SELECT * FROM badges ORDER BY type ASC, name ASC');
    return res.json(badges);
  } catch (err) {
    console.error('Error fetching badges database:', err);
    return res.status(500).json({ message: 'Internal server error fetching badges database.' });
  }
};

// @route   POST api/gamification/badges
// @desc    Create a new customizable badge
// @access  Private (Teachers & Admins Only)
exports.createBadge = async (req, res) => {
  const { name, description, icon } = req.body;

  if (!name || !description || !icon) {
    return res.status(400).json({ message: 'Name, description, and icon (emoji/symbol) are required.' });
  }

  const pool = getPool();
  try {
    // Check if name already exists
    const [existing] = await pool.query('SELECT id FROM badges WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A badge with this name already exists.' });
    }

    await pool.query(
      'INSERT INTO badges (name, description, icon, type) VALUES (?, ?, ?, "custom")',
      [name, description, icon]
    );

    return res.status(201).json({ message: 'Custom badge created successfully!' });
  } catch (err) {
    console.error('Error creating custom badge:', err);
    return res.status(500).json({ message: 'Internal server error creating custom badge.' });
  }
};

// @route   POST api/gamification/award-badge
// @desc    Award a badge to a student
// @access  Private (Teachers & Admins Only)
exports.awardBadge = async (req, res) => {
  const { studentId, badgeId } = req.body;

  if (!studentId || !badgeId) {
    return res.status(400).json({ message: 'studentId and badgeId are required.' });
  }

  const pool = getPool();
  try {
    // Verify student exists
    const [student] = await pool.query('SELECT id FROM students WHERE id = ?', [studentId]);
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student record not found.' });
    }

    // Verify badge exists
    const [badge] = await pool.query('SELECT id FROM badges WHERE id = ?', [badgeId]);
    if (badge.length === 0) {
      return res.status(404).json({ message: 'Badge record not found.' });
    }

    // Award badge (ignore if duplicate)
    const [result] = await pool.query(
      'INSERT IGNORE INTO student_badges (student_id, badge_id, awarded_by) VALUES (?, ?, ?)',
      [studentId, badgeId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'This student has already been awarded this badge.' });
    }

    return res.status(201).json({ message: 'Badge successfully awarded to student!' });
  } catch (err) {
    console.error('Error awarding student badge:', err);
    return res.status(500).json({ message: 'Internal server error awarding badge.' });
  }
};

// @route   POST api/gamification/award-points
// @desc    Award manual points to a student (e.g. participation, bonus assignment)
// @access  Private (Teachers & Admins Only)
exports.awardPoints = async (req, res) => {
  const { studentId, points, category, description } = req.body;

  if (!studentId || !points || !category || !description) {
    return res.status(400).json({ message: 'studentId, points, category, and description are required.' });
  }

  const numericPoints = parseInt(points);
  if (isNaN(numericPoints) || numericPoints <= 0) {
    return res.status(400).json({ message: 'Points must be a positive integer.' });
  }

  const validCategories = ['attendance', 'assignment', 'participation', 'homework_helper'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ message: 'Invalid category specified.' });
  }

  const pool = getPool();
  try {
    // Verify student exists
    const [student] = await pool.query('SELECT id FROM students WHERE id = ?', [studentId]);
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student record not found.' });
    }

    await pool.query(
      'INSERT INTO points_log (student_id, points, category, description) VALUES (?, ?, ?, ?)',
      [studentId, numericPoints, category, description]
    );

    return res.status(201).json({ message: 'Points successfully awarded to student!' });
  } catch (err) {
    console.error('Error logging points for student:', err);
    return res.status(500).json({ message: 'Internal server error awarding points.' });
  }
};
