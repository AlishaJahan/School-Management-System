const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');

// Get all students (with search)
exports.getAllStudents = async (req, res) => {
  const { search } = req.query;
  try {
    const pool = getPool();
    let query = `
      SELECT u.id AS user_id, s.id AS student_id, u.name, u.email, s.roll_no, s.class_grade, s.status, s.enrollment_date
      FROM users u
      JOIN students s ON u.id = s.user_id
    `;
    const queryParams = [];

    if (search) {
      query += ` WHERE u.name LIKE ? OR u.email LIKE ? OR s.roll_no LIKE ? OR s.class_grade LIKE ?`;
      const searchWildcard = `%${search}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    query += ` ORDER BY s.id DESC`;

    const [students] = await pool.query(query, queryParams);
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server error fetching students list' });
  }
};

// Get single student by id
exports.getStudentById = async (req, res) => {
  const { id } = req.params; // student_id
  try {
    const pool = getPool();
    const [students] = await pool.query(
      `SELECT u.id AS user_id, s.id AS student_id, u.name, u.email, s.roll_no, s.class_grade, s.status, s.enrollment_date
       FROM users u
       JOIN students s ON u.id = s.user_id
       WHERE s.id = ?`,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(students[0]);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new student
exports.createStudent = async (req, res) => {
  const { name, email, password, roll_no, class_grade, enrollment_date } = req.body;

  if (!name || !email || !roll_no || !class_grade || !enrollment_date) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check if user already exists
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Check if roll number already exists
    const [existingRoll] = await connection.query('SELECT id FROM students WHERE roll_no = ?', [roll_no]);
    if (existingRoll.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Student roll number already exists' });
    }

    // 2. Hash default or supplied password
    const plainPassword = password || 'student123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // 3. Insert into users table
    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'student']
    );

    const userId = userResult.insertId;

    // 4. Insert into students table
    await connection.query(
      'INSERT INTO students (user_id, roll_no, class_grade, status, enrollment_date) VALUES (?, ?, ?, ?, ?)',
      [userId, roll_no, class_grade, 'active', enrollment_date]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Student successfully created!',
      student: {
        name,
        email,
        roll_no,
        class_grade,
        enrollment_date,
        status: 'active'
      }
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error creating student:', err);
    res.status(500).json({ message: 'Server error creating student record' });
  }
};

// Update student details
exports.updateStudent = async (req, res) => {
  const { id } = req.params; // student_id
  const { name, email, roll_no, class_grade, status } = req.body;

  if (!name || !email || !roll_no || !class_grade || !status) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Find student to get user_id
    const [students] = await connection.query('SELECT user_id FROM students WHERE id = ?', [id]);
    if (students.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Student not found' });
    }
    const userId = students[0].user_id;

    // Check if email belongs to another user
    const [existingEmail] = await connection.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (existingEmail.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email already in use by another user' });
    }

    // Check if roll number belongs to another student
    const [existingRoll] = await connection.query('SELECT id FROM students WHERE roll_no = ? AND id != ?', [roll_no, id]);
    if (existingRoll.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Roll number already in use by another student' });
    }

    // Update users table
    await connection.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);

    // Update students table
    await connection.query(
      'UPDATE students SET roll_no = ?, class_grade = ?, status = ? WHERE id = ?',
      [roll_no, class_grade, status, id]
    );

    await connection.commit();
    connection.release();

    res.json({ message: 'Student successfully updated!' });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error updating student:', err);
    res.status(500).json({ message: 'Server error updating student record' });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  const { id } = req.params; // student_id
  try {
    const pool = getPool();
    // Retrieve user_id first
    const [students] = await pool.query('SELECT user_id FROM students WHERE id = ?', [id]);
    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const userId = students[0].user_id;

    // Delete user (cascade will automatically delete student row)
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Student successfully deleted!' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Server error deleting student record' });
  }
};
