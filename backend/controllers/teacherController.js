const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');

// Get all teachers (with search)
exports.getAllTeachers = async (req, res) => {
  const { search } = req.query;
  try {
    const pool = getPool();
    let query = `
      SELECT u.id AS user_id, t.id AS teacher_id, u.name, u.email, t.subject, t.phone, t.status, t.joining_date
      FROM users u
      JOIN teachers t ON u.id = t.user_id
    `;
    const queryParams = [];

    if (search) {
      query += ` WHERE u.name LIKE ? OR u.email LIKE ? OR t.subject LIKE ?`;
      const searchWildcard = `%${search}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    query += ` ORDER BY t.id DESC`;

    const [teachers] = await pool.query(query, queryParams);
    res.json(teachers);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ message: 'Server error fetching teachers list' });
  }
};

// Get single teacher by id
exports.getTeacherById = async (req, res) => {
  const { id } = req.params; // teacher_id
  try {
    const pool = getPool();
    const [teachers] = await pool.query(
      `SELECT u.id AS user_id, t.id AS teacher_id, u.name, u.email, t.subject, t.phone, t.status, t.joining_date
       FROM users u
       JOIN teachers t ON u.id = t.user_id
       WHERE t.id = ?`,
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teachers[0]);
  } catch (err) {
    console.error('Error fetching teacher:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new teacher
exports.createTeacher = async (req, res) => {
  const { name, email, password, subject, phone, joining_date } = req.body;

  if (!name || !email || !subject || !phone || !joining_date) {
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

    // 2. Hash default or supplied password
    const plainPassword = password || 'teacher123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // 3. Insert into users table
    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'teacher']
    );

    const userId = userResult.insertId;

    // 4. Insert into teachers table
    await connection.query(
      'INSERT INTO teachers (user_id, subject, phone, status, joining_date) VALUES (?, ?, ?, ?, ?)',
      [userId, subject, phone, 'active', joining_date]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Teacher successfully created!',
      teacher: {
        name,
        email,
        subject,
        phone,
        joining_date,
        status: 'active'
      }
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error creating teacher:', err);
    res.status(500).json({ message: 'Server error creating teacher record' });
  }
};

// Update teacher details
exports.updateTeacher = async (req, res) => {
  const { id } = req.params; // teacher_id
  const { name, email, subject, phone, status } = req.body;

  if (!name || !email || !subject || !phone || !status) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Find teacher to get user_id
    const [teachers] = await connection.query('SELECT user_id FROM teachers WHERE id = ?', [id]);
    if (teachers.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Teacher not found' });
    }
    const userId = teachers[0].user_id;

    // Check if email belongs to another user
    const [existingEmail] = await connection.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (existingEmail.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email already in use by another user' });
    }

    // Update users table
    await connection.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);

    // Update teachers table
    await connection.query(
      'UPDATE teachers SET subject = ?, phone = ?, status = ? WHERE id = ?',
      [subject, phone, status, id]
    );

    await connection.commit();
    connection.release();

    res.json({ message: 'Teacher successfully updated!' });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error updating teacher:', err);
    res.status(500).json({ message: 'Server error updating teacher record' });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  const { id } = req.params; // teacher_id
  try {
    const pool = getPool();
    // Retrieve user_id first
    const [teachers] = await pool.query('SELECT user_id FROM teachers WHERE id = ?', [id]);
    if (teachers.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    const userId = teachers[0].user_id;

    // Delete user (cascade will automatically delete teacher row)
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Teacher successfully deleted!' });
  } catch (err) {
    console.error('Error deleting teacher:', err);
    res.status(500).json({ message: 'Server error deleting teacher record' });
  }
};
