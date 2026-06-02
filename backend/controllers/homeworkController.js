const { getPool } = require('../config/db');

// In-Memory rules list for socratic mapping
const socraticTopicRegistry = [
  // Math: Quadratic equations
  {
    keywords: ['quadratic', 'x^2', 'x²', 'factor', 'solve for x', 'equation'],
    subject: 'Mathematics',
    concept: 'Quadratic Equations (ax² + bx + c = 0)',
    explanation: 'A quadratic equation is a second-degree polynomial equation. The solutions represent the points where the parabola crosses the x-axis.',
    hints: [
      'Look at the coefficients: a is the coefficient of x², b is the coefficient of x, and c is the constant term.',
      'Consider whether you can factor the equation into two binomials, or if using the quadratic formula: x = [-b ± √(b² - 4ac)] / (2a) is more straightforward.',
      'Check if the discriminant (b² - 4ac) is positive, zero, or negative. This tells you if the roots are real and distinct, real and repeated, or complex.'
    ],
    guidedStep: 'First, rewrite the equation so that all terms are on one side, leaving 0 on the other (ax² + bx + c = 0). Then, identify your a, b, and c parameters.',
    selfCheck: 'If you have x² - 5x + 6 = 0, what two numbers multiply to +6 and add up to -5?'
  },
  // Math: Calculus / integration
  {
    keywords: ['integrate', 'integration', 'derivative', 'dx', 'dy/dx', 'calculus', 'limit'],
    subject: 'Mathematics',
    concept: 'Calculus & Integration Rules',
    explanation: 'Derivatives measure the rate of change (slope), while integrals sum up areas under a curve. They are inverse operations of each other.',
    hints: [
      'For derivatives of power terms, remember the Power Rule: d/dx[xⁿ] = n * xⁿ⁻¹.',
      'For integration, the reverse Power Rule states that the integral of xⁿ dx is [xⁿ⁺¹ / (n + 1)] + C, provided n is not equal to -1.',
      'If the expression is a product of two functions, check if you need substitution (u-substitution) or integration by parts (∫ u dv = uv - ∫ v du).'
    ],
    guidedStep: 'Identify if you are taking a derivative or an integral. Locate the variable of interest, extract constants outside the operation, and write down the power rule template.',
    selfCheck: 'What is the derivative of 3x² with respect to x?'
  },
  // CS: SQL Joins
  {
    keywords: ['sql', 'join', 'select', 'database', 'query', 'primary key', 'foreign key'],
    subject: 'Computer Science',
    concept: 'Relational Database Queries & JOINs',
    explanation: 'JOIN clauses are used in SQL to combine rows from two or more tables based on a related column between them.',
    hints: [
      'An INNER JOIN returns only records that have matching values in both tables.',
      'A LEFT JOIN (or LEFT OUTER JOIN) returns all records from the left table, and the matched records from the right table. If no match is found, NULL values are returned for the right table columns.',
      'Identify the connecting key (usually a Primary Key in one table and a Foreign Key in the other) to write your ON condition.'
    ],
    guidedStep: 'Start by writing down the tables you need. Draw a venn-diagram mentally: do you want to keep unmatched rows from the left table? If yes, use a LEFT JOIN, otherwise use an INNER JOIN.',
    selfCheck: 'If Table A has 5 records and Table B has 3 matching records, how many records will an INNER JOIN output?'
  },
  // CS: Programming Loops / Loops
  {
    keywords: ['loop', 'for loop', 'while loop', 'recursion', 'recursive', 'array', 'list', 'iterate'],
    subject: 'Computer Science',
    concept: 'Loops & Iteration Controls',
    explanation: 'Iteration structures allow code to execute repeatedly based on conditions, while recursion solves problems by calling the function itself with smaller inputs.',
    hints: [
      'Every loop needs three components: initialization (starting value), a loop condition (when to stop), and an increment/update step.',
      'For recursion, always write the base case first. Without a base case, the function will call itself infinitely, causing a stack overflow.',
      'Trace your loop variable values for the first 3 iterations on a piece of paper to verify the logic.'
    ],
    guidedStep: 'Identify the state variable that changes in each step. Write down the condition that must be true for the loop to continue, and make sure it will eventually become false.',
    selfCheck: 'In a loop starting with i = 0, repeating while i < 5, and incrementing by 1 (i++), how many times does the loop body execute?'
  },
  // Physics: Velocity and Forces
  {
    keywords: ['velocity', 'acceleration', 'force', 'gravity', 'newton', 'speed', 'f=ma', 'motion'],
    subject: 'Physics',
    concept: 'Newtonian Mechanics & Equations of Motion',
    explanation: 'Forces describe the interactions between bodies, resulting in acceleration. Motion is described mathematically using displacement, velocity, acceleration, and time.',
    hints: [
      'Recall Newton\'s Second Law: Force = Mass * Acceleration (F = ma). Make sure units are in Newtons, kilograms, and meters per second squared.',
      'Write down all variables you are given: initial velocity (u), final velocity (v), acceleration (a), time (t), and displacement (s).',
      'Select the kinematic equation that connects your known values to the unknown variable (e.g. v = u + at, or s = ut + 0.5at²).'
    ],
    guidedStep: 'Draw a Free Body Diagram (FBD) listing all forces acting on the object (gravity downwards, normal force upwards, friction opposing motion, etc.). Set up the net force equation: ΣF = ma.',
    selfCheck: 'If a 5 kg block is accelerated at 3 m/s², what net horizontal force is being applied to it?'
  },
  // Chemistry: Acids & Reactions
  {
    keywords: ['acid', 'base', 'ph', 'reaction', 'balance', 'chemical', 'molecule', 'bonding'],
    subject: 'Chemistry',
    concept: 'Chemical Kinetics & pH Systems',
    explanation: 'Chemical reactions rearrange atoms to form new substances, governed by conservation of mass. Acids increase hydrogen ion concentration, whereas bases decrease it.',
    hints: [
      'To balance a chemical equation, make sure the number of atoms of each element is equal on both the reactant (left) and product (right) sides.',
      'The pH scale is logarithmic: pH = -log[H⁺]. A pH of 7 is neutral, less than 7 is acidic, and greater than 7 is basic.',
      'In a neutralization reaction, an acid reacts with a base to produce water and a salt.'
    ],
    guidedStep: 'Write the unbalanced chemical equation first. Adjust coefficients in front of molecules to balance elements one by one, starting with elements that appear in only one reactant and one product.',
    selfCheck: 'What is the pH of a solution with a hydrogen ion concentration [H⁺] of 1.0 x 10⁻⁵ M?'
  }
];

