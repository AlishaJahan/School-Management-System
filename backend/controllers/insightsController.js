const { getPool } = require('../config/db');

// Helper function to calculate student statistics and generate AI suggestions
function runAISuggestionEngine(studentName, marks, attendance, classGrade) {
  // 1. Calculate average marks
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
  } else {
    avgMarks = 0;
  }

  // 2. Calculate attendance rate
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

  // 3. AI Predictive Risk Assessment
  let riskLevel = 'Low';
  let riskScore = 15; // out of 100
  const riskReasons = [];

  if (attendanceRate < 75) {
    riskLevel = 'High';
    riskScore += 45;
    riskReasons.push('Critical attendance drop: Attendance is below 75% threshold');
  } else if (attendanceRate < 85) {
    riskScore += 20;
    riskReasons.push('Sub-optimal attendance: Below 85% recommended rate');
  }

  const failingSubjects = [];
  const weakSubjects = [];
  const strongSubjects = [];

  Object.keys(subjectAverages).forEach(sub => {
    const avg = subjectAverages[sub].average;
    if (avg < 50) {
      failingSubjects.push(sub);
    } else if (avg < 65) {
      weakSubjects.push(sub);
    } else if (avg >= 85) {
      strongSubjects.push(sub);
    }
  });

  if (failingSubjects.length > 0) {
    riskLevel = 'High';
    riskScore += 35;
    riskReasons.push(`Failing trend in subjects: ${failingSubjects.join(', ')} (< 50%)`);
  } else if (weakSubjects.length > 0) {
    riskScore += 15;
    if (riskLevel !== 'High') riskLevel = 'Medium';
    riskReasons.push(`Needs academic focus in: ${weakSubjects.join(', ')} (< 65%)`);
  }

  if (avgMarks > 0 && avgMarks < 50) {
    riskLevel = 'High';
    riskScore = Math.max(riskScore, 80);
  } else if (avgMarks > 0 && avgMarks < 65) {
    if (riskLevel !== 'High') riskLevel = 'Medium';
    riskScore = Math.max(riskScore, 45);
  }

  // Cap risk score
  riskScore = Math.min(riskScore, 100);

  // 4. Personalized AI Suggestions Generator
  const suggestions = [];

  if (attendanceRate < 75) {
    suggestions.push({
      id: 1,
      category: 'Attendance',
      task: `Mandatory Attendance Retrieval: Attend the morning remedial lectures scheduled for ${classGrade} to offset absences.`,
      priority: 'high',
      completed: false
    });
    suggestions.push({
      id: 2,
      category: 'Attendance',
      task: `Mentor Check-in: Submit leave justification slips to the Academic Coordinator to clear unexcused absences.`,
      priority: 'medium',
      completed: false
    });
    suggestions.push({
      id: 3,
      category: 'Attendance',
      task: `Daily Check: Goal: Maintain 90%+ attendance for the next 15 school days.`,
      priority: 'high',
      completed: false
    });
  } else if (attendanceRate < 85) {
    suggestions.push({
      id: 1,
      category: 'Attendance',
      task: 'Consistent Check-in: Log into class strictly on time and avoid micro-absences during morning hours.',
      priority: 'medium',
      completed: false
    });
  }

  let sugId = suggestions.length + 1;

  if (failingSubjects.length > 0) {
    failingSubjects.forEach(sub => {
      suggestions.push({
        id: sugId++,
        category: 'Academic Remedial',
        task: `Urgent Remedial Tutoring: Enroll in after-school ${sub} support classes and seek peer mentoring.`,
        priority: 'high',
        completed: false
      });
      suggestions.push({
        id: sugId++,
        category: 'Study Habit',
        task: `Practice Plan: Solve weekly homework sheets for ${sub} and submit them to your subject teacher.`,
        priority: 'high',
        completed: false
      });
    });
  }

  if (weakSubjects.length > 0) {
    weakSubjects.forEach(sub => {
      suggestions.push({
        id: sugId++,
        category: 'Academic Reinforcement',
        task: `Subject Revision: Allocate an extra 45 minutes daily to revise foundational concepts of ${sub}.`,
        priority: 'medium',
        completed: false
      });
      suggestions.push({
        id: sugId++,
        category: 'Study Practice',
        task: `Formula & Concept Drills: Take mock chapter tests in ${sub} in the IT Lab library.`,
        priority: 'medium',
        completed: false
      });
    });
  }

  if (strongSubjects.length > 0 && riskLevel === 'Low') {
    strongSubjects.forEach(sub => {
      suggestions.push({
        id: sugId++,
        category: 'Advanced Enrichment',
        task: `Exhibition Project: Represent ${classGrade} in the Annual Science & Coding exhibition for ${sub}.`,
        priority: 'low',
        completed: false
      });
      suggestions.push({
        id: sugId++,
        category: 'Peer Leadership',
        task: `Peer Mentoring: Volunteer as a student-tutor for peers struggling in ${sub}.`,
        priority: 'low',
        completed: false
      });
    });
  }

  // General fallback suggestions if student is doing fine
  if (suggestions.length === 0) {
    suggestions.push({
      id: sugId++,
      category: 'General Study',
      task: 'Structured Review: Review upcoming exam syllabus rubrics and keep a daily study planner.',
      priority: 'low',
      completed: false
    });
    suggestions.push({
      id: sugId++,
      category: 'General Study',
      task: 'Consistent Performance: Maintain current excellent habits of high attendance and active in-class answers.',
      priority: 'low',
      completed: false
    });
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
    riskAssessment: {
      riskLevel,
      riskScore,
      reasons: riskReasons.length > 0 ? riskReasons : ['Excellent academic and attendance record']
    },
    subjectAverages,
    suggestions
  };
}

