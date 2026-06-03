const { getPool } = require('../config/db');

// @route   POST api/exams
// @desc    Create a new MCQ exam with questions (Teachers/Admins only)
// @access  Private (Teacher, Admin)
exports.createExam = async (req, res) => {
  const { title, subject, class_grade, duration_minutes, questions } = req.body;

  if (!title || !subject || !class_grade || !duration_minutes || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Title, subject, class grade, duration, and questions list are required.' });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Resolve teacher ID (if teacher role, otherwise map to first teacher as placeholder if admin creator)
    let teacherId;
    if (req.user.role === 'teacher') {
      const [tRows] = await connection.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (tRows.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Teacher profile not found for this user.' });
      }
      teacherId = tRows[0].id;
    } else {
      const [firstT] = await connection.query('SELECT id FROM teachers LIMIT 1');
      if (firstT.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'No faculty members registered to link exam.' });
      }
      teacherId = firstT[0].id;
    }

    // 2. Insert Exam details
    const [examResult] = await connection.query(`
      INSERT INTO exams (teacher_id, title, subject, class_grade, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `, [teacherId, title, subject, class_grade, parseInt(duration_minutes)]);

    const examId = examResult.insertId;

    // 3. Insert questions list
    for (const q of questions) {
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_option) {
        throw new Error('All question fields (text, options A-D, and correct option) are required.');
      }
      await connection.query(`
        INSERT INTO exam_questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [examId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option.toUpperCase()]);
    }

    await connection.commit();
    connection.release();

    res.status(201).json({ message: 'Online MCQ exam created successfully!', exam_id: examId });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error creating exam:', err);
    res.status(500).json({ message: err.message || 'Server error creating online exam.' });
  }
};

// @route   GET api/exams
// @desc    Get all exams (Students get matching grade class exams, Teachers get all)
// @access  Private
exports.getExams = async (req, res) => {
  const pool = getPool();

  try {
    if (req.user.role === 'student') {
      // 1. Resolve student details
      const [studentRows] = await pool.query('SELECT id, class_grade FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0) {
        return res.status(404).json({ message: 'Student profile not found.' });
      }
      const studentId = studentRows[0].id;
      const classGrade = studentRows[0].class_grade;

      // 2. Get matching exams with student submissions flagged
      const [exams] = await pool.query(`
        SELECT e.id, e.title, e.subject, e.duration_minutes, e.created_at,
               es.score_obtained, es.total_score,
               IF(es.id IS NOT NULL, 1, 0) AS is_submitted
        FROM exams e
        LEFT JOIN exam_submissions es ON e.id = es.exam_id AND es.student_id = ?
        WHERE e.class_grade = ?
        ORDER BY e.created_at DESC
      `, [studentId, classGrade]);

      res.json(exams);

    } else {
      // Teachers/Admins: view all exams published
      const [exams] = await pool.query(`
        SELECT e.id, e.title, e.subject, e.class_grade, e.duration_minutes, e.created_at, u.name AS teacher_name
        FROM exams e
        JOIN teachers t ON e.teacher_id = t.id
        JOIN users u ON t.user_id = u.id
        ORDER BY e.created_at DESC
      `);

      res.json(exams);
    }

  } catch (err) {
    console.error('Error fetching exams list:', err);
    res.status(500).json({ message: 'Server error retrieving exams catalog.' });
  }
};

// @route   GET api/exams/:id
// @desc    Get single exam details and questions (Omit correct answers for students!)
// @access  Private
exports.getExamById = async (req, res) => {
  const { id } = req.params; // exam_id
  const pool = getPool();

  try {
    // 1. Fetch exam metadata
    const [exams] = await pool.query(`
      SELECT e.id, e.title, e.subject, e.class_grade, e.duration_minutes, e.created_at, u.name AS teacher_name
      FROM exams e
      JOIN teachers t ON e.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE e.id = ?
    `, [id]);

    if (exams.length === 0) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    const exam = exams[0];

    // 2. Fetch questions. Omit correct option for students to prevent source inspection cheating!
    let questionsQuery = '';
    if (req.user.role === 'student') {
      questionsQuery = `
        SELECT id, question_text, option_a, option_b, option_c, option_d 
        FROM exam_questions 
        WHERE exam_id = ?
        ORDER BY id ASC
      `;
    } else {
      questionsQuery = `
        SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
        FROM exam_questions 
        WHERE exam_id = ?
        ORDER BY id ASC
      `;
    }

    const [questions] = await pool.query(questionsQuery, [id]);

    res.json({
      exam,
      questions
    });

  } catch (err) {
    console.error('Error fetching exam detail:', err);
    res.status(500).json({ message: 'Server error fetching exam details.' });
  }
};

// @route   POST api/exams/:id/submit
// @desc    Evaluate student selections and save results (Student only)
// @access  Private (Student)
exports.submitExamAnswers = async (req, res) => {
  const { id } = req.params; // exam_id
  const { answers } = req.body; // format: { [questionId]: 'A'/'B'/'C'/'D' }

  if (!answers) {
    return res.status(400).json({ message: 'Submitting answers requires selected responses.' });
  }

  const pool = getPool();

  try {
    // 1. Resolve student ID
    const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    const studentId = studentRows[0].id;

    // 2. Check if already submitted
    const [submissionCheck] = await pool.query(
      'SELECT id FROM exam_submissions WHERE exam_id = ? AND student_id = ?',
      [id, studentId]
    );
    if (submissionCheck.length > 0) {
      return res.status(400).json({ message: 'You have already submitted responses for this online exam.' });
    }

    // 3. Fetch exam metadata
    const [exams] = await pool.query('SELECT title, subject FROM exams WHERE id = ?', [id]);
    if (exams.length === 0) {
      return res.status(404).json({ message: 'Exam not found.' });
    }
    const exam = exams[0];

    // 4. Fetch correct answers list
    const [questions] = await pool.query('SELECT id, correct_option FROM exam_questions WHERE exam_id = ?', [id]);
    if (questions.length === 0) {
      return res.status(400).json({ message: 'This exam contains no questions.' });
    }

    let scoreObtained = 0;
    const totalScore = questions.length;
    const correctOptionsMap = {};

    questions.forEach((q) => {
      correctOptionsMap[q.id] = q.correct_option;
      const studentSelection = answers[q.id];
      if (studentSelection && studentSelection.toUpperCase() === q.correct_option.toUpperCase()) {
        scoreObtained++;
      }
    });

    const percentage = parseFloat(((scoreObtained / totalScore) * 100).toFixed(2));
    const passed = percentage >= 50.0;

    // 5. Save submission record
    await pool.query(`
      INSERT INTO exam_submissions (exam_id, student_id, score_obtained, total_score)
      VALUES (?, ?, ?, ?)
    `, [id, studentId, scoreObtained, totalScore]);

    // 6. Integrate grade into report card marks table
    await pool.query(`
      INSERT INTO marks (student_id, subject, marks_obtained, max_marks, exam_type, exam_date)
      VALUES (?, ?, ?, ?, ?, CURDATE())
    `, [studentId, exam.subject, scoreObtained, totalScore, `Online MCQ: ${exam.title}`]);

    res.status(201).json({
      message: 'Exam successfully graded and saved!',
      results: {
        score_obtained: scoreObtained,
        total_score: totalScore,
        percentage,
        passed,
        correct_answers: correctOptionsMap
      }
    });

  } catch (err) {
    console.error('Error auto-evaluating exam submission:', err);
    res.status(500).json({ message: 'Server error processing exam submission evaluation.' });
  }
};

// @route   GET api/exams/:id/analytics
// @desc    Get aggregate stats and list of student submissions (Admins & Teachers only)
// @access  Private (Teacher, Admin)
exports.getExamAnalytics = async (req, res) => {
  const { id } = req.params; // exam_id
  const pool = getPool();

  try {
    // 1. Verify exam
    const [exams] = await pool.query('SELECT * FROM exams WHERE id = ?', [id]);
    if (exams.length === 0) {
      return res.status(404).json({ message: 'Exam record not found.' });
    }
    const exam = exams[0];

    // 2. Fetch stats aggregates
    const [statsRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_submissions,
        ROUND(AVG((score_obtained / total_score) * 100), 2) AS avg_percentage,
        MAX(score_obtained) AS max_score,
        MIN(score_obtained) AS min_score
      FROM exam_submissions
      WHERE exam_id = ?
    `, [id]);

    const stats = statsRows[0];
    const totalSubmissions = stats.total_submissions;

    // Get pass counts (score >= 50%)
    const [passRows] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM exam_submissions
      WHERE exam_id = ? AND (score_obtained / total_score) >= 0.5
    `, [id]);

    const passedCount = passRows[0].count;
    const passRate = totalSubmissions > 0 ? parseFloat(((passedCount / totalSubmissions) * 100).toFixed(2)) : 0;

    // 3. Fetch submissions list
    const [submissions] = await pool.query(`
      SELECT es.id, u.name AS student_name, s.roll_no, s.class_grade, es.score_obtained, es.total_score, es.submitted_at
      FROM exam_submissions es
      JOIN students s ON es.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE es.exam_id = ?
      ORDER BY es.submitted_at DESC
    `, [id]);

    res.json({
      exam,
      summary: {
        total_submissions: totalSubmissions,
        avg_percentage: stats.avg_percentage || 0,
        max_score: stats.max_score || 0,
        min_score: stats.min_score || 0,
        pass_rate: passRate,
        passed_count: passedCount,
        failed_count: totalSubmissions - passedCount
      },
      submissions
    });

  } catch (err) {
    console.error('Error fetching exam analytics:', err);
    res.status(500).json({ message: 'Server error compiling exam analytics.' });
  }
};

// @route   GET api/exams/student/dashboard
// @desc    Get student exam stats and comparative class averages
// @access  Private (Student only)
exports.getStudentExamDashboard = async (req, res) => {
  const pool = getPool();

  try {
    // 1. Resolve student ID
    const [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    const studentId = studentRows[0].id;

    // 2. Fetch student general submission stats
    const [submissions] = await pool.query(`
      SELECT es.exam_id, e.title, e.subject, es.score_obtained, es.total_score, es.submitted_at
      FROM exam_submissions es
      JOIN exams e ON es.exam_id = e.id
      WHERE es.student_id = ?
      ORDER BY es.submitted_at DESC
    `, [studentId]);

    const totalSubmissions = submissions.length;
    let totalScoreObtained = 0;
    let totalScoreExpected = 0;
    
    // 3. For each student submission, compute the overall class average for comparison
    const examComparisons = [];
    for (const sub of submissions) {
      totalScoreObtained += sub.score_obtained;
      totalScoreExpected += sub.total_score;

      const [classAvgRow] = await pool.query(`
        SELECT AVG((score_obtained / total_score) * 100) AS avg_pct
        FROM exam_submissions
        WHERE exam_id = ?
      `, [sub.exam_id]);

      const classAvgPct = parseFloat(classAvgRow[0].avg_pct) || 0;
      const studentPct = (sub.score_obtained / sub.total_score) * 100;

      examComparisons.push({
        exam_id: sub.exam_id,
        title: sub.title,
        subject: sub.subject,
        score_obtained: sub.score_obtained,
        total_score: sub.total_score,
        student_percentage: parseFloat(studentPct.toFixed(2)),
        class_average_percentage: parseFloat(classAvgPct.toFixed(2)),
        submitted_at: sub.submitted_at
      });
    }

    const overallPercentage = totalScoreExpected > 0 ? parseFloat(((totalScoreObtained / totalScoreExpected) * 100).toFixed(2)) : 0;

    res.json({
      summary: {
        total_exams_taken: totalSubmissions,
        overall_percentage: overallPercentage
      },
      comparisons: examComparisons
    });

  } catch (err) {
    console.error('Error fetching student exam dashboard:', err);
    res.status(500).json({ message: 'Server error compiling student quiz stats.' });
  }
};
