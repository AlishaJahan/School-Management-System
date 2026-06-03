const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// 1. Create a new school event (Admins & Teachers only)
router.post('/', verifyToken, requireRole(['admin', 'teacher']), eventController.createEvent);

// 2. Fetch school events catalog (All authenticated users)
router.get('/', verifyToken, eventController.getEvents);

// 3. Get my dynamic certificates list (Students only)
router.get('/my-certificates', verifyToken, requireRole(['student']), eventController.getMyCertificates);

// 4. Register for an upcoming event (Students only)
router.post('/:id/register', verifyToken, requireRole(['student']), eventController.registerForEvent);

// 5. Cancel registration from an upcoming event (Students only)
router.post('/:id/unregister', verifyToken, requireRole(['student']), eventController.unregisterFromEvent);

// 6. Get registrations list for an event (Admins & Teachers only)
router.get('/:id/registrations', verifyToken, requireRole(['admin', 'teacher']), eventController.getEventRegistrations);

// 7. Mark event attendance for a student (Admins & Teachers only)
router.post('/:id/attendance', verifyToken, requireRole(['admin', 'teacher']), eventController.markEventAttendance);

module.exports = router;
