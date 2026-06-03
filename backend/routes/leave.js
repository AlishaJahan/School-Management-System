const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protect all leave routes with authentication validation
router.use(verifyToken);

// @route   GET api/leaves/history
// @desc    Get leave requests history list
router.get('/history', leaveController.getLeaveHistory);

// @route   POST api/leaves/apply
// @desc    Submit a new leave application
router.post('/apply', leaveController.applyLeave);

// @route   POST api/leaves/review
// @desc    Approve or reject leave request (Principal/Admin only)
router.post('/review', requireRole(['admin']), leaveController.reviewLeave);

module.exports = router;
