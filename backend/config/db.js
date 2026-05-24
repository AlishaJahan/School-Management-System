const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
};

let pool;

async function initializeDatabase() {
  let connection;
  try {
    // 1. Connect without database parameter to create database if it doesn't exist
    connection = await mysql.createConnection(dbConfig);
    console.log('Successfully connected to MySQL server.');

    // 2. Create Database
    await connection.query('CREATE DATABASE IF NOT EXISTS `school_management`');
    console.log('Database "school_management" checked/created.');

    // 3. Switch to the database
    await connection.query('USE `school_management`');

    // 4. Create Tables
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Teachers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`teachers\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`subject\` VARCHAR(100) NOT NULL,
        \`phone\` VARCHAR(20),
        \`status\` ENUM('active', 'inactive') DEFAULT 'active',
        \`joining_date\` DATE NOT NULL,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Students table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`students\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`roll_no\` VARCHAR(50) NOT NULL UNIQUE,
        \`class_grade\` VARCHAR(50) NOT NULL,
        \`status\` ENUM('active', 'suspended') DEFAULT 'active',
        \`enrollment_date\` DATE NOT NULL,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Database tables successfully checked/created.');

    // 5. Seed default Administrator if no users exist
    const [users] = await connection.query('SELECT * FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('No users found in database. Seeding default Admin and initial data...');
      
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash('adminpassword', salt);
      const teacherPassword = await bcrypt.hash('teacher123', salt);
      const studentPassword = await bcrypt.hash('student123', salt);

      // Seed Admin
      const [adminResult] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['System Administrator', 'admin@school.com', adminPassword, 'admin']
      );

      // Seed 2 Teachers
      const [teacherUser1] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Alisha Jahan', 'alisha@school.com', teacherPassword, 'teacher']
      );
      await connection.query(
        'INSERT INTO teachers (user_id, subject, phone, status, joining_date) VALUES (?, ?, ?, ?, ?)',
        [teacherUser1.insertId, 'Computer Science', '+91 9876543210', 'active', '2025-01-15']
      );

      const [teacherUser2] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Rohan Sharma', 'rohan@school.com', teacherPassword, 'teacher']
      );
      await connection.query(
        'INSERT INTO teachers (user_id, subject, phone, status, joining_date) VALUES (?, ?, ?, ?, ?)',
        [teacherUser2.insertId, 'Mathematics', '+91 9998887776', 'active', '2024-06-10']
      );

      // Seed 2 Students
      const [studentUser1] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Rahul Verma', 'rahul@school.com', studentPassword, 'student']
      );
      await connection.query(
        'INSERT INTO students (user_id, roll_no, class_grade, status, enrollment_date) VALUES (?, ?, ?, ?, ?)',
        [studentUser1.insertId, 'STU-2026-001', 'Class 10-A', 'active', '2026-04-01']
      );

      const [studentUser2] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Sana Khan', 'sana@school.com', studentPassword, 'student']
      );
      await connection.query(
        'INSERT INTO students (user_id, roll_no, class_grade, status, enrollment_date) VALUES (?, ?, ?, ?, ?)',
        [studentUser2.insertId, 'STU-2026-002', 'Class 12-B', 'active', '2026-04-02']
      );

      console.log('Seed data inserted successfully! Defaults:');
      console.log('Admin Email: admin@school.com | Pass: adminpassword');
      console.log('Teacher Email: alisha@school.com | Pass: teacher123');
      console.log('Student Email: rahul@school.com | Pass: student123');
    }

  } catch (err) {
    console.error('Database connection / initialization failed:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

// Get standard connection pool configured for "school_management"
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      database: 'school_management',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

module.exports = {
  initializeDatabase,
  getPool
};
