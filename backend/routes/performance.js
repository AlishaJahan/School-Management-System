const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const teacherPerformanceController = require('../controllers/teacherPerformanceController');

// 1. Get performance metrics (Teachers can query 'me', Admins can query any ID)
router.get('/metrics/:teacherId', verifyToken, teacherPerformanceController.getTeacherPerformanceMetrics);

// 2. Get active teachers list (Students can select a teacher for feedback, Admins can inspect a teacher)
router.get('/teachers', verifyToken, teacherPerformanceController.getTeachersList);

// 3. Submit anonymous feedback for a teacher (Students only)
router.post('/feedback', verifyToken, requireRole(['student']), teacherPerformanceController.submitTeacherFeedback);

// 4. Create a new assignment (Teachers only)
router.post('/assignments', verifyToken, requireRole(['teacher']), teacherPerformanceController.createAssignment);

module.exports = router;
