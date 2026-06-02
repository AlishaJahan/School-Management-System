const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { verifyToken } = require('../middleware/auth');

// @route   POST api/homework/ask
// @desc    Get progressive hints for a homework problem
// @access  Private (Registered students, teachers, and admins)
router.post('/ask', verifyToken, homeworkController.askHomeworkQuestion);

module.exports = router;
