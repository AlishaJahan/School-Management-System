const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protect all resource sharing endpoints
router.use(verifyToken);

// @route   GET api/resources
// @desc    Get study resources with optional filters
// @access  Private (All authenticated roles)
router.get('/', resourceController.getResources);

// @route   POST api/resources
// @desc    Create a new study resource (notes, pdf, video)
// @access  Private (Teachers/Admins only)
router.post('/', requireRole(['teacher', 'admin']), resourceController.createResource);

// @route   DELETE api/resources/:id
// @desc    Delete/retract a study resource
// @access  Private (Teachers/Admins only)
router.delete('/:id', requireRole(['teacher', 'admin']), resourceController.deleteResource);

module.exports = router;
