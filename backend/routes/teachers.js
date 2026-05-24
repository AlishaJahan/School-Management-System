const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protect all routes under teachers - only Admins can manage teachers
router.use(verifyToken);
router.use(requireRole(['admin']));

// @route   GET api/teachers
// @desc    Get all teachers with search filtering
router.get('/', teacherController.getAllTeachers);

// @route   GET api/teachers/:id
// @desc    Get a teacher by id
router.get('/:id', teacherController.getTeacherById);

// @route   POST api/teachers
// @desc    Create a new teacher
router.post('/', teacherController.createTeacher);

// @route   PUT api/teachers/:id
// @desc    Update a teacher
router.put('/:id', teacherController.updateTeacher);

// @route   DELETE api/teachers/:id
// @desc    Delete a teacher
router.delete('/:id', teacherController.deleteTeacher);

module.exports = router;
