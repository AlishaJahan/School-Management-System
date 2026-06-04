const { getPool } = require('../config/db');

// Helper to filter and calculate subject averages
function getSubjectAvg(averages, keywords) {
  const matches = averages.filter(a => 
    keywords.some(k => a.subject.toLowerCase().includes(k))
  );
  if (matches.length === 0) return 70; // Fallback score
  const sum = matches.reduce((acc, curr) => acc + parseFloat(curr.average), 0);
  return sum / matches.length;
}

// @route   GET api/career/guidance
// @desc    Get personalized career guidance report based on student performance
// @access  Private (All authenticated roles)
exports.getCareerGuidance = async (req, res) => {
  const { studentId } = req.query;

  try {
    const pool = getPool();
    let targetStudentId = null;

    // 1. Resolve student ID based on role
    if (req.user.role === 'student') {
      const [student] = await pool.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (student.length === 0) {
        return res.status(404).json({ message: 'Student profile not found.' });
      }
      targetStudentId = student[0].id;
    } else if (req.user.role === 'parent') {
      const [parent] = await pool.query('SELECT student_id FROM parents WHERE user_id = ?', [req.user.id]);
      if (parent.length === 0) {
        return res.status(404).json({ message: 'Parent profile / child association not found.' });
      }
      targetStudentId = parent[0].student_id;
    } else {
      // Admin/Teacher role can pass studentId as query param
      if (studentId) {
        targetStudentId = studentId;
      } else {
        // Fallback: fetch the first active student in the database
        const [fallbackStudent] = await pool.query('SELECT id FROM students LIMIT 1');
        if (fallbackStudent.length === 0) {
          return res.status(404).json({ message: 'No students found in registry.' });
        }
        targetStudentId = fallbackStudent[0].id;
      }
    }

    // 2. Fetch student details
    const [studentInfo] = await pool.query(`
      SELECT s.id, u.name, s.roll_no, s.class_grade
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [targetStudentId]);

    if (studentInfo.length === 0) {
      return res.status(404).json({ message: 'Target student not found.' });
    }
    const student = studentInfo[0];

    // 3. Fetch student averages per subject
    const [subjectAverages] = await pool.query(`
      SELECT subject, AVG(marks_obtained / max_marks * 100) AS average
      FROM marks
      WHERE student_id = ?
      GROUP BY subject
    `, [targetStudentId]);

    // 4. Fetch student skill levels
    const [skillsRows] = await pool.query(`
      SELECT coding, sports, arts, communication
      FROM student_skills
      WHERE student_id = ?
    `, [targetStudentId]);
    
    const skills = skillsRows.length > 0 ? skillsRows[0] : { coding: 50, sports: 50, arts: 50, communication: 50 };

    // 5. Calculate subject ratings
    const mathScore = getSubjectAvg(subjectAverages, ['math', 'calculus', 'algebra', 'arithmetic']);
    const csScore = getSubjectAvg(subjectAverages, ['computer', 'database', 'web', 'coding', 'programming', 'network']);
    const physicsScore = getSubjectAvg(subjectAverages, ['physics', 'science', 'chemistry']);
    const englishScore = getSubjectAvg(subjectAverages, ['english', 'literature', 'grammar', 'communication']);

    const codingSkill = skills.coding || 50;
    const sportsSkill = skills.sports || 50;
    const artsSkill = skills.arts || 50;
    const commSkill = skills.communication || 50;

    // 6. Matching career path vectors
    const careerPathsTemplates = [
      {
        title: "AI Research Scientist & Software Architect",
        description: "Design and implement scalable software systems, cloud structures, and train deep learning neural network models.",
        subjects: "Computer Science, Mathematics",
        skills: "Coding, Logical Reasoning",
        outlook: "Excellent (30% Projected Growth)",
        salary: "$120,000 - $175,000",
        score: Math.round((mathScore * 0.3) + (csScore * 0.3) + (codingSkill * 0.4))
      },
      {
        title: "Data Scientist & Quantitative Trader",
        description: "Analyze large-scale datasets, construct statistical pipelines, and design quantitative market trading algorithms.",
        subjects: "Mathematics, Statistics, Computer Science",
        skills: "Logical Reasoning, Coding",
        outlook: "High (25% Projected Growth)",
        salary: "$110,000 - $160,000",
        score: Math.round((mathScore * 0.4) + (csScore * 0.2) + (physicsScore * 0.2) + (codingSkill * 0.2))
      },
      {
        title: "Creative Art Director & UI/UX Architect",
        description: "Design user interaction models, craft digital branding styles, and direct layout assets for web applications.",
        subjects: "Arts, English Literature, Web Technologies",
        skills: "Creative Arts, Communication",
        outlook: "Stable (12% Projected Growth)",
        salary: "$85,000 - $130,000",
        score: Math.round((artsSkill * 0.4) + (commSkill * 0.2) + (csScore * 0.2) + (englishScore * 0.2))
      },
      {
        title: "Public Relations Manager & Technical Writer",
        description: "Coordinate institutional communications campaigns, write documentation portals, and handle outreach channels.",
        subjects: "English Literature, Communication",
        skills: "Communication, Logical Reasoning",
        outlook: "Steady (15% Projected Growth)",
        salary: "$75,000 - $115,000",
        score: Math.round((englishScore * 0.3) + (commSkill * 0.4) + (codingSkill * 0.2) + (mathScore * 0.1))
      },
      {
        title: "Sports Science Analyst & Athletic Coach",
        description: "Evaluate player performance metrics, design kinesiology training schedules, and manage team sports operations.",
        subjects: "Sports Science, Physics",
        skills: "Sports Proficiency, Communication",
        outlook: "Growing (18% Projected Growth)",
        salary: "$65,000 - $105,000",
        score: Math.round((sportsSkill * 0.5) + (commSkill * 0.3) + (physicsScore * 0.2))
      },
      {
        title: "Aerospace Systems Engineer",
        description: "Model aerodynamics trajectories, design mechanical structures for satellites, and build rocket telemetry systems.",
        subjects: "Physics, Mathematics, Systems Engineering",
        skills: "Logical Reasoning, Coding",
        outlook: "Very Strong (22% Projected Growth)",
        salary: "$105,000 - $155,000",
        score: Math.round((physicsScore * 0.4) + (mathScore * 0.3) + (codingSkill * 0.2) + (commSkill * 0.1))
      }
    ];

    // Sort matched careers by score descending
    const careerMatches = careerPathsTemplates.sort((a, b) => b.score - a.score);

    // 7. Fetch Colleges and Scholarships
    const [colleges] = await pool.query('SELECT * FROM colleges ORDER BY id ASC');
    const [scholarships] = await pool.query('SELECT * FROM scholarships ORDER BY deadline ASC');

    // 8. Construct response
    res.json({
      student: {
        id: student.id,
        name: student.name,
        rollNo: student.roll_no,
        classGrade: student.class_grade
      },
      performanceBrief: {
        averages: {
          mathematics: Math.round(mathScore),
          computerScience: Math.round(csScore),
          physics: Math.round(physicsScore),
          english: Math.round(englishScore)
        },
        skills: {
          coding: codingSkill,
          sports: sportsSkill,
          arts: artsSkill,
          communication: commSkill
        }
      },
      careerMatches,
      colleges,
      scholarships
    });

  } catch (err) {
    console.error('Error compiling career guidance:', err);
    res.status(500).json({ message: 'Internal server error compiling career guidance report.' });
  }
};
