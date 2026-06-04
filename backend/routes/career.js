const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const { verifyToken } = require('../middleware/auth');

// Protect all career guidance endpoints
router.use(verifyToken);

// @route   GET api/career/guidance
// @desc    Get performance-based career guidance analysis
// @access  Private (All authenticated roles)
router.get('/guidance', careerController.getCareerGuidance);

module.exports = router;
