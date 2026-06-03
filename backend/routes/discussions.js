const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. Fetch all discussion boards/topics (All authenticated users - scoped inside controller)
router.get('/', verifyToken, discussionController.getTopics);

// 2. Create a new discussion board topic (Admins & Teachers only)
router.post('/', verifyToken, requireRole(['admin', 'teacher']), discussionController.createTopic);

// 3. Fetch details of a topic thread, including replies list (All authenticated users)
router.get('/:topicId', verifyToken, discussionController.getTopicDetails);

// 4. Submit response reply to a topic thread (All authenticated users - parents blocked inside controller)
router.post('/:topicId/posts', verifyToken, discussionController.addPost);

// 5. Toggle helpful answer upvote status (All authenticated users)
router.post('/posts/:postId/upvote', verifyToken, discussionController.toggleUpvote);

// 6. Delete a topic thread (Admins & Teacher creators only)
router.delete('/:topicId', verifyToken, requireRole(['admin', 'teacher']), discussionController.deleteTopic);

// 7. Delete a post reply (Post author, Teachers, Admins)
router.delete('/posts/:postId', verifyToken, discussionController.deletePost);

module.exports = router;
