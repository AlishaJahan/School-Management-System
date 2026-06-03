const { getPool } = require('../config/db');

// Helper for rounding in JavaScript
function round(value, decimals) {
  if (value === null || value === undefined) return 0;
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

// @route   GET api/performance/metrics/:teacherId
// @desc    Get complete performance analytics for a teacher
// @access  Private (Admins can view any, Teachers can view their own)
exports.getTeacherPerformanceMetrics = async (req, res) => {
  let teacherId;
  const pool = getPool();

  try {
    // 1. Resolve Teacher ID based on role
    if (req.user.role === 'teacher') {
      const [teacherRows] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacherRows.length === 0) {
        return res.status(404).json({ message: 'Teacher profile not found for this user.' });
      }
      teacherId = teacherRows[0].id;
    } else if (req.user.role === 'admin') {
      const paramId = req.params.teacherId;
      if (paramId === 'me' || !paramId) {
        // Admin querying 'me' - default to the first teacher
        const [firstTeacher] = await pool.query('SELECT id FROM teachers LIMIT 1');
        if (firstTeacher.length === 0) {
          return res.status(404).json({ message: 'No teachers registered in the system.' });
        }
        teacherId = firstTeacher[0].id;
      } else {
        teacherId = parseInt(paramId);
        if (isNaN(teacherId)) {
          return res.status(400).json({ message: 'Invalid teacher ID specified.' });
        }
      }
    } else {
      return res.status(403).json({ message: 'Access denied. Unauthorized role.' });
    }

    // 2. Fetch Teacher Details
    const [teacherInfoRows] = await pool.query(`
      SELECT t.id AS teacher_id, u.name, u.email, t.subject, t.joining_date, t.status 
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [teacherId]);

    if (teacherInfoRows.length === 0) {
      return res.status(404).json({ message: 'Teacher record not found.' });
    }
    const teacherInfo = teacherInfoRows[0];

    // 3. Calculate Class Performance Statistics
    const teacherSubject = teacherInfo.subject;
    let subjectFilter = '';
    let queryParams = [];

    if (teacherSubject === 'Computer Science') {
      subjectFilter = "m.subject IN ('Computer Science', 'Database Systems', 'Web Technologies')";
    } else if (teacherSubject === 'Mathematics') {
      subjectFilter = "m.subject IN ('Mathematics', 'Applied Mathematics')";
    } else {
      subjectFilter = "m.subject = ?";
      queryParams.push(teacherSubject);
    }

    const [classStatsRows] = await pool.query(`
      SELECT 
        m.subject, 
        s.class_grade, 
        ROUND(AVG(m.marks_obtained), 2) AS avg_marks,
        MAX(m.marks_obtained) AS max_marks,
        MIN(m.marks_obtained) AS min_marks,
        COUNT(m.id) AS total_exams_recorded,
        ROUND(SUM(CASE WHEN m.marks_obtained >= 50 THEN 1 ELSE 0 END) / COUNT(m.id) * 100, 2) AS pass_rate
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE ${subjectFilter}
      GROUP BY m.subject, s.class_grade
      ORDER BY s.class_grade, m.subject
    `, queryParams);

    // 4. Calculate Assignment Completion Rates
    const [assignments] = await pool.query(`
      SELECT id, title, class_grade, due_date, created_at
      FROM assignments
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `, [teacherId]);

    const assignmentMetrics = [];
    for (const ass of assignments) {
      // Get expected students in this class grade
      const [studentCountRows] = await pool.query(
        'SELECT COUNT(*) AS count FROM students WHERE class_grade = ?',
        [ass.class_grade]
      );
      const expectedStudents = studentCountRows[0].count;

      // Get submission counts for this assignment
      const [subRows] = await pool.query(`
        SELECT 
          s.id AS student_id,
          sub.status,
          sub.submitted_at
        FROM students s
        LEFT JOIN assignment_submissions sub ON s.id = sub.student_id AND sub.assignment_id = ?
        WHERE s.class_grade = ?
      `, [ass.id, ass.class_grade]);

      let submittedCount = 0;
      let lateCount = 0;
      let missingCount = 0;

      const dueDateObj = new Date(ass.due_date);
      // Set to end of the due date day (23:59:59)
      dueDateObj.setHours(23, 59, 59, 999);
      const currentDate = new Date();

      for (const row of subRows) {
        if (row.status === 'submitted') {
          submittedCount++;
        } else if (row.status === 'late') {
          lateCount++;
        } else if (row.status === 'missing') {
          missingCount++;
        } else {
          // No submission row exists
          if (dueDateObj < currentDate) {
            missingCount++; // past due date -> missing
          } else {
            // Not due yet, but let's count as missing for simple graph metrics or keep it as unsubmitted.
            // Let's count it as missing for visual simplicity.
            missingCount++;
          }
        }
      }

      const totalSubmissions = submittedCount + lateCount;
      const completionRate = expectedStudents > 0 ? round((totalSubmissions / expectedStudents) * 100, 2) : 0;

      assignmentMetrics.push({
        id: ass.id,
        title: ass.title,
        class_grade: ass.class_grade,
        due_date: ass.due_date,
        created_at: ass.created_at,
        expected_students: expectedStudents,
        submitted_count: submittedCount,
        late_count: lateCount,
        missing_count: missingCount,
        completion_rate: completionRate
      });
    }

    // 5. Retrieve Student Feedback Scores
    const [ratingStatsRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_feedbacks,
        ROUND(AVG(rating), 2) AS avg_rating
      FROM teacher_feedback
      WHERE teacher_id = ?
    `, [teacherId]);

    const totalFeedbacks = ratingStatsRows[0].total_feedbacks;
    const avgRating = ratingStatsRows[0].avg_rating || 0;

    const [ratingBreakdownRows] = await pool.query(`
      SELECT rating, COUNT(*) AS count
      FROM teacher_feedback
      WHERE teacher_id = ?
      GROUP BY rating
    `, [teacherId]);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingBreakdownRows.forEach(row => {
      ratingDistribution[row.rating] = row.count;
    });

    const [comments] = await pool.query(`
      SELECT rating, comment, created_at
      FROM teacher_feedback
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `, [teacherId]);

    const feedback = {
      averageRating: avgRating,
      totalCount: totalFeedbacks,
      distribution: ratingDistribution,
      comments: comments
    };

    // 6. Return Payload
    res.json({
      teacherInfo,
      classPerformance: classStatsRows,
      assignments: assignmentMetrics,
      feedback
    });

  } catch (err) {
    console.error('Error fetching teacher performance metrics:', err);
    res.status(500).json({ message: 'Internal server error computing performance metrics.' });
  }
};

