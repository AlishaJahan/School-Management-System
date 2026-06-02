const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// @route   GET api/parent/child-insights
// @desc    Get linked child performance and attendance analysis
// @access  Private (Parents only)
router.get('/child-insights', verifyToken, requireRole(['parent']), parentController.getChildInsights);

// @route   GET api/parent/teachers
// @desc    Get teachers list
// @access  Private (Parents only)
router.get('/teachers', verifyToken, requireRole(['parent']), parentController.getChildTeachers);

// @route   GET api/parent/contacts
// @desc    Get contacts list mapped to role (teachers for parents, parents for teachers)
// @access  Private
router.get('/contacts', verifyToken, parentController.getInboxContacts);

// @route   GET api/parent/messages/:targetId
// @desc    Get chronological chat thread messages between users
// @access  Private
router.get('/messages/:targetId', verifyToken, parentController.getMessageThread);

// @route   POST api/parent/messages/send
// @desc    Post a new text message block
// @access  Private
router.post('/messages/send', verifyToken, parentController.sendMessage);

module.exports = router;
