const { getPool } = require('../config/db');

// @route   GET api/discussions
// @desc    Get classroom discussion topics (scoped by grade for student/parent)
// @access  Private
exports.getTopics = async (req, res) => {
  const pool = getPool();
  try {
    let query = `
      SELECT dt.id, dt.title, dt.description, dt.class_grade, dt.created_at, u.name AS teacher_name
      FROM discussion_topics dt
      JOIN teachers t ON dt.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
    `;
    let queryParams = [];

    if (req.user.role === 'student') {
      const [studentRows] = await pool.query('SELECT class_grade FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0) {
        return res.status(404).json({ message: 'Student profile not found.' });
      }
      query += ` WHERE dt.class_grade = ?`;
      queryParams.push(studentRows[0].class_grade);
    } else if (req.user.role === 'parent') {
      const [parentRows] = await pool.query(`
        SELECT s.class_grade FROM parents p 
        JOIN students s ON p.student_id = s.id 
        WHERE p.user_id = ?
      `, [req.user.id]);
      if (parentRows.length === 0) {
        return res.status(404).json({ message: 'Linked child student record not found.' });
      }
      query += ` WHERE dt.class_grade = ?`;
      queryParams.push(parentRows[0].class_grade);
    }

    query += ` ORDER BY dt.created_at DESC`;
    const [topics] = await pool.query(query, queryParams);
    res.json(topics);

  } catch (err) {
    console.error('Error fetching discussion topics:', err);
    res.status(500).json({ message: 'Server error retrieving discussion boards.' });
  }
};

// @route   POST api/discussions
// @desc    Create a new discussion topic (Teachers & Admins only)
// @access  Private (Teacher, Admin)
exports.createTopic = async (req, res) => {
  const { title, description, class_grade } = req.body;

  if (!title || !class_grade) {
    return res.status(400).json({ message: 'Title and target classroom class grade are required.' });
  }

  const pool = getPool();
  try {
    // Resolve teacher ID
    let teacherId;
    if (req.user.role === 'teacher') {
      const [tRows] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (tRows.length === 0) {
        return res.status(404).json({ message: 'Teacher profile details not found.' });
      }
      teacherId = tRows[0].id;
    } else {
      // Admin placeholder
      const [firstT] = await pool.query('SELECT id FROM teachers LIMIT 1');
      if (firstT.length === 0) {
        return res.status(404).json({ message: 'No registered faculty to assign discussion moderator.' });
      }
      teacherId = firstT[0].id;
    }

    const [result] = await pool.query(`
      INSERT INTO discussion_topics (teacher_id, title, description, class_grade)
      VALUES (?, ?, ?, ?)
    `, [teacherId, title, description || null, class_grade]);

    res.status(201).json({
      message: 'Discussion topic successfully created!',
      topic_id: result.insertId
    });

  } catch (err) {
    console.error('Error creating discussion topic:', err);
    res.status(500).json({ message: 'Server error creating discussion board.' });
  }
};

// @route   GET api/discussions/:topicId
// @desc    Get topic details and all posts/answers inside (with upvotes data)
// @access  Private
exports.getTopicDetails = async (req, res) => {
  const { topicId } = req.params;
  const pool = getPool();

  try {
    // 1. Fetch topic header info
    const [topics] = await pool.query(`
      SELECT dt.id, dt.title, dt.description, dt.class_grade, dt.created_at, u.name AS teacher_name
      FROM discussion_topics dt
      JOIN teachers t ON dt.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE dt.id = ?
    `, [topicId]);

    if (topics.length === 0) {
      return res.status(404).json({ message: 'Discussion topic not found.' });
    }
    const topic = topics[0];

    // Verification check for students/parents access scope
    if (req.user.role === 'student') {
      const [studentRows] = await pool.query('SELECT class_grade FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0 || studentRows[0].class_grade !== topic.class_grade) {
        return res.status(403).json({ message: 'Access denied. You can only view discussions for your enrolled class.' });
      }
    } else if (req.user.role === 'parent') {
      const [parentRows] = await pool.query(`
        SELECT s.class_grade FROM parents p 
        JOIN students s ON p.student_id = s.id 
        WHERE p.user_id = ?
      `, [req.user.id]);
      if (parentRows.length === 0 || parentRows[0].class_grade !== topic.class_grade) {
        return res.status(403).json({ message: 'Access denied. You can only view discussions for your child\'s class.' });
      }
    }

    // 2. Fetch all replies (posts)
    const [posts] = await pool.query(`
      SELECT dp.id, dp.content, dp.created_at, u.name AS user_name, u.role AS user_role, u.id AS author_id,
             (SELECT COUNT(*) FROM discussion_upvotes WHERE post_id = dp.id) AS upvote_count,
             IF((SELECT COUNT(*) FROM discussion_upvotes WHERE post_id = dp.id AND user_id = ?) > 0, 1, 0) AS has_upvoted
      FROM discussion_posts dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.topic_id = ?
      ORDER BY dp.created_at ASC
    `, [req.user.id, topicId]);

    res.json({
      topic,
      posts
    });

  } catch (err) {
    console.error('Error fetching discussion details:', err);
    res.status(500).json({ message: 'Server error compiling discussion thread.' });
  }
};

