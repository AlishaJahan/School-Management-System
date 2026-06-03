const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const complaintController = require('../controllers/complaintController');

// 1. Submit a complaint or suggestion (Students only)
router.post('/', verifyToken, requireRole(['student']), complaintController.submitComplaint);

// 2. Track my submitted complaints and statuses (Students only)
router.get('/my', verifyToken, requireRole(['student']), complaintController.getStudentComplaints);

// 3. View all tickets (Admins/Principal only)
router.get('/admin', verifyToken, requireRole(['admin']), complaintController.getAdminComplaints);

// 4. Update status and response remarks of a ticket (Admins/Principal only)
router.put('/:id/status', verifyToken, requireRole(['admin']), complaintController.updateComplaintStatus);

module.exports = router;