// @route   GET api/insights/dashboard
// @desc    Get all students computed insights & risk predictions
// @access  Private (Admins and Teachers)
exports.getDashboardInsights = async (req, res) => {
  try {
    const pool = getPool();
    
    // Fetch all students
    const [students] = await pool.query(`
      SELECT s.id AS student_id, u.name, u.email, s.roll_no, s.class_grade
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.class_grade ASC, u.name ASC
    `);

    if (students.length === 0) {
      return res.json({
        summary: { totalStudents: 0, highRisk: 0, mediumRisk: 0, averageAttendance: 100, averageMarks: 0 },
        students: []
      });
    }

    // Fetch all marks
    const [allMarks] = await pool.query('SELECT * FROM marks');
    // Fetch all attendance logs
    const [allAttendance] = await pool.query('SELECT * FROM attendance');

    // Group marks and attendance by student_id
    const marksByStudent = {};
    const attendanceByStudent = {};

    allMarks.forEach(m => {
      if (!marksByStudent[m.student_id]) marksByStudent[m.student_id] = [];
      marksByStudent[m.student_id].push(m);
    });

    allAttendance.forEach(a => {
      if (!attendanceByStudent[a.student_id]) attendanceByStudent[a.student_id] = [];
      attendanceByStudent[a.student_id].push(a);
    });

    // Run suggestion engine for each student
    const studentInsights = students.map(s => {
      const studentMarks = marksByStudent[s.student_id] || [];
      const studentAttendance = attendanceByStudent[s.student_id] || [];
      const analysis = runAISuggestionEngine(s.name, studentMarks, studentAttendance, s.class_grade);
      
      return {
        student_id: s.student_id,
        roll_no: s.roll_no,
        email: s.email,
        ...analysis
      };
    });

    // Compute summary metrics
    let totalAttendanceRate = 0;
    let totalMarksAverage = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let studentsWithMarks = 0;

    studentInsights.forEach(si => {
      totalAttendanceRate += si.metrics.attendanceRate;
      if (si.metrics.subjectsCount > 0) {
        totalMarksAverage += si.metrics.avgMarks;
        studentsWithMarks += 1;
      }
      if (si.riskAssessment.riskLevel === 'High') highRiskCount += 1;
      if (si.riskAssessment.riskLevel === 'Medium') mediumRiskCount += 1;
    });

    const summary = {
      totalStudents: students.length,
      highRisk: highRiskCount,
      mediumRisk: mediumRiskCount,
      averageAttendance: parseFloat((totalAttendanceRate / students.length).toFixed(1)),
      averageMarks: studentsWithMarks > 0 ? parseFloat((totalMarksAverage / studentsWithMarks).toFixed(1)) : 0
    };

    res.json({
      summary,
      students: studentInsights
    });

  } catch (err) {
    console.error('Error fetching dashboard insights:', err);
    res.status(500).json({ message: 'Internal server error computing performance insights' });
  }
};

