const { getPool } = require('../config/db');

// Helper to fetch details by studentId
async function fetchStudentProfileDetails(studentId, pool) {
  // 1. Fetch student info
  const [studentRows] = await pool.query(`
    SELECT s.id AS student_id, u.name, s.roll_no, s.class_grade, u.email
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `, [studentId]);

  if (studentRows.length === 0) {
    return null;
  }
  const student = studentRows[0];

  // 2. Fetch skill levels (create default if not exists)
  const [skillRows] = await pool.query(`
    SELECT coding, sports, arts, communication
    FROM student_skills
    WHERE student_id = ?
  `, [studentId]);

  let skills = { coding: 0, sports: 0, arts: 0, communication: 0 };
  if (skillRows.length > 0) {
    skills = skillRows[0];
  } else {
    // Insert initial record
    await pool.query(`
      INSERT INTO student_skills (student_id, coding, sports, arts, communication)
      VALUES (?, 0, 0, 0, 0)
    `, [studentId]);
  }

  // 3. Fetch achievements
  const [achievements] = await pool.query(`
    SELECT id, title, category, description, date_earned, proof_url, created_at
    FROM student_achievements
    WHERE student_id = ?
    ORDER BY date_earned DESC
  `, [studentId]);

  return {
    student,
    skills,
    achievements
  };
}

// @route   GET api/skills/student/:studentId
// @desc    Get student skills and achievements (Admin, Teacher, Student, Parent)
// @access  Private
exports.getStudentProfile = async (req, res) => {
  const { studentId } = req.params;
  const pool = getPool();

  try {
    // Role-based validation
    if (req.user.role === 'student') {
      const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0 || studentRows[0].id !== parseInt(studentId)) {
        return res.status(403).json({ message: 'Unauthorized. Students can only view their own profile.' });
      }
    } else if (req.user.role === 'parent') {
      const [parentRows] = await pool.query('SELECT student_id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parentRows.length === 0 || parentRows[0].student_id !== parseInt(studentId)) {
        return res.status(403).json({ message: 'Unauthorized. Parents can only view their child\'s profile.' });
      }
    }

    const details = await fetchStudentProfileDetails(studentId, pool);
    if (!details) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    res.json(details);
  } catch (err) {
    console.error('Error fetching student skill profile:', err);
    res.status(500).json({ message: 'Server error retrieving skill profile.' });
  }
};

// @route   GET api/skills
// @desc    Get current student's skills and achievements (resolves parent's child ID too)
// @access  Private (Students & Parents only)
exports.getMyProfile = async (req, res) => {
  const pool = getPool();
  try {
    let studentId;
    
    if (req.user.role === 'student') {
      const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0) {
        return res.status(404).json({ message: 'Student profile not found.' });
      }
      studentId = studentRows[0].id;
    } else if (req.user.role === 'parent') {
      const [parentRows] = await pool.query('SELECT student_id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parentRows.length === 0) {
        return res.status(404).json({ message: 'Linked child student profile not found.' });
      }
      studentId = parentRows[0].student_id;
    } else {
      return res.status(400).json({ message: 'Only students and parents can query dynamic profiles.' });
    }

    const details = await fetchStudentProfileDetails(studentId, pool);
    if (!details) {
      return res.status(404).json({ message: 'Skill profile not found.' });
    }

    res.json(details);
  } catch (err) {
    console.error('Error fetching self skill profile:', err);
    res.status(500).json({ message: 'Server error retrieving skill profile.' });
  }
};

