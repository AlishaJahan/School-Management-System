const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protect all routes with auth token validation
router.use(verifyToken);

// @route   GET api/insights/dashboard
// @desc    Get dashboard metrics, at-risk listings, and aggregate classroom data
// @access  Private (Admins & Teachers)
router.get('/dashboard', requireRole(['admin', 'teacher']), insightsController.getDashboardInsights);

// @route   GET api/insights/student/:studentId
// @desc    Get single student detailed AI suggestions report
// @access  Private (Admins, Teachers, or matching Student)
router.get('/student/:studentId', insightsController.getStudentInsights);

// @route   GET api/insights/report-card/:studentId
// @desc    Get AI-generated report card remarks and academic metrics
// @access  Private (Admin, Teacher, Student for themselves, Parent for child)
router.get('/report-card/:studentId', insightsController.getReportCard);

// @route   POST api/insights/suggestions/regenerate
// @desc    Regenerate personalized suggestions (Simulated deep analysis trigger)
// @access  Private (Admins & Teachers)
router.post('/suggestions/regenerate', requireRole(['admin', 'teacher']), insightsController.regenerateSuggestions);

module.exports = router;