// @route   POST api/discussions/:topicId/posts
// @desc    Submit a post/reply to a discussion topic
// @access  Private
exports.addPost = async (req, res) => {
  const { topicId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Post content cannot be blank.' });
  }

  const pool = getPool();
  try {
    // 1. Verify topic scope
    const [topics] = await pool.query('SELECT class_grade FROM discussion_topics WHERE id = ?', [topicId]);
    if (topics.length === 0) {
      return res.status(404).json({ message: 'Discussion topic not found.' });
    }
    const classGrade = topics[0].class_grade;

    // Students/parents authorization validation check
    if (req.user.role === 'student') {
      const [studentRows] = await pool.query('SELECT class_grade FROM students WHERE user_id = ?', [req.user.id]);
      if (studentRows.length === 0 || studentRows[0].class_grade !== classGrade) {
        return res.status(403).json({ message: 'You can only post in topics assigned to your classroom.' });
      }
    } else if (req.user.role === 'parent') {
      return res.status(403).json({ message: 'Parents have view-only access to classroom discussion boards.' });
    }

    // 2. Insert reply post
    const [result] = await pool.query(`
      INSERT INTO discussion_posts (topic_id, user_id, content)
      VALUES (?, ?, ?)
    `, [topicId, req.user.id, content]);

    res.status(201).json({
      message: 'Reply successfully posted!',
      post_id: result.insertId
    });

  } catch (err) {
    console.error('Error posting response:', err);
    res.status(500).json({ message: 'Server error publishing response.' });
  }
};

// @route   POST api/discussions/posts/:postId/upvote
// @desc    Toggle upvote helpful status for a post response
// @access  Private
exports.toggleUpvote = async (req, res) => {
  const { postId } = req.params;
  const pool = getPool();

  try {
    // Check if post exists
    const [posts] = await pool.query('SELECT id FROM discussion_posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Discussion post not found.' });
    }

    // Check if already upvoted
    const [existing] = await pool.query(
      'SELECT id FROM discussion_upvotes WHERE post_id = ? AND user_id = ?',
      [postId, req.user.id]
    );

    let upvoted = false;
    if (existing.length > 0) {
      // Retract upvote
      await pool.query('DELETE FROM discussion_upvotes WHERE id = ?', [existing[0].id]);
    } else {
      // Apply upvote
      await pool.query('INSERT INTO discussion_upvotes (post_id, user_id) VALUES (?, ?)', [postId, req.user.id]);
      upvoted = true;
    }

    // Get updated upvotes count
    const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM discussion_upvotes WHERE post_id = ?', [postId]);
    const upvoteCount = countRows[0].count;

    res.json({
      upvoted,
      upvote_count: upvoteCount
    });

  } catch (err) {
    console.error('Error toggling upvote:', err);
    res.status(500).json({ message: 'Server error processing upvote change.' });
  }
};

// @route   DELETE api/discussions/:topicId
// @desc    Delete discussion topic (Admins & Topic Creator Teachers only)
// @access  Private
exports.deleteTopic = async (req, res) => {
  const { topicId } = req.params;
  const pool = getPool();

  try {
    // Check topic
    const [topics] = await pool.query('SELECT teacher_id FROM discussion_topics WHERE id = ?', [topicId]);
    if (topics.length === 0) {
      return res.status(404).json({ message: 'Discussion topic not found.' });
    }
    const topicCreatorId = topics[0].teacher_id;

    if (req.user.role === 'teacher') {
      const [tRows] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (tRows.length === 0 || tRows[0].id !== topicCreatorId) {
        return res.status(403).json({ message: 'Unauthorized. Teachers can only delete topics they created.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Access denied.' });
    }

    await pool.query('DELETE FROM discussion_topics WHERE id = ?', [topicId]);
    res.json({ message: 'Discussion topic successfully deleted.' });

  } catch (err) {
    console.error('Error deleting topic:', err);
    res.status(500).json({ message: 'Server error deleting topic.' });
  }
};

// @route   DELETE api/discussions/posts/:postId
// @desc    Delete response post (Author, Teacher, or Admin only)
// @access  Private
exports.deletePost = async (req, res) => {
  const { postId } = req.params;
  const pool = getPool();

  try {
    const [posts] = await pool.query('SELECT user_id FROM discussion_posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Discussion post not found.' });
    }
    const authorId = posts[0].user_id;

    if (req.user.id !== authorId && req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Unauthorized. You cannot delete this post response.' });
    }

    await pool.query('DELETE FROM discussion_posts WHERE id = ?', [postId]);
    res.json({ message: 'Post response successfully deleted.' });

  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Server error deleting post.' });
  }
};
