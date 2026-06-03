const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. Fetch own/linked-child skill profile and achievements portfolio (Students and Parents only)
router.get('/', verifyToken, requireRole(['student', 'parent']), skillController.getMyProfile);

// 2. Fetch specific student's profile (Admins, Teachers, Students, Parents with ownership check inside controller)
router.get('/student/:studentId', verifyToken, skillController.getStudentProfile);

// 3. Update skill metrics ratings (Admins & Teachers only)
router.post('/student/:studentId', verifyToken, requireRole(['admin', 'teacher']), skillController.updateStudentSkills);

// 4. Add portfolio achievement (Admins, Teachers, Students, Parents)
router.post('/achievements', verifyToken, skillController.addAchievement);

// 5. Delete portfolio achievement (Admins, Teachers, Students, Parents)
router.delete('/achievements/:id', verifyToken, skillController.deleteAchievement);

module.exports = router;