// @route   GET api/performance/teachers
// @desc    Get list of all active teachers
// @access  Private (All Authenticated Users)
exports.getTeachersList = async (req, res) => {
  try {
    const pool = getPool();
    const [teachers] = await pool.query(`
      SELECT t.id AS teacher_id, u.name, t.subject 
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'active'
      ORDER BY u.name ASC
    `);
    res.json(teachers);
  } catch (err) {
    console.error('Error fetching teachers list:', err);
    res.status(500).json({ message: 'Server error fetching teachers list.' });
  }
};

// @route   POST api/performance/feedback
// @desc    Submit anonymous feedback for a teacher
// @access  Private (Students only)
exports.submitTeacherFeedback = async (req, res) => {
  const { teacherId, rating, comment } = req.body;

  if (!teacherId || !rating) {
    return res.status(400).json({ message: 'Teacher ID and Rating (1-5) are required.' });
  }

  const numericRating = parseInt(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    const pool = getPool();
    
    // Resolve student ID from logged-in user
    const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Only registered students can submit teacher feedback.' });
    }
    const studentId = studentRows[0].id;

    // Check if teacher exists
    const [teacherRows] = await pool.query('SELECT id FROM teachers WHERE id = ?', [teacherId]);
    if (teacherRows.length === 0) {
      return res.status(404).json({ message: 'Teacher record not found.' });
    }

    // Insert anonymous feedback
    await pool.query(`
      INSERT INTO teacher_feedback (teacher_id, student_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `, [teacherId, studentId, numericRating, comment || null]);

    res.status(201).json({ message: 'Thank you! Your feedback has been anonymously submitted.' });

  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Server error submitting teacher feedback.' });
  }
};

// @route   POST api/performance/assignments
// @desc    Create a new assignment for a class
// @access  Private (Teachers only)
exports.createAssignment = async (req, res) => {
  const { title, class_grade, due_date } = req.body;

  if (!title || !class_grade || !due_date) {
    return res.status(400).json({ message: 'Title, class grade, and due date are required.' });
  }

  try {
    const pool = getPool();
    
    // Resolve teacher ID from logged-in user
    const [teacherRows] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teacherRows.length === 0) {
      return res.status(404).json({ message: 'Only registered teachers can create assignments.' });
    }
    const teacherId = teacherRows[0].id;

    // Insert assignment
    await pool.query(`
      INSERT INTO assignments (teacher_id, title, class_grade, due_date)
      VALUES (?, ?, ?, ?)
    `, [teacherId, title, class_grade, due_date]);

    res.status(201).json({ message: 'Assignment successfully created!' });

  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).json({ message: 'Server error creating assignment.' });
  }
};