// @route   POST api/skills/student/:studentId
// @desc    Update student skill levels (Admin & Teachers only)
// @access  Private (Admin, Teacher)
exports.updateStudentSkills = async (req, res) => {
  const { studentId } = req.params;
  const { coding, sports, arts, communication } = req.body;

  if (coding === undefined || sports === undefined || arts === undefined || communication === undefined) {
    return res.status(400).json({ message: 'All skill scores (coding, sports, arts, communication) are required.' });
  }

  const scores = [parseInt(coding), parseInt(sports), parseInt(arts), parseInt(communication)];
  if (scores.some(s => isNaN(s) || s < 0 || s > 100)) {
    return res.status(400).json({ message: 'Skill values must be valid integers between 0 and 100.' });
  }

  const pool = getPool();
  try {
    // Verify student exists
    const [studentRows] = await pool.query('SELECT id FROM students WHERE id = ?', [studentId]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student record not found.' });
    }

    // Insert or update scores
    await pool.query(`
      INSERT INTO student_skills (student_id, coding, sports, arts, communication)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE coding = ?, sports = ?, arts = ?, communication = ?
    `, [studentId, coding, sports, arts, communication, coding, sports, arts, communication]);

    res.json({
      message: 'Student skill profile updated successfully!',
      skills: { coding, sports, arts, communication }
    });
  } catch (err) {
    console.error('Error updating student skills:', err);
    res.status(500).json({ message: 'Server error updating student skills.' });
  }
};

// @route   POST api/skills/achievements
// @desc    Add a portfolio achievement (Student, Teacher, Admin)
// @access  Private
exports.addAchievement = async (req, res) => {
  const { studentId, title, category, description, date_earned, proof_url } = req.body;

  if (!studentId || !title || !category || !date_earned) {
    return res.status(400).json({ message: 'Student ID, title, category, and date earned are required fields.' });
  }

  const validCategories = ['coding', 'sports', 'arts', 'communication', 'academic', 'other'];
  if (!validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({ message: `Category must be one of: ${validCategories.join(', ')}` });
  }

  const pool = getPool();
  try {
    // Role-based validation
    if (req.user.role === 'student') {
      const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0 || studentRows[0].id !== parseInt(studentId)) {
        return res.status(403).json({ message: 'Unauthorized. Students can only upload achievements to their own profile.' });
      }
    } else if (req.user.role === 'parent') {
      const [parentRows] = await pool.query('SELECT student_id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parentRows.length === 0 || parentRows[0].student_id !== parseInt(studentId)) {
        return res.status(403).json({ message: 'Unauthorized. Parents can only manage achievements for their child.' });
      }
    }

    // Verify student exists
    const [studentExists] = await pool.query('SELECT id FROM students WHERE id = ?', [studentId]);
    if (studentExists.length === 0) {
      return res.status(404).json({ message: 'Student record not found.' });
    }

    // Save achievement record
    const [result] = await pool.query(`
      INSERT INTO student_achievements (student_id, title, category, description, date_earned, proof_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [studentId, title, category.toLowerCase(), description || null, date_earned, proof_url || null]);

    res.status(201).json({
      message: 'Achievement successfully added to portfolio!',
      achievement_id: result.insertId
    });

  } catch (err) {
    console.error('Error adding student achievement:', err);
    res.status(500).json({ message: 'Server error saving achievement record.' });
  }
};

// @route   DELETE api/skills/achievements/:id
// @desc    Delete portfolio achievement (Student can delete their own; Admin/Teachers can delete any)
// @access  Private
exports.deleteAchievement = async (req, res) => {
  const { id } = req.params;
  const pool = getPool();

  try {
    // 1. Fetch achievement to identify owner student
    const [achRows] = await pool.query('SELECT student_id FROM student_achievements WHERE id = ?', [id]);
    if (achRows.length === 0) {
      return res.status(404).json({ message: 'Achievement record not found.' });
    }
    const studentId = achRows[0].student_id;

    // 2. Validate ownership for student / parent roles
    if (req.user.role === 'student') {
      const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0 || studentRows[0].id !== studentId) {
        return res.status(403).json({ message: 'Unauthorized. Students can only remove achievements from their own profile.' });
      }
    } else if (req.user.role === 'parent') {
      const [parentRows] = await pool.query('SELECT student_id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parentRows.length === 0 || parentRows[0].student_id !== studentId) {
        return res.status(403).json({ message: 'Unauthorized. Parents can only manage achievements for their child.' });
      }
    }

    // 3. Delete achievement
    await pool.query('DELETE FROM student_achievements WHERE id = ?', [id]);

    res.json({ message: 'Achievement successfully removed from portfolio.' });

  } catch (err) {
    console.error('Error deleting student achievement:', err);
    res.status(500).json({ message: 'Server error removing achievement record.' });
  }
};
