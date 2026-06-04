const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protect all emergency alert routes
router.use(verifyToken);

// @route   GET api/alerts
// @desc    Get all recent emergency alerts
// @access  Private (All authenticated roles)
router.get('/', alertController.getAlerts);

// @route   POST api/alerts
// @desc    Create a new emergency alert and broadcast it
// @access  Private (Admins only)
router.post('/', requireRole(['admin']), alertController.createAlert);

// @route   DELETE api/alerts/:id
// @desc    Delete/retract an emergency alert
// @access  Private (Admins only)
router.delete('/:id', requireRole(['admin']), alertController.deleteAlert);

module.exports = router;
