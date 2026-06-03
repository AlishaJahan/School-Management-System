const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const examController = require('../controllers/examController');

// 1. Create a new MCQ exam (Admins & Teachers only)
router.post('/', verifyToken, requireRole(['admin', 'teacher']), examController.createExam);

// 2. Fetch exams catalog (All authenticated users)
router.get('/', verifyToken, examController.getExams);

// 3. Get student performance metrics dashboard (Students only)
router.get('/student/dashboard', verifyToken, requireRole(['student']), examController.getStudentExamDashboard);

// 4. Fetch details of an exam (All authenticated users)
router.get('/:id', verifyToken, examController.getExamById);

// 5. Submit answers for grading (Students only)
router.post('/:id/submit', verifyToken, requireRole(['student']), examController.submitExamAnswers);

// 6. Get exam submissions analytics data (Admins & Teachers only)
router.get('/:id/analytics', verifyToken, requireRole(['admin', 'teacher']), examController.getExamAnalytics);

module.exports = router;