// @route   POST api/homework/ask
// @desc    Analyze homework question and generate progressive socratic hints
// @access  Private (Students, Teachers, Admins)
exports.askHomeworkQuestion = async (req, res) => {
  const { question, subject: chosenSubject } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ message: 'A homework question is required.' });
  }

  try {
    const questionLower = question.toLowerCase();
    let selectedSocratic = null;

    // 1. Try finding a matching template in the topic registry
    for (const entry of socraticTopicRegistry) {
      const matchFound = entry.keywords.some(kw => questionLower.includes(kw));
      if (matchFound) {
        selectedSocratic = entry;
        break;
      }
    }

    // 2. If no direct topic match, provide a highly intelligent generic socratic wrapper
    if (!selectedSocratic) {
      const subject = chosenSubject || 'General Studies';
      selectedSocratic = {
        subject,
        concept: `${subject} Foundations`,
        explanation: 'Let us break down this homework problem step-by-step using core principles.',
        hints: [
          'Identify what the question is asking you to solve or prove. Write down the known facts and variables.',
          'Consider what rules, formulas, or concepts connect the values you have with the result you want.',
          'Try solving a smaller, simplified version of this problem first (for example, with smaller numbers or mock variables).'
        ],
        guidedStep: 'Start by writing down a list of what you know (Given) and what you want to find (Goal). This will make it clear which formula or method applies.',
        selfCheck: 'Can you summarize what the main question is asking in your own words?'
      };
    }

    // 3. Save query log to database for audit trail (optional analytics enhancement)
    const pool = getPool();
    try {
      await pool.query(
        'INSERT INTO marks (student_id, subject, marks_obtained, max_marks, exam_type, exam_date) VALUES (?, ?, ?, ?, ?, ?)',
        [
          req.user.role === 'student' ? req.user.id : 1, // fallback to student id 1
          selectedSocratic.subject,
          0.0, // dummy fields since we reuse the table or don't want to crash
          100.0,
          'HW_ASK',
          new Date()
        ]
      );
    } catch (dbErr) {
      // Don't let audit trail failures block the student's learning response
      console.log('Skipped SQL log creation for homework helper:', dbErr.message);
    }

    // 4. Return the structured Socratic response package
    return res.json({
      question: question.trim(),
      subject: selectedSocratic.subject,
      concept: selectedSocratic.concept,
      explanation: selectedSocratic.explanation,
      hints: selectedSocratic.hints,
      guidedStep: selectedSocratic.guidedStep,
      selfCheck: selectedSocratic.selfCheck,
      timestamp: new Date()
    });

  } catch (err) {
    console.error('Error in AI Homework assistant controller:', err);
    return res.status(500).json({ message: 'Internal server error processing homework assistance.' });
  }
};