// @route   GET api/insights/student/:studentId
// @desc    Get single student detailed AI suggestions report
// @access  Private (Admins, Teachers, or matching Student)
exports.getStudentInsights = async (req, res) => {
  let { studentId } = req.params;
  
  try {
    const pool = getPool();

    if (studentId === 'me') {
      const [ownStudent] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (ownStudent.length === 0) {
        return res.status(404).json({ message: 'No student profile associated with this user.' });
      }
      studentId = ownStudent[0].id;
    }

    // Verify student exists
    const [studentCheck] = await pool.query(`
      SELECT s.id AS student_id, u.name, u.email, s.roll_no, s.class_grade, u.role, u.id AS user_id
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [studentId]);

    if (studentCheck.length === 0) {
      return res.status(404).json({ message: 'Student record not found in system' });
    }

    const s = studentCheck[0];

    // Authorization: If current user is student, check if it's their own record
    if (req.user.role === 'student') {
      const [ownStudent] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (ownStudent.length === 0 || ownStudent[0].id !== parseInt(studentId)) {
        return res.status(403).json({ message: 'Access denied: You can only view your own insights.' });
      }
    }

    // Fetch marks & attendance
    const [marks] = await pool.query('SELECT * FROM marks WHERE student_id = ?', [studentId]);
    const [attendance] = await pool.query('SELECT * FROM attendance WHERE student_id = ?', [studentId]);

    const analysis = runAISuggestionEngine(s.name, marks, attendance, s.class_grade);

    // Sort marks chronological/exam-wise
    const sortedMarks = marks.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
    // Sort attendance newest first
    const sortedAttendance = attendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      student_id: s.student_id,
      roll_no: s.roll_no,
      email: s.email,
      ...analysis,
      rawMarksHistory: sortedMarks,
      rawAttendanceLogs: sortedAttendance.slice(0, 10) // last 10 logs
    });

  } catch (err) {
    console.error('Error fetching student insights:', err);
    res.status(500).json({ message: 'Internal server error computing student insights' });
  }
};

// @route   POST api/insights/suggestions/regenerate
// @desc    Regenerate personalized suggestions (Simulated deep analysis trigger)
// @access  Private (Admins & Teachers)
exports.regenerateSuggestions = async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: 'studentId is required' });
  }

  try {
    const pool = getPool();

    // Verify student
    const [studentCheck] = await pool.query(`
      SELECT s.id AS student_id, u.name, s.class_grade
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [studentId]);

    if (studentCheck.length === 0) {
      return res.status(404).json({ message: 'Student record not found in system' });
    }

    const s = studentCheck[0];

    // Fetch marks and attendance to re-run engine
    const [marks] = await pool.query('SELECT * FROM marks WHERE student_id = ?', [studentId]);
    const [attendance] = await pool.query('SELECT * FROM attendance WHERE student_id = ?', [studentId]);

    const analysis = runAISuggestionEngine(s.name, marks, attendance, s.class_grade);

    // Simulate AI computing latency of 1200ms
    setTimeout(() => {
      res.json({
        message: `Successfully re-calibrated neural diagnostic weights for ${s.name}.`,
        suggestions: analysis.suggestions,
        recalibratedAt: new Date()
      });
    }, 1200);

  } catch (err) {
    console.error('Error regenerating suggestions:', err);
    res.status(500).json({ message: 'Internal server error regenerating AI suggestions' });
  }
};
