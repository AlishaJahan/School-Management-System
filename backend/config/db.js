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

    // Points Log table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`points_log\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\` INT NOT NULL,
        \`points\` INT NOT NULL,
        \`category\` ENUM('attendance', 'assignment', 'participation', 'homework_helper') NOT NULL,
        \`description\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Badges table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`badges\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL UNIQUE,
        \`description\` VARCHAR(255) NOT NULL,
        \`icon\` VARCHAR(50) NOT NULL,
        \`type\` ENUM('system', 'custom') DEFAULT 'custom',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Student Badges table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`student_badges\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\` INT NOT NULL,
        \`badge_id\` INT NOT NULL,
        \`awarded_by\` INT,
        \`awarded_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`badge_id\`) REFERENCES \`badges\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`awarded_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        UNIQUE KEY \`unique_student_badge\` (\`student_id\`, \`badge_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Leave Requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`leave_requests\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`start_date\` DATE NOT NULL,
        \`end_date\` DATE NOT NULL,
        \`reason\` TEXT NOT NULL,
        \`status\` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        \`reviewed_by\` INT,
        \`review_remarks\` VARCHAR(255),
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Assignments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`assignments\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`teacher_id\` INT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`class_grade\` VARCHAR(50) NOT NULL,
        \`due_date\` DATE NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Assignment Submissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`assignment_submissions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`assignment_id\` INT NOT NULL,
        \`student_id\` INT NOT NULL,
        \`status\` ENUM('submitted', 'late', 'missing') NOT NULL DEFAULT 'submitted',
        \`submitted_at\` TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (\`assignment_id\`) REFERENCES \`assignments\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_student_assignment\` (\`student_id\`, \`assignment_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Teacher Feedback table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`teacher_feedback\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`teacher_id\` INT NOT NULL,
        \`student_id\` INT NOT NULL,
        \`rating\` INT NOT NULL,
        \`comment\` TEXT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Complaints table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`complaints\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\` INT,
        \`ticket_id\` VARCHAR(50) NOT NULL UNIQUE,
        \`type\` ENUM('complaint', 'suggestion') NOT NULL DEFAULT 'complaint',
        \`title\` VARCHAR(255) NOT NULL,
        \`category\` ENUM('academic', 'facilities', 'harassment', 'extracurricular', 'other') NOT NULL,
        \`description\` TEXT NOT NULL,
        \`status\` ENUM('pending', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
        \`resolution_remarks\` TEXT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`resolved_at\` TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Events table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`events\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`creator_id\` INT,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`event_date\` DATE NOT NULL,
        \`location\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`creator_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Event Registrations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`event_registrations\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`event_id\` INT NOT NULL,
        \`student_id\` INT NOT NULL,
        \`attendance_status\` ENUM('registered', 'present', 'absent') NOT NULL DEFAULT 'registered',
        \`registered_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_student_event\` (\`student_id\`, \`event_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Exams table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`exams\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`teacher_id\` INT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`subject\` VARCHAR(100) NOT NULL,
        \`class_grade\` VARCHAR(50) NOT NULL,
        \`duration_minutes\` INT NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Exam Questions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`exam_questions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`exam_id\` INT NOT NULL,
        \`question_text\` TEXT NOT NULL,
        \`option_a\` VARCHAR(255) NOT NULL,
        \`option_b\` VARCHAR(255) NOT NULL,
        \`option_c\` VARCHAR(255) NOT NULL,
        \`option_d\` VARCHAR(255) NOT NULL,
        \`correct_option\` ENUM('A', 'B', 'C', 'D') NOT NULL,
        FOREIGN KEY (\`exam_id\`) REFERENCES \`exams\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Exam Submissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`exam_submissions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`exam_id\` INT NOT NULL,
        \`student_id\` INT NOT NULL,
        \`score_obtained\` INT NOT NULL,
        \`total_score\` INT NOT NULL,
        \`submitted_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exam_id\`) REFERENCES \`exams\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_student_exam\` (\`student_id\`, \`exam_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Student Skills table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`student_skills\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\` INT NOT NULL,
        \`coding\` INT DEFAULT 0,
        \`sports\` INT DEFAULT 0,
        \`arts\` INT DEFAULT 0,
        \`communication\` INT DEFAULT 0,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_student_skills\` (\`student_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Student Achievements table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`student_achievements\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\` INT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`category\` ENUM('coding', 'sports', 'arts', 'communication', 'academic', 'other') NOT NULL,
        \`description\` TEXT,
        \`date_earned\` DATE NOT NULL,
        \`proof_url\` VARCHAR(255),
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Discussion Topics table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`discussion_topics\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`teacher_id\` INT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`class_grade\` VARCHAR(50) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Discussion Posts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`discussion_posts\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`topic_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`content\` TEXT NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`topic_id\`) REFERENCES \`discussion_topics\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Discussion Upvotes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`discussion_upvotes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`post_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`post_id\`) REFERENCES \`discussion_posts\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`unique_user_post_upvote\` (\`post_id\`, \`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Emergency Alerts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`emergency_alerts\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`sender_id\` INT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`severity\` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'high',
        \`channels\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Resource Sharing table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`resources\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`teacher_id\` INT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`subject\` VARCHAR(100) NOT NULL,
        \`resource_type\` ENUM('notes', 'pdf', 'video', 'other') NOT NULL DEFAULT 'notes',
        \`file_url\` VARCHAR(255) NOT NULL,
        \`class_grade\` VARCHAR(50) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Colleges table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`colleges\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`location\` VARCHAR(255) NOT NULL,
        \`courses\` VARCHAR(255) NOT NULL,
        \`ranking\` VARCHAR(50),
        \`website\` VARCHAR(255) NOT NULL,
        \`requirements\` TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Scholarships table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`scholarships\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`provider\` VARCHAR(255) NOT NULL,
        \`amount\` VARCHAR(100) NOT NULL,
        \`eligibility\` TEXT,
        \`deadline\` DATE NOT NULL,
        \`website\` VARCHAR(255) NOT NULL
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

    // 7. Seed Gamification Badges
    const [existingBadges] = await connection.query('SELECT COUNT(*) AS count FROM badges');
    if (existingBadges[0].count === 0) {
      console.log('Seeding default gamification badges...');
      const defaultBadges = [
        ['Perfect Attendance', 'Maintained verified attendance rate above 95%', '📅', 'system'],
        ['Top Performer', 'Maintained academic average above 90%', '🏆', 'system'],
        ['Consistent Learner', 'Asked at least 3 Socratic homework helper questions', '🌟', 'system'],
        ['Classroom Star', 'Awarded by teachers for excellent in-class participation', '💬', 'system']
      ];

      for (const badge of defaultBadges) {
        await connection.query(
          'INSERT INTO badges (name, description, icon, type) VALUES (?, ?, ?, ?)',
          badge
        );
      }
      console.log('Default badges seeded successfully.');
    }

    // 8. Seed initial student points log and badges for test accounts if empty
    const [existingPoints] = await connection.query('SELECT COUNT(*) AS count FROM points_log');
    if (existingPoints[0].count === 0) {
      console.log('Seeding initial points log & badges for default students...');
      
      const [stuRahul] = await connection.query("SELECT id FROM students WHERE roll_no = 'STU-2026-001'");
      const [stuSana] = await connection.query("SELECT id FROM students WHERE roll_no = 'STU-2026-002'");

      if (stuRahul.length > 0 && stuSana.length > 0) {
        const studentId1 = stuRahul[0].id;
        const studentId2 = stuSana[0].id;

        // Seed points logs
        await connection.query(
          "INSERT INTO points_log (student_id, points, category, description) VALUES (?, ?, ?, ?)",
          [studentId1, 30, 'participation', 'Active contribution in computer science networks lab']
        );
        await connection.query(
          "INSERT INTO points_log (student_id, points, category, description) VALUES (?, ?, ?, ?)",
          [studentId2, 50, 'participation', 'Outstanding performance in class presentation and SQL drills']
        );

        // Fetch seeded badges to map
        const [badgeStar] = await connection.query("SELECT id FROM badges WHERE name = 'Classroom Star'");
        const [badgeTop] = await connection.query("SELECT id FROM badges WHERE name = 'Top Performer'");

        // Fetch Alisha Jahan user ID (Teacher) to be the awarder
        const [teacherAlisha] = await connection.query("SELECT id FROM users WHERE email = 'alisha@school.com'");

        if (teacherAlisha.length > 0) {
          const teacherId = teacherAlisha[0].id;
          
          if (badgeStar.length > 0) {
            await connection.query(
              "INSERT INTO student_badges (student_id, badge_id, awarded_by) VALUES (?, ?, ?)",
              [studentId1, badgeStar[0].id, teacherId]
            );
            await connection.query(
              "INSERT INTO student_badges (student_id, badge_id, awarded_by) VALUES (?, ?, ?)",
              [studentId2, badgeStar[0].id, teacherId]
            );
          }

          if (badgeTop.length > 0) {
            await connection.query(
              "INSERT INTO student_badges (student_id, badge_id, awarded_by) VALUES (?, ?, ?)",
              [studentId2, badgeTop[0].id, teacherId]
            );
          }
        }
      }
      console.log('Seeded initial student points logs and student badges.');
    }

    // 9. Seed default Leave Requests
    const [existingLeaves] = await connection.query('SELECT COUNT(*) AS count FROM leave_requests');
    if (existingLeaves[0].count === 0) {
      console.log('Seeding default leave requests...');

      // Fetch user IDs
      const [uRahul] = await connection.query("SELECT id FROM users WHERE email = 'rahul@school.com'");
      const [uRohan] = await connection.query("SELECT id FROM users WHERE email = 'rohan@school.com'");
      const [uSana] = await connection.query("SELECT id FROM users WHERE email = 'sana@school.com'");
      const [uAdmin] = await connection.query("SELECT id FROM users WHERE email = 'admin@school.com'");

      if (uRahul.length > 0 && uRohan.length > 0 && uSana.length > 0) {
        const rahulUserId = uRahul[0].id;
        const rohanUserId = uRohan[0].id;
        const sanaUserId = uSana[0].id;
        const adminUserId = uAdmin.length > 0 ? uAdmin[0].id : null;

        // Pending student leave
        await connection.query(
          "INSERT INTO leave_requests (user_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, 'pending')",
          [rahulUserId, '2026-06-15', '2026-06-17', 'Family function attendance in hometown']
        );

        // Pending teacher leave
        await connection.query(
          "INSERT INTO leave_requests (user_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, 'pending')",
          [rohanUserId, '2026-06-18', '2026-06-20', 'Medical checkup and dentist appointment']
        );

        // Approved student leave (approved by admin)
        await connection.query(
          "INSERT INTO leave_requests (user_id, start_date, end_date, reason, status, reviewed_by, review_remarks) VALUES (?, ?, ?, ?, 'approved', ?, ?)",
          [sanaUserId, '2026-05-10', '2026-05-12', 'Recovering from mild seasonal viral flu', adminUserId, 'Approved. Keep student health first. Get well soon!']
        );
      }
      console.log('Default leave requests seeded successfully.');
    }

    // 10. Seed default Assignments, Submissions, and Feedback
    const [existingAssignments] = await connection.query('SELECT COUNT(*) AS count FROM assignments');
    if (existingAssignments[0].count === 0) {
      console.log('Seeding default assignments, submissions, and teacher feedback...');

      // Fetch teacher IDs
      const [tAlisha] = await connection.query("SELECT t.id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = 'alisha@school.com'");
      const [tRohan] = await connection.query("SELECT t.id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = 'rohan@school.com'");

      // Fetch student IDs
      const [sRahul] = await connection.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'rahul@school.com'");
      const [sSana] = await connection.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'sana@school.com'");

      if (tAlisha.length > 0 && tRohan.length > 0 && sRahul.length > 0 && sSana.length > 0) {
        const alishaId = tAlisha[0].id;
        const rohanId = tRohan[0].id;
        const rahulId = sRahul[0].id;
        const sanaId = sSana[0].id;

        // Seed CS Assignments
        const [csAss1] = await connection.query(
          "INSERT INTO assignments (teacher_id, title, class_grade, due_date, created_at) VALUES (?, ?, ?, ?, ?)",
          [alishaId, "Introduction to HTML & CSS", "Class 10-A", "2026-05-25", "2026-05-18 10:00:00"]
        );
        const [csAss2] = await connection.query(
          "INSERT INTO assignments (teacher_id, title, class_grade, due_date, created_at) VALUES (?, ?, ?, ?, ?)",
          [alishaId, "SQL Queries and Database Relationships", "Class 12-B", "2026-05-31", "2026-05-24 09:00:00"]
        );
        const [csAss3] = await connection.query(
          "INSERT INTO assignments (teacher_id, title, class_grade, due_date, created_at) VALUES (?, ?, ?, ?, ?)",
          [alishaId, "JavaScript Loops & Arrays Quiz", "Class 10-A", "2026-06-01", "2026-05-25 14:00:00"]
        );

        // Seed Math Assignments
        const [mathAss1] = await connection.query(
          "INSERT INTO assignments (teacher_id, title, class_grade, due_date, created_at) VALUES (?, ?, ?, ?, ?)",
          [rohanId, "Quadratic Equations Homework Sheet", "Class 10-A", "2026-05-29", "2026-05-22 08:30:00"]
        );
        const [mathAss2] = await connection.query(
          "INSERT INTO assignments (teacher_id, title, class_grade, due_date, created_at) VALUES (?, ?, ?, ?, ?)",
          [rohanId, "Calculus Limits & Continuity Exercise", "Class 12-B", "2026-06-02", "2026-05-26 11:00:00"]
        );

        // Seed Assignment Submissions
        // Rahul Verma (Class 10-A) submissions
        await connection.query(
          "INSERT INTO assignment_submissions (assignment_id, student_id, status, submitted_at) VALUES (?, ?, 'submitted', ?)",
          [csAss1.insertId, rahulId, "2026-05-24 16:30:00"]
        );
        await connection.query(
          "INSERT INTO assignment_submissions (assignment_id, student_id, status, submitted_at) VALUES (?, ?, 'missing', NULL)",
          [csAss3.insertId, rahulId]
        );
        await connection.query(
          "INSERT INTO assignment_submissions (assignment_id, student_id, status, submitted_at) VALUES (?, ?, 'late', ?)",
          [mathAss1.insertId, rahulId, "2026-06-02 10:15:00"]
        );

        // Sana Khan (Class 12-B) submissions
        await connection.query(
          "INSERT INTO assignment_submissions (assignment_id, student_id, status, submitted_at) VALUES (?, ?, 'submitted', ?)",
          [csAss2.insertId, sanaId, "2026-05-30 14:00:00"]
        );
        await connection.query(
          "INSERT INTO assignment_submissions (assignment_id, student_id, status, submitted_at) VALUES (?, ?, 'submitted', ?)",
          [mathAss2.insertId, sanaId, "2026-06-01 18:45:00"]
        );

        // Seed Teacher Feedback
        await connection.query(
          "INSERT INTO teacher_feedback (teacher_id, student_id, rating, comment, created_at) VALUES (?, ?, 5, ?, '2026-05-28 15:20:00')",
          [alishaId, sanaId, "Excellent teaching style! DB queries were explained in a very easy-to-understand way."]
        );
        await connection.query(
          "INSERT INTO teacher_feedback (teacher_id, student_id, rating, comment, created_at) VALUES (?, ?, 4, ?, '2026-06-01 09:40:00')",
          [alishaId, rahulId, "Alisha ma'am explains HTML & CSS very well, but JS is a bit fast. Still, she helps a lot with doubts."]
        );
        await connection.query(
          "INSERT INTO teacher_feedback (teacher_id, student_id, rating, comment, created_at) VALUES (?, ?, 4, ?, '2026-05-30 11:10:00')",
          [rohanId, sanaId, "Great math lectures. Calculus is tough but he helps us solve practice problems patiently."]
        );
      }
      console.log('Default assignments, submissions, and teacher feedback seeded successfully.');
    }

    // 11. Seed default Complaints and Suggestions
    const [existingComplaints] = await connection.query('SELECT COUNT(*) AS count FROM complaints');
    if (existingComplaints[0].count === 0) {
      console.log('Seeding default student complaints and suggestions...');

      // Fetch student IDs
      const [sRahul] = await connection.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'rahul@school.com'");
      const [sSana] = await connection.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'sana@school.com'");

      if (sRahul.length > 0 && sSana.length > 0) {
        const rahulId = sRahul[0].id;
        const sanaId = sSana[0].id;

        // Pending Facilities Complaint (Rahul)
        await connection.query(`
          INSERT INTO complaints (student_id, ticket_id, type, title, category, description, status, created_at)
          VALUES (?, 'COMP-2026-9042', 'complaint', 'Library WiFi Connection Dropouts', 'facilities', 
                  'The WiFi connection in the main library block regularly drops out every 10-15 minutes, making it difficult to read online documentation.', 'pending', '2026-06-01 10:00:00')
        `, [rahulId]);

        // Reviewing Academic Complaint (Rahul)
        await connection.query(`
          INSERT INTO complaints (student_id, ticket_id, type, title, category, description, status, created_at)
          VALUES (?, 'COMP-2026-3829', 'complaint', 'Calculus Lecture Speed Pacing', 'academic', 
                  'The pacing of the calculus limits topic coverage is a bit too fast to absorb during class time.', 'reviewing', '2026-06-02 09:30:00')
        `, [rahulId]);

        // Resolved Extracurricular Suggestion (Sana)
        await connection.query(`
          INSERT INTO complaints (student_id, ticket_id, type, title, category, description, status, resolution_remarks, created_at, resolved_at)
          VALUES (?, 'SUG-2026-1049', 'suggestion', 'Establish Chess Club After School', 'extracurricular', 
                  'It would be great to start an official school chess club for training and inter-school tournaments.', 'resolved', 
                  'Approved. Budget has been allocated for chess sets. Weekly sessions will commence from next month in Room 204.', '2026-05-28 14:15:00', '2026-05-30 16:00:00')
        `, [sanaId]);
      }
      console.log('Default complaints and suggestions seeded successfully.');
    }

    // 12. Seed default Events and Registrations
    const [existingEvents] = await connection.query('SELECT COUNT(*) AS count FROM events');
    if (existingEvents[0].count === 0) {
      console.log('Seeding default school events and student registrations...');

      // Fetch teacher/creator and student IDs
      const [uAlisha] = await connection.query("SELECT id FROM users WHERE email = 'alisha@school.com'");
      const [sRahul] = await connection.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'rahul@school.com'");
      const [sSana] = await connection.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'sana@school.com'");

      if (uAlisha.length > 0 && sRahul.length > 0 && sSana.length > 0) {
        const creatorId = uAlisha[0].id;
        const rahulId = sRahul[0].id;
        const sanaId = sSana[0].id;

        // Past Event 1: Science exhibition
        const [ev1] = await connection.query(`
          INSERT INTO events (creator_id, title, description, event_date, location, created_at)
          VALUES (?, 'Annual Science Exhibition 2026', 'Showcase of student science projects, lab models, and innovation theories.', '2026-05-20', 'Main Exhibition Hall Block B', '2026-05-10 10:00:00')
        `, [creatorId]);

        // Past Event 2: Coding Hackathon
        const [ev2] = await connection.query(`
          INSERT INTO events (creator_id, title, description, event_date, location, created_at)
          VALUES (?, 'Inter-School Coding Hackathon', 'A 6-hour coding sprint building HTML/JS web layouts and database structures.', '2026-05-28', 'Computer Lab 3 Block C', '2026-05-15 09:00:00')
        `, [creatorId]);

        // Upcoming Event 3: Sports Meet
        const [ev3] = await connection.query(`
          INSERT INTO events (creator_id, title, description, event_date, location, created_at)
          VALUES (?, 'National Sports Meet 2026', 'Inter-school athletics track races, high jumps, and soccer tournaments.', '2026-06-15', 'Main Athletic Ground', '2026-06-01 08:30:00')
        `, [creatorId]);

        // Upcoming Event 4: Robotics workshop
        const [ev4] = await connection.query(`
          INSERT INTO events (creator_id, title, description, event_date, location, created_at)
          VALUES (?, 'Robotics & AI Starter Workshop', 'Introduction to robot design, sensor programming, and elementary neural networks.', '2026-06-20', 'Robotics Innovation Lab 1', '2026-06-02 11:00:00')
        `, [creatorId]);

        // Seed Event Registrations and Attendance statuses
        // Science Exhibition (Attended by both Rahul and Sana -> Present)
        await connection.query(`
          INSERT INTO event_registrations (event_id, student_id, attendance_status, registered_at)
          VALUES (?, ?, 'present', '2026-05-12 14:00:00')
        `, [ev1.insertId, rahulId]);
        await connection.query(`
          INSERT INTO event_registrations (event_id, student_id, attendance_status, registered_at)
          VALUES (?, ?, 'present', '2026-05-13 11:30:00')
        `, [ev1.insertId, sanaId]);

        // Coding Hackathon (Rahul attended -> Present, Sana missed -> Absent)
        await connection.query(`
          INSERT INTO event_registrations (event_id, student_id, attendance_status, registered_at)
          VALUES (?, ?, 'present', '2026-05-18 10:15:00')
        `, [ev2.insertId, rahulId]);
        await connection.query(`
          INSERT INTO event_registrations (event_id, student_id, attendance_status, registered_at)
          VALUES (?, ?, 'absent', '2026-05-19 14:20:00')
        `, [ev2.insertId, sanaId]);

        // Sports Meet (Rahul registered)
        await connection.query(`
          INSERT INTO event_registrations (event_id, student_id, attendance_status, registered_at)
          VALUES (?, ?, 'registered', '2026-06-02 09:00:00')
        `, [ev3.insertId, rahulId]);

        // Robotics Workshop (Sana registered)
        await connection.query(`
          INSERT INTO event_registrations (event_id, student_id, attendance_status, registered_at)
          VALUES (?, ?, 'registered', '2026-06-02 10:00:00')
        `, [ev4.insertId, sanaId]);
      }
      console.log('Default events and registrations seeded successfully.');
    }

    // 13. Seed default Online Exams, Questions, and Submissions
    const [existingExams] = await connection.query('SELECT COUNT(*) AS count FROM exams');
    if (existingExams[0].count === 0) {
      console.log('Seeding default online exams, questions, and submission logs...');

      // Fetch teacher & student IDs
      const [tAlisha] = await connection.query("SELECT t.id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = 'alisha@school.com'");
      const [tRohan] = await connection.query("SELECT t.id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = 'rohan@school.com'");
      const [sRahul] = await connection.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'rahul@school.com'");
      const [sSana] = await connection.query("SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'sana@school.com'");

      if (tAlisha.length > 0 && tRohan.length > 0 && sRahul.length > 0 && sSana.length > 0) {
        const alishaId = tAlisha[0].id;
        const rohanId = tRohan[0].id;
        const rahulId = sRahul[0].id;
        const sanaId = sSana[0].id;

        // Exam 1: Computer Networks Midterm (Class 10-A, Alisha Jahan)
        const [ex1] = await connection.query(`
          INSERT INTO exams (teacher_id, title, subject, class_grade, duration_minutes)
          VALUES (?, 'Computer Networks Midterm MCQ', 'Computer Science', 'Class 10-A', 15)
        `, [alishaId]);
        
        await connection.query(`
          INSERT INTO exam_questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES 
          (?, 'What does IP stand for?', 'Internet Protocol', 'Intranet Protocol', 'International Peer', 'Internal Process', 'A'),
          (?, 'Which port is used by HTTP by default?', '21', '22', '80', '443', 'C'),
          (?, 'Which protocol is connectionless?', 'TCP', 'UDP', 'SMTP', 'FTP', 'B')
        `, [ex1.insertId, ex1.insertId, ex1.insertId]);

        // Exam 2: Algebra Equations Test (Class 12-B, Rohan Sharma)
        const [ex2] = await connection.query(`
          INSERT INTO exams (teacher_id, title, subject, class_grade, duration_minutes)
          VALUES (?, 'Algebra Equations MCQ Test', 'Mathematics', 'Class 12-B', 20)
        `, [rohanId]);

        await connection.query(`
          INSERT INTO exam_questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES 
          (?, 'Solve for x: 2x + 5 = 15.', '2', '5', '10', '15', 'B'),
          (?, 'What is the degree of a quadratic equation?', '1', '2', '3', '4', 'B')
        `, [ex2.insertId, ex2.insertId]);

        // Exam 3: JS Array Methods Quiz (Class 10-A, Alisha Jahan - Upcoming/Active)
        const [ex3] = await connection.query(`
          INSERT INTO exams (teacher_id, title, subject, class_grade, duration_minutes)
          VALUES (?, 'JavaScript Array Methods Quiz', 'Computer Science', 'Class 10-A', 10)
        `, [alishaId]);

        await connection.query(`
          INSERT INTO exam_questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES 
          (?, 'Which method adds elements to the end of an array?', 'pop()', 'push()', 'shift()', 'unshift()', 'B'),
          (?, 'Which method creates a new array by filtering elements?', 'map()', 'filter()', 'reduce()', 'find()', 'B')
        `, [ex3.insertId, ex3.insertId]);

        // Exam 4: Calculus Derivatives Quiz (Class 12-B, Rohan Sharma - Upcoming/Active)
        const [ex4] = await connection.query(`
          INSERT INTO exams (teacher_id, title, subject, class_grade, duration_minutes)
          VALUES (?, 'Calculus Derivatives Quick Quiz', 'Mathematics', 'Class 12-B', 10)
        `, [rohanId]);

        await connection.query(`
          INSERT INTO exam_questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES 
          (?, 'What is the derivative of x^2?', 'x', '2x', '2', 'x^2', 'B'),
          (?, 'What is the derivative of a constant?', '0', '1', 'constant', 'x', 'A')
        `, [ex4.insertId, ex4.insertId]);

        // Seed Submission logs & integrate with report card 'marks'
        // Rahul Verma submitted Computer Networks Midterm, Score: 2 / 3
        await connection.query(`
          INSERT INTO exam_submissions (exam_id, student_id, score_obtained, total_score, submitted_at)
          VALUES (?, ?, 2, 3, '2026-06-02 14:00:00')
        `, [ex1.insertId, rahulId]);

        await connection.query(`
          INSERT INTO marks (student_id, subject, marks_obtained, max_marks, exam_type, exam_date)
          VALUES (?, 'Computer Science', 2.00, 3.00, 'Online MCQ: Computer Networks Midterm MCQ', '2026-06-02')
        `, [rahulId]);

        // Sana Khan submitted Algebra Equations MCQ Test, Score: 2 / 2
        await connection.query(`
          INSERT INTO exam_submissions (exam_id, student_id, score_obtained, total_score, submitted_at)
          VALUES (?, ?, 2, 2, '2026-06-01 11:30:00')
        `, [ex2.insertId, sanaId]);

        await connection.query(`
          INSERT INTO marks (student_id, subject, marks_obtained, max_marks, exam_type, exam_date)
          VALUES (?, 'Mathematics', 2.00, 2.00, 'Online MCQ: Algebra Equations MCQ Test', '2026-06-01')
        `, [sanaId]);
      }
      console.log('Default online exams, questions, and submissions seeded successfully.');
    }

    // 14. Seed default Skills & Achievements if empty
    const [existingSkills] = await connection.query('SELECT COUNT(*) AS count FROM student_skills');
    if (existingSkills[0].count === 0) {
      console.log('Seeding default student skills and achievements...');
      
      const [stuRahul] = await connection.query("SELECT id FROM students WHERE roll_no = 'STU-2026-001'");
      const [stuSana] = await connection.query("SELECT id FROM students WHERE roll_no = 'STU-2026-002'");

      if (stuRahul.length > 0 && stuSana.length > 0) {
        const rahulId = stuRahul[0].id;
        const sanaId = stuSana[0].id;

        // Seed Rahul's skills (Sports & Arts dominant)
        await connection.query(`
          INSERT INTO student_skills (student_id, coding, sports, arts, communication)
          VALUES (?, 45, 92, 85, 60)
        `, [rahulId]);

        // Seed Sana's skills (Coding & Communication dominant)
        await connection.query(`
          INSERT INTO student_skills (student_id, coding, sports, arts, communication)
          VALUES (?, 95, 50, 65, 88)
        `, [sanaId]);

        // Seed Rahul's achievements
        await connection.query(`
          INSERT INTO student_achievements (student_id, title, category, description, date_earned, proof_url)
          VALUES 
          (?, 'Inter-School 100m Dash Gold Medalist', 'sports', 'Secured 1st place in the senior boys division track race at the annual sports meet.', '2026-05-15', 'https://schoolsports.org/awards/gold-100m'),
          (?, 'District Painting Competition Winner', 'arts', 'Awarded "Best Palette" prize for modern landscape watercolor art.', '2026-04-20', NULL)
        `, [rahulId, rahulId]);

        // Seed Sana's achievements
        await connection.query(`
          INSERT INTO student_achievements (student_id, title, category, description, date_earned, proof_url)
          VALUES 
          (?, 'National Science Hackathon - 1st Runner Up', 'coding', 'Built a responsive educational portal using React and SQLite in a 24-hour hackathon.', '2026-05-28', 'https://github.com/sana-khan/hackathon-2026'),
          (?, 'Best Delegate - Intra-School Model UN Conference', 'communication', 'Represented the delegate of France in the Security Council discussing international cyber security treaties.', '2026-05-10', 'https://modelun.org/certificates/france-delegate')
        `, [sanaId, sanaId]);
      }
      console.log('Default student skills and achievements seeded successfully.');
    }

    // 15. Seed default Discussions if empty
    const [existingTopics] = await connection.query('SELECT COUNT(*) AS count FROM discussion_topics');
    if (existingTopics[0].count === 0) {
      console.log('Seeding default classroom discussion topics...');
      
      // Fetch Alisha (teacher) user_id, Rohan (teacher) user_id, Rahul (student) user_id, Sana (student) user_id
      const [tAlisha] = await connection.query("SELECT t.id, u.id AS user_id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = 'alisha@school.com'");
      const [tRohan] = await connection.query("SELECT t.id, u.id AS user_id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = 'rohan@school.com'");
      const [uRahul] = await connection.query("SELECT id FROM users WHERE email = 'rahul@school.com'");
      const [uSana] = await connection.query("SELECT id FROM users WHERE email = 'sana@school.com'");

      if (tAlisha.length > 0 && tRohan.length > 0 && uRahul.length > 0 && uSana.length > 0) {
        const alishaId = tAlisha[0].id;
        const alishaUserId = tAlisha[0].user_id;
        const rohanId = tRohan[0].id;
        const rohanUserId = tRohan[0].user_id;
        const rahulUserId = uRahul[0].id;
        const sanaUserId = uSana[0].id;

        // Topic 1: JavaScript Async/Await vs Promises (Class 10-A, Alisha)
        const [topic1] = await connection.query(`
          INSERT INTO discussion_topics (teacher_id, title, description, class_grade)
          VALUES (?, 'Understanding JS Async/Await vs Promises', 'Let us discuss how asynchronous workflows are handled in modern JS. Post your doubts or code snippets here!', 'Class 10-A')
        `, [alishaId]);

        // Topic 2: Database Normalization 3NF Rules (Class 12-B, Alisha)
        const [topic2] = await connection.query(`
          INSERT INTO discussion_topics (teacher_id, title, description, class_grade)
          VALUES (?, 'Database Normalization: 3NF vs BCNF', 'What are the main criteria to transition a schema from 3NF to BCNF? Share examples.', 'Class 12-B')
        `, [alishaId]);

        // Topic 3: Calculus Integration Techniques (Class 12-B, Rohan)
        const [topic3] = await connection.query(`
          INSERT INTO discussion_topics (teacher_id, title, description, class_grade)
          VALUES (?, 'Limits & Integration by Parts Doubts', 'Use this topic to share math integration worksheets or ask questions on complex integration bounds.', 'Class 12-B')
        `, [rohanId]);

        // Seed Posts (Replies) for Topic 1
        const [post1] = await connection.query(`
          INSERT INTO discussion_posts (topic_id, user_id, content)
          VALUES (?, ?, 'Maam, when should we prefer Promises over Async/Await?')
        `, [topic1.insertId, rahulUserId]);

        const [post2] = await connection.query(`
          INSERT INTO discussion_posts (topic_id, user_id, content)
          VALUES (?, ?, 'Great question! Use Promises when executing operations concurrently using Promise.all(). Async/await is cleaner for sequential logic.')
        `, [topic1.insertId, alishaUserId]);

        // Seed Posts (Replies) for Topic 2
        const [post3] = await connection.query(`
          INSERT INTO discussion_posts (topic_id, user_id, content)
          VALUES (?, ?, 'Does BCNF completely eliminate all multi-valued dependencies?')
        `, [topic2.insertId, sanaUserId]);

        const [post4] = await connection.query(`
          INSERT INTO discussion_posts (topic_id, user_id, content)
          VALUES (?, ?, 'BCNF handles anomalies from overlapping candidate keys, but multi-valued dependencies are resolved in 4NF!')
        `, [topic2.insertId, alishaUserId]);

        // Seed default upvotes
        await connection.query(`
          INSERT INTO discussion_upvotes (post_id, user_id)
          VALUES (?, ?)
        `, [post2.insertId, rahulUserId]);

        await connection.query(`
          INSERT INTO discussion_upvotes (post_id, user_id)
          VALUES (?, ?)
        `, [post4.insertId, sanaUserId]);
      }
      console.log('Seeded default classroom discussion topics and replies successfully.');

      // Seed default Emergency Alerts
      const [adminUser] = await connection.query("SELECT id FROM users WHERE email = 'admin@school.com'");
      if (adminUser.length > 0) {
        const adminId = adminUser[0].id;
        await connection.query(`
          INSERT INTO emergency_alerts (sender_id, title, message, severity, channels)
          VALUES (?, ?, ?, ?, ?)
        `, [adminId, 'Severe Weather Warning: Early School Dismissal', 'Due to extreme torrential rains and local waterlogging alerts, all classes are suspended early today at 12:30 PM. School bus routes will run accordingly. Stay safe!', 'critical', 'email,sms,in-app']);

        await connection.query(`
          INSERT INTO emergency_alerts (sender_id, title, message, severity, channels)
          VALUES (?, ?, ?, ?, ?)
        `, [adminId, 'Annual Fire Safety Drill Notification', 'The annual school evacuation drill is scheduled for tomorrow at 10:00 AM. All staff and pupils must cooperate and proceed to the assembly ground upon hearing the alarm.', 'medium', 'in-app']);
        
        console.log('Seeded default emergency alerts successfully.');
      }
    }

    // Seed default Study Resources if resources table is empty
    const [existingResources] = await connection.query('SELECT COUNT(*) AS count FROM resources');
    if (existingResources[0].count === 0) {
      const [teacherCS] = await connection.query("SELECT t.id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = 'alisha@school.com'");
      const [teacherMath] = await connection.query("SELECT t.id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = 'rohan@school.com'");
      
      if (teacherCS.length > 0) {
        const teacherCSId = teacherCS[0].id;
        await connection.query(`
          INSERT INTO resources (teacher_id, title, description, subject, resource_type, file_url, class_grade)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          teacherCSId,
          'Introduction to Relational Databases & SQL Queries',
          'A comprehensive PDF guide covering database normalization, primary/foreign keys, and standard SELECT query joins.',
          'Computer Science',
          'pdf',
          'http://localhost:5000/mock-uploads/intro-to-databases.pdf',
          'Class 12-B'
        ]);

        await connection.query(`
          INSERT INTO resources (teacher_id, title, description, subject, resource_type, file_url, class_grade)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          teacherCSId,
          'React JS Fundamentals - Hooks (useState, useEffect)',
          'An instructional video lesson explaining React components structure, state rendering lifecycle, and effects triggers.',
          'Computer Science',
          'video',
          'https://www.youtube.com/embed/dpw9EHDh2bM',
          'Class 12-B'
        ]);
      }

      if (teacherMath.length > 0) {
        const teacherMathId = teacherMath[0].id;
        await connection.query(`
          INSERT INTO resources (teacher_id, title, description, subject, resource_type, file_url, class_grade)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          teacherMathId,
          'Calculus limits and continuity notes',
          'Class note summarizing limits theorems, continuity requirements, and standard derivatives solutions rules.',
          'Mathematics',
          'notes',
          'http://localhost:5000/mock-uploads/limits-lecture-notes.txt',
          'Class 12-B'
        ]);
      }
      
      console.log('Seeded default study resources successfully.');
    }

    // Seed default Colleges
    const [existingColleges] = await connection.query('SELECT COUNT(*) AS count FROM colleges');
    if (existingColleges[0].count === 0) {
      await connection.query(`
        INSERT INTO colleges (name, location, courses, ranking, website, requirements)
        VALUES 
        ('Massachusetts Institute of Technology (MIT)', 'Cambridge, MA, USA', 'Computer Science & AI, Data Science, Electrical Engineering', 'QS World Rank #1', 'https://mit.edu', 'Grade Average > 95% in Mathematics & CS, high Coding proficiency.'),
        ('Stanford University', 'Stanford, CA, USA', 'Software Engineering, Symbol Systems, Applied Physics, Fine Arts', 'QS World Rank #2', 'https://stanford.edu', 'Grade Average > 93%, high Coding or Creative Arts skill profile.'),
        ('University of Oxford', 'Oxford, United Kingdom', 'Mathematics & Computer Science, Physics, English Literature', 'QS World Rank #3', 'https://ox.ac.uk', 'Grade Average > 94%, Mathematics average > 90% and High Communication.'),
        ('California Institute of the Arts (CalArts)', 'Valencia, CA, USA', 'Digital Media & Graphic Design, Fine Arts, Character Animation', 'QS Art Rank #5', 'https://calarts.edu', 'Arts Skill level > 75%, visual portfolio review, average grades > 80%.'),
        ('Loughborough University', 'Loughborough, United Kingdom', 'Sports Science, Sports Coaching & Physical Education, Kinesiology', 'QS Sports Rank #1', 'https://lboro.ac.uk', 'Sports Skill level > 80%, Physical fitness trials, average grades > 75%.')
      `);
      console.log('Seeded default colleges successfully.');
    }

    // Seed default Scholarships
    const [existingScholarships] = await connection.query('SELECT COUNT(*) AS count FROM scholarships');
    if (existingScholarships[0].count === 0) {
      await connection.query(`
        INSERT INTO scholarships (name, provider, amount, eligibility, deadline, website)
        VALUES 
        ('Tech Future Pioneers Scholarship', 'Future Tech Foundation', 'Full Tuition Fee Coverage', 'Grade Average > 90% in CS and Mathematics, Coding Skill > 70%.', '2026-12-15', 'https://example.com/scholarships/tech-innovators'),
        ('Elite Academic Merit Award', 'Global Education Trust', '$20,000 per academic year', 'Overall Grade Average > 92% across all terms, Communication Skill > 80%.', '2026-11-30', 'https://example.com/scholarships/academic-merit'),
        ('Creative Minds Arts Fellowship', 'National Endowment for the Arts', '$15,000 annual stipend', 'Arts Skill level > 75%, portfolio submission and teacher recommendation.', '2026-10-10', 'https://example.com/scholarships/creative-minds'),
        ('Athletic Excellence Scholarship', 'Sports Industry Council', '$10,000 award & professional coaching', 'Sports Skill level > 80%, representation in regional leagues, average grade > 75%.', '2026-09-05', 'https://example.com/scholarships/athletic-excellence')
      `);
      console.log('Seeded default scholarships successfully.');
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
