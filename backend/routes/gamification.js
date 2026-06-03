const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protect all gamification routes
router.use(verifyToken);

// @route   GET api/gamification/status/:studentId
// @desc    Get student gamification details
router.get('/status/:studentId', gamificationController.getStudentGamificationStatus);

// @route   GET api/gamification/leaderboard
// @desc    Get global student rankings leaderboard
router.get('/leaderboard', gamificationController.getLeaderboard);

// @route   GET api/gamification/badges
// @desc    Get all available badges in the system
router.get('/badges', gamificationController.getBadges);

// @route   POST api/gamification/badges
// @desc    Create a new customizable badge (Teachers & Admins only)
router.post('/badges', requireRole(['admin', 'teacher']), gamificationController.createBadge);

// @route   POST api/gamification/award-badge
// @desc    Award a badge to a student (Teachers & Admins only)
router.post('/award-badge', requireRole(['admin', 'teacher']), gamificationController.awardBadge);

// @route   POST api/gamification/award-points
// @desc    Award points to a student (Teachers & Admins only)
router.post('/award-points', requireRole(['admin', 'teacher']), gamificationController.awardPoints);

module.exports = router;
