const { getPool } = require('../config/db');

// @route   POST api/resources
// @desc    Create a new study resource (notes, pdf, video)
// @access  Private (Teachers/Admins only)
exports.createResource = async (req, res) => {
  const { title, description, subject, resource_type, file_url, class_grade } = req.body;

  if (!title || !subject || !resource_type || !file_url || !class_grade) {
    return res.status(400).json({ message: 'Title, Subject, Resource Type, File URL, and Class Grade are required fields.' });
  }

  const validTypes = ['notes', 'pdf', 'video', 'other'];
  if (!validTypes.includes(resource_type.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid resource type. Supported: notes, pdf, video, other.' });
  }

  try {
    const pool = getPool();

    // Retrieve target teacher_id corresponding to req.user.id
    // If the requester is an admin, they can either act as a placeholder teacher or we find an active teacher.
    // However, the rule specifies "Teachers upload notes...". So they must be a teacher.
    // If Admin uploads, we map them to Alisha Jahan (teacher_id = 1) or look up one.
    let teacherId = null;
    
    if (req.user.role === 'admin') {
      // Find any active teacher
      const [anyTeacher] = await pool.query('SELECT id FROM teachers LIMIT 1');
      if (anyTeacher.length > 0) {
        teacherId = anyTeacher[0].id;
      } else {
        return res.status(400).json({ message: 'No registered teachers found to associate this resource with.' });
      }
    } else {
      const [teacherCheck] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacherCheck.length === 0) {
        return res.status(403).json({ message: 'Access denied. You must have an active teacher profile to share study materials.' });
      }
      teacherId = teacherCheck[0].id;
    }

    const [result] = await pool.query(`
      INSERT INTO resources (teacher_id, title, description, subject, resource_type, file_url, class_grade)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      teacherId,
      title.trim(),
      description ? description.trim() : null,
      subject.trim(),
      resource_type.toLowerCase(),
      file_url.trim(),
      class_grade.trim()
    ]);

    res.status(201).json({
      message: 'Study resource successfully uploaded and shared!',
      resource: {
        id: result.insertId,
        teacher_id: teacherId,
        title,
        description,
        subject,
        resource_type,
        file_url,
        class_grade,
        created_at: new Date()
      }
    });

  } catch (err) {
    console.error('Error creating study resource:', err);
    res.status(500).json({ message: 'Internal server error uploading study resource.' });
  }
};

// @route   GET api/resources
// @desc    Get study resources with optional filters
// @access  Private (All authenticated roles)
exports.getResources = async (req, res) => {
  const { subject, class_grade } = req.query;

  try {
    const pool = getPool();
    
    let query = `
      SELECT r.*, u.name AS teacher_name, t.subject AS teacher_specialty
      FROM resources r
      JOIN teachers t ON r.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (subject) {
      conditions.push('r.subject = ?');
      params.push(subject);
    }

    if (class_grade) {
      conditions.push('r.class_grade = ?');
      params.push(class_grade);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC';

    const [resources] = await pool.query(query, params);
    res.json(resources);

  } catch (err) {
    console.error('Error fetching study resources:', err);
    res.status(500).json({ message: 'Internal server error fetching study resources.' });
  }
};

// @route   DELETE api/resources/:id
// @desc    Delete/retract a study resource
// @access  Private (Teachers/Admins only)
exports.deleteResource = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getPool();

    // Verify resource exists
    const [resourceCheck] = await pool.query('SELECT teacher_id FROM resources WHERE id = ?', [id]);
    if (resourceCheck.length === 0) {
      return res.status(404).json({ message: 'Study resource not found.' });
    }

    // Authorization: Admin or owner teacher
    if (req.user.role !== 'admin') {
      const [teacherCheck] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
      if (teacherCheck.length === 0 || teacherCheck[0].id !== resourceCheck[0].teacher_id) {
        return res.status(403).json({ message: 'Access denied. You are not authorized to delete this study resource.' });
      }
    }

    await pool.query('DELETE FROM resources WHERE id = ?', [id]);

    res.json({ message: 'Study resource deleted successfully.' });

  } catch (err) {
    console.error('Error deleting study resource:', err);
    res.status(500).json({ message: 'Internal server error deleting study resource.' });
  }
};
