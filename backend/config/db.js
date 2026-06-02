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
        \`role\` ENUM('admin', 'teacher', 'student', 'parent') NOT NULL DEFAULT 'student',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Retrofit existing user table roles
    try {
      await connection.query(`
        ALTER TABLE \`users\` 
        MODIFY COLUMN \`role\` ENUM('admin', 'teacher', 'student', 'parent') NOT NULL DEFAULT 'student'
      `);
      console.log('Retrofit role check completed: "parent" role is securely mapped.');
    } catch (e) {
      console.log('Database role ENUM retrofit skipped or already matches:', e.message);
    }

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

    // Parents table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`parents\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`student_id\` INT NOT NULL,
        \`phone\` VARCHAR(20),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Messages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`messages\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`sender_id\` INT NOT NULL,
        \`receiver_id\` INT NOT NULL,
        \`message\` TEXT NOT NULL,
        \`is_read\` BOOLEAN DEFAULT FALSE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`receiver_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Marks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`marks\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\` INT NOT NULL,
        \`subject\` VARCHAR(100) NOT NULL,
        \`marks_obtained\` DECIMAL(5,2) NOT NULL,
        \`max_marks\` DECIMAL(5,2) NOT NULL DEFAULT 100.00,
        \`exam_type\` VARCHAR(50) NOT NULL,
        \`exam_date\` DATE NOT NULL,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Attendance table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`attendance\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\` INT NOT NULL,
        \`date\` DATE NOT NULL,
        \`status\` ENUM('present', 'absent') NOT NULL,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE
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
      const [student1Result] = await connection.query(
        'INSERT INTO students (user_id, roll_no, class_grade, status, enrollment_date) VALUES (?, ?, ?, ?, ?)',
        [studentUser1.insertId, 'STU-2026-001', 'Class 10-A', 'active', '2026-04-01']
      );
      const studentId1 = student1Result.insertId;

      const [studentUser2] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Sana Khan', 'sana@school.com', studentPassword, 'student']
      );
      const [student2Result] = await connection.query(
        'INSERT INTO students (user_id, roll_no, class_grade, status, enrollment_date) VALUES (?, ?, ?, ?, ?)',
        [studentUser2.insertId, 'STU-2026-002', 'Class 12-B', 'active', '2026-04-02']
      );
      const studentId2 = student2Result.insertId;

      // Seed marks for Rahul Verma (studentId1) - struggling academically (avg ~45%)
      const subjectsRahul = [
        { subject: 'Mathematics', marks: 42, type: 'Midterm' },
        { subject: 'Computer Science', marks: 48, type: 'Midterm' },
        { subject: 'English Literature', marks: 52, type: 'Midterm' },
        { subject: 'Physics', marks: 45, type: 'Midterm' },
        { subject: 'Mathematics', marks: 38, type: 'Final' },
        { subject: 'Computer Science', marks: 49, type: 'Final' },
        { subject: 'English Literature', marks: 55, type: 'Final' },
        { subject: 'Physics', marks: 40, type: 'Final' }
      ];
      for (const item of subjectsRahul) {
        await connection.query(
          'INSERT INTO marks (student_id, subject, marks_obtained, max_marks, exam_type, exam_date) VALUES (?, ?, ?, ?, ?, ?)',
          [studentId1, item.subject, item.marks, 100.00, item.type, item.type === 'Midterm' ? '2026-04-15' : '2026-05-20']
        );
      }

      // Seed marks for Sana Khan (studentId2) - academically outstanding (avg ~93%)
      const subjectsSana = [
        { subject: 'Database Systems', marks: 95, type: 'Midterm' },
        { subject: 'Applied Mathematics', marks: 92, type: 'Midterm' },
        { subject: 'Web Technologies', marks: 94, type: 'Midterm' },
        { subject: 'English Literature', marks: 88, type: 'Midterm' },
        { subject: 'Database Systems', marks: 98, type: 'Final' },
        { subject: 'Applied Mathematics', marks: 95, type: 'Final' },
        { subject: 'Web Technologies', marks: 96, type: 'Final' },
        { subject: 'English Literature', marks: 90, type: 'Final' }
      ];
      for (const item of subjectsSana) {
        await connection.query(
          'INSERT INTO marks (student_id, subject, marks_obtained, max_marks, exam_type, exam_date) VALUES (?, ?, ?, ?, ?, ?)',
          [studentId2, item.subject, item.marks, 100.00, item.type, item.type === 'Midterm' ? '2026-04-15' : '2026-05-20']
        );
      }

      // Seed attendance logs for Rahul Verma (high attendance: ~90%) & Sana Khan (low attendance: ~60%)
      const attendanceDates = [
        '2026-05-01', '2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07',
        '2026-05-08', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14',
        '2026-05-15', '2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21',
        '2026-05-22', '2026-05-23', '2026-05-24', '2026-05-25', '2026-05-26'
      ];

      for (let i = 0; i < attendanceDates.length; i++) {
        const date = attendanceDates[i];
        
        // Rahul: Present for almost all, absent for 2 (index 5 and 12)
        const statusRahul = (i === 5 || i === 12) ? 'absent' : 'present';
        await connection.query(
          'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
          [studentId1, date, statusRahul]
        );

        // Sana: Present for 12, absent for 8 (indices 1, 3, 5, 7, 9, 11, 13, 15 are absent)
        const statusSana = (i % 2 === 1 && i < 16) ? 'absent' : 'present';
        await connection.query(
          'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
          [studentId2, date, statusSana]
        );
      }

      console.log('Seed data inserted successfully! Defaults:');
      console.log('Admin Email: admin@school.com | Pass: adminpassword');
      console.log('Teacher Email: alisha@school.com | Pass: teacher123');
      console.log('Student Email: rahul@school.com | Pass: student123');
    } else {
      // Check if marks are already seeded. If not, seed them for existing STU-2026-001 and STU-2026-002!
      const [marksExist] = await connection.query('SELECT * FROM marks LIMIT 1');
      if (marksExist.length === 0) {
        console.log('Marks and Attendance tables are empty. Seeding performance data for existing students...');
        
        // Fetch student 1 ID (STU-2026-001)
        const [student1Fetch] = await connection.query('SELECT id FROM students WHERE roll_no = ?', ['STU-2026-001']);
        // Fetch student 2 ID (STU-2026-002)
        const [student2Fetch] = await connection.query('SELECT id FROM students WHERE roll_no = ?', ['STU-2026-002']);

        if (student1Fetch.length > 0 && student2Fetch.length > 0) {
          const studentId1 = student1Fetch[0].id;
          const studentId2 = student2Fetch[0].id;

          // Seed Rahul Verma (studentId1) marks
          const subjectsRahul = [
            { subject: 'Mathematics', marks: 42, type: 'Midterm' },
            { subject: 'Computer Science', marks: 48, type: 'Midterm' },
            { subject: 'English Literature', marks: 52, type: 'Midterm' },
            { subject: 'Physics', marks: 45, type: 'Midterm' },
            { subject: 'Mathematics', marks: 38, type: 'Final' },
            { subject: 'Computer Science', marks: 49, type: 'Final' },
            { subject: 'English Literature', marks: 55, type: 'Final' },
            { subject: 'Physics', marks: 40, type: 'Final' }
          ];
          for (const item of subjectsRahul) {
            await connection.query(
              'INSERT INTO marks (student_id, subject, marks_obtained, max_marks, exam_type, exam_date) VALUES (?, ?, ?, ?, ?, ?)',
              [studentId1, item.subject, item.marks, 100.00, item.type, item.type === 'Midterm' ? '2026-04-15' : '2026-05-20']
            );
          }

          // Seed Sana Khan (studentId2) marks
          const subjectsSana = [
            { subject: 'Database Systems', marks: 95, type: 'Midterm' },
            { subject: 'Applied Mathematics', marks: 92, type: 'Midterm' },
            { subject: 'Web Technologies', marks: 94, type: 'Midterm' },
            { subject: 'English Literature', marks: 88, type: 'Midterm' },
            { subject: 'Database Systems', marks: 98, type: 'Final' },
            { subject: 'Applied Mathematics', marks: 95, type: 'Final' },
            { subject: 'Web Technologies', marks: 96, type: 'Final' },
            { subject: 'English Literature', marks: 90, type: 'Final' }
          ];
          for (const item of subjectsSana) {
            await connection.query(
              'INSERT INTO marks (student_id, subject, marks_obtained, max_marks, exam_type, exam_date) VALUES (?, ?, ?, ?, ?, ?)',
              [studentId2, item.subject, item.marks, 100.00, item.type, item.type === 'Midterm' ? '2026-04-15' : '2026-05-20']
            );
          }

          // Seed attendance
          const attendanceDates = [
            '2026-05-01', '2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07',
            '2026-05-08', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14',
            '2026-05-15', '2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21',
            '2026-05-22', '2026-05-23', '2026-05-24', '2026-05-25', '2026-05-26'
          ];

          for (let i = 0; i < attendanceDates.length; i++) {
            const date = attendanceDates[i];
            const statusRahul = (i === 5 || i === 12) ? 'absent' : 'present';
            await connection.query(
              'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
              [studentId1, date, statusRahul]
            );

            const statusSana = (i % 2 === 1 && i < 16) ? 'absent' : 'present';
            await connection.query(
              'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
              [studentId2, date, statusSana]
            );
          }
          console.log('Marks and Attendance tables successfully seeded for existing students.');
        }
      }
    }

    // 6. Dynamic Parent and Message Seeder
    const [parentExists] = await connection.query("SELECT * FROM users WHERE email = 'parent.sana@school.com'");
    if (parentExists.length === 0) {
      console.log('Seeding parent credentials and starter message logs...');
      const salt = await bcrypt.genSalt(10);
      const parentHash = await bcrypt.hash('parentpassword', salt);

      // Fetch student ids mapping
      const [stuRahul] = await connection.query("SELECT id FROM students WHERE roll_no = 'STU-2026-001'");
      const [stuSana] = await connection.query("SELECT id FROM students WHERE roll_no = 'STU-2026-002'");

      if (stuRahul.length > 0 && stuSana.length > 0) {
        const studentId1 = stuRahul[0].id;
        const studentId2 = stuSana[0].id;

        // Parent of Sana Khan
        const [parentUser1] = await connection.query(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          ["Mrs. Salma Khan (Sana's Parent)", "parent.sana@school.com", parentHash, "parent"]
        );
        await connection.query(
          "INSERT INTO parents (user_id, student_id, phone) VALUES (?, ?, ?)",
          [parentUser1.insertId, studentId2, "+91 90001 20002"]
        );

        // Parent of Rahul Verma
        const [parentUser2] = await connection.query(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          ["Mr. Ramesh Verma (Rahul's Parent)", "parent.rahul@school.com", parentHash, "parent"]
        );
        await connection.query(
          "INSERT INTO parents (user_id, student_id, phone) VALUES (?, ?, ?)",
          [parentUser2.insertId, studentId1, "+91 90001 20001"]
        );

        // Fetch teacher users
        const [teacherAlisha] = await connection.query("SELECT id FROM users WHERE email = 'alisha@school.com'");
        const [teacherRohan] = await connection.query("SELECT id FROM users WHERE email = 'rohan@school.com'");

        if (teacherAlisha.length > 0 && teacherRohan.length > 0) {
          const tAlishaId = teacherAlisha[0].id;
          const tRohanId = teacherRohan[0].id;
          const pSanaUserId = parentUser1.insertId;
          const pRahulUserId = parentUser2.insertId;

          // Seed messages between Alisha Jahan and Salma Khan (Sana's Parent)
          await connection.query(
            "INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)",
            [tAlishaId, pSanaUserId, "Hello Mrs. Khan, I wanted to discuss Sana's attendance records. She has missed a few CS lab sessions recently.", true]
          );
          await connection.query(
            "INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)",
            [pSanaUserId, tAlishaId, "Hello Teacher Alisha, thank you for reaching out. Yes, she was unwell for a few days, but I will make sure she attends regular sessions going forward.", true]
          );
          await connection.query(
            "INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)",
            [tAlishaId, pSanaUserId, "Thank you for the update! Please check her academic progress bars on her portal dashboard, it will help her catch up.", false]
          );

          // Seed message between Rohan Sharma and Ramesh Verma (Rahul's Parent)
          await connection.query(
            "INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)",
            [pRahulUserId, tRohanId, "Hello Mr. Sharma, how is Rahul's math midterm grade looking? Is he performing okay in algebra?", true]
          );
          await connection.query(
            "INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)",
            [tRohanId, pRahulUserId, "Hello Mr. Verma, his algebra basics are improving but he needs to revise homework. I will keep you posted on his final averages.", false]
          );
        }
      }
      console.log('Parent users and initial message threads successfully seeded.');
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
