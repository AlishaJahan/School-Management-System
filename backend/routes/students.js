const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protect all routes under students - only Admins and Teachers can manage students
router.use(verifyToken);
router.use(requireRole(['admin', 'teacher']));

// @route   GET api/students
// @desc    Get all students with search filtering
router.get('/', studentController.getAllStudents);

// @route   GET api/students/:id
// @desc    Get a student by id
router.get('/:id', studentController.getStudentById);

// @route   POST api/students
// @desc    Create a new student
router.post('/', studentController.createStudent);

// @route   PUT api/students/:id
// @desc    Update a student
router.put('/:id', studentController.updateStudent);

// @route   DELETE api/students/:id
// @desc    Delete a student
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
