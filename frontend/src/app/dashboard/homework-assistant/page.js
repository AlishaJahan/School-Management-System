"use client";

import { useEffect, useState } from "react";

export default function HomeworkAssistantPage() {
  const [currentUser, setCurrentUser] = useState({ name: "Student", role: "student" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Input states
  const [subject, setSubject] = useState("Mathematics");
  const [question, setQuestion] = useState("");

  // Active socratic response
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  
  // Unlocked indicators
  const [unlockedHints, setUnlockedHints] = useState({
    hint2: false,
    guidedStep: false
  });

  // Self check states
  const [studentAnswer, setStudentAnswer] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");

  // Sandbox Scratchpad
  const [scratchNotes, setScratchNotes] = useState("");

  // Past logs history
  const [historyLogs, setHistoryLogs] = useState([]);

  // Load local storage items
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    let userObj = { id: 1, name: "Student", role: "student" };
    if (savedUser) {
      try {
        userObj = JSON.parse(savedUser);
        setCurrentUser(userObj);
      } catch (e) {}
    }

    // Load persistent scratchnotes
    const savedNotes = localStorage.getItem(`student_hw_notes_${userObj.id}`);
    if (savedNotes) {
      setScratchNotes(savedNotes);
    }

    // Load persistent history logs
    const savedHistory = localStorage.getItem(`student_hw_history_${userObj.id}`);
    if (savedHistory) {
      try {
        setHistoryLogs(JSON.parse(savedHistory));
      } catch (e) {}
    }
  }, []);

  // Sync scratchnotes to local storage
  const handleScratchChange = (e) => {
    const val = e.target.value;
    setScratchNotes(val);
    localStorage.setItem(`student_hw_notes_${currentUser.id}`, val);
  };

  // Quick prompt templates
  const templates = [
    {
      label: "SQL JOIN Difference",
      subject: "Computer Science",
      q: "Explain how an SQL INNER JOIN works compared to a LEFT JOIN on a student and grades table."
    },
    {
      label: "Quadratic Equations",
      subject: "Mathematics",
      q: "How do I solve the equation x^2 - 5x + 6 = 0 using factorization?"
    },
    {
      label: "Kinematics & Newton's Law",
      subject: "Physics",
      q: "If a cart of mass 12 kg is pushed with a net force of 36 Newtons, how do I calculate its acceleration?"
    },
    {
      label: "Chemical Equation balancing",
      subject: "Chemistry",
      q: "How can I balance the combustion reaction equation: C3H8 + O2 -> CO2 + H2O?"
    }
  ];

  const handleApplyTemplate = (tpl) => {
    setSubject(tpl.subject);
    setQuestion(tpl.q);
    setSuccess("");
    setError("");
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setAnswerFeedback("");
    setStudentAnswer("");
    
    // Reset unlocks
    setUnlockedHints({
      hint2: false,
      guidedStep: false
    });

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/homework/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: question.trim(),
          subject
        })
      });

      if (!res.ok) {
        throw new Error("Socratic helper system is temporarily offline.");
      }

      const data = await res.json();
      setActiveAnalysis(data);
      setSuccess("AI Socratic tutor formulated study hints successfully!");

      // Update history logs (max 15 logs)
      const updatedLogs = [data, ...historyLogs.filter(h => h.question !== data.question)].slice(0, 15);
      setHistoryLogs(updatedLogs);
      localStorage.setItem(`student_hw_history_${currentUser.id}`, JSON.stringify(updatedLogs));

    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistoryItem = (item) => {
    setActiveAnalysis(item);
    setSubject(item.subject);
    setQuestion(item.question);
    setAnswerFeedback("");
    setStudentAnswer("");
    setUnlockedHints({
      hint2: false,
      guidedStep: false
    });
    setSuccess("Historical session details loaded successfully.");
  };

  const handleClearHistory = () => {
    setHistoryLogs([]);
    localStorage.removeItem(`student_hw_history_${currentUser.id}`);
  };

  // Socratic self-check evaluator
  const handleCheckAnswer = (e) => {
    e.preventDefault();
    if (!studentAnswer.trim()) return;

    const ansLower = studentAnswer.toLowerCase();
    
    // Check specific answers
    if (activeAnalysis.concept.includes("Quadratic")) {
      if (ansLower.includes("2") && ansLower.includes("3")) {
        setAnswerFeedback("✓ Excellent! The numbers are -2 and -3 (which factor into (x-2)(x-3) = 0, giving roots x=2 and x=3). You've got it!");
      } else {
        setAnswerFeedback("✗ Not quite. Think about two numbers that add up to -5 and multiply to +6 (i.e. -2 and -3). Try adjusting your variables!");
      }
    } else if (activeAnalysis.concept.includes("JOINs")) {
      if (ansLower.includes("3") || ansLower.includes("three")) {
        setAnswerFeedback("✓ Correct! An INNER JOIN only returns rows where keys match in both tables, so it outputs exactly 3 records. Great job!");
      } else {
        setAnswerFeedback("✗ Hint: A row is returned only if there is a matching row in both tables. How many records match in both? Review your numbers.");
      }
    } else if (activeAnalysis.concept.includes("Calculus")) {
      if (ansLower.includes("6x")) {
        setAnswerFeedback("✓ Brilliant! Applying the Power Rule: d/dx[3x²] = 3 * (2 * x¹) = 6x. Correct!");
      } else {
        setAnswerFeedback("✗ Try again. Multiply the coefficient (3) by the exponent (2) and reduce the exponent by 1. What do you get?");
      }
    } else if (activeAnalysis.concept.includes("Mechanics")) {
      if (ansLower.includes("15")) {
        setAnswerFeedback("✓ Correct! Net Force = Mass * Acceleration (F = ma). So, F = 5 kg * 3 m/s² = 15 Newtons.");
      } else {
        setAnswerFeedback("✗ Remember the formula: F = m * a. Multiply the mass (5) by the acceleration (3). What is the value?");
      }
    } else if (activeAnalysis.concept.includes("Chemical")) {
      if (ansLower.includes("5") || ansLower.includes("acid")) {
        setAnswerFeedback("✓ Spot on! A concentration of 1.0 x 10⁻⁵ M results in a pH of 5 (pH = -log(10⁻⁵) = 5). Since it is < 7, it is acidic!");
      } else {
        setAnswerFeedback("✗ Remember that pH = -log[H⁺]. If the concentration is 10⁻⁵, what is the negative logarithm value?");
      }
    } else {
      // General feedback
      setAnswerFeedback("✓ Fantastic attempt! Socratic review complete. Double-check your logic steps to finalize your homework submission!");
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 uppercase tracking-widest">
              AI Homework Tutor
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 uppercase tracking-widest">
              Socratic Hints Mode
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Homework Assistant</h2>
          <p className="text-zinc-400 text-xs">
            Submit your queries for study advice. The AI is designed to guide you step-by-step with conceptual hints instead of raw answers.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-fade-in flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Console & Socratic Answers) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Question input Console Card */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white">📝 Query Console</h3>
              <p className="text-xs text-zinc-400">Describe your homework problem or topic below.</p>
            </div>

            {/* Quick templates */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-0.5">Quick Templates:</span>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/20 text-zinc-300 font-semibold text-[10px] uppercase tracking-wide transition-all"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAskQuestion} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-0.5">Academic Channel</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="glass-input px-3.5 py-3 text-xs font-semibold"
                  >
                    <option value="Mathematics">📐 Mathematics Channel</option>
                    <option value="Computer Science">💻 Computer Science Channel</option>
                    <option value="Physics">⚛️ Physics Channel</option>
                    <option value="Chemistry">🧪 Chemistry Channel</option>
                    <option value="English Literature">📚 English Literature & General</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-0.5">Session Persona</label>
                  <div className="glass-input px-3.5 py-3 text-xs font-semibold text-zinc-400 bg-white/[0.01] flex items-center justify-between select-none">
                    <span>Active Student User</span>
                    <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{currentUser.name}</span>
                  </div>
                </div>
              </div>

              {/* Question Text Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-0.5">Homework Question Details</label>
                <textarea
                  rows="4"
                  placeholder="Paste your question details or formulas here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="glass-input px-4 py-3.5 text-xs font-semibold w-full leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glow-btn py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Formulating Socratic Dialogue...</span>
                  </>
                ) : (
                  <span>Ask Homework Assistant</span>
                )}
              </button>

            </form>
          </div>

          {/* ACTIVE AI RESPONSE (Socratic progressive board) */}
          {activeAnalysis && (
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-indigo-500/10 bg-indigo-500/[0.01] animate-fade-in">
              
              {/* Analysis Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{activeAnalysis.subject}</span>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    🎓 Concept: {activeAnalysis.concept}
                  </h3>
                </div>
                <span className="text-[9px] font-bold text-zinc-500 font-mono">Analyzed today</span>
              </div>

              {/* Explainer Block */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-0.5">AI Conceptual Review</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                  {activeAnalysis.explanation}
                </p>
              </div>

              {/* Progressive Clues Container */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-0.5">Socratic Hints (Unlock Progressively)</span>

                {/* Hint 1 (Always Visible) */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-1.5">
                  <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest">Hint 1: Core Approach</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{activeAnalysis.hints[0]}</p>
                </div>

                {/* Hint 2 (Lockable) */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2 relative overflow-hidden transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold text-violet-400 uppercase tracking-widest">Hint 2: Setup Method</span>
                    {!unlockedHints.hint2 && (
                      <span className="text-[8px] font-black bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Locked</span>
                    )}
                  </div>

                  {unlockedHints.hint2 ? (
                    <p className="text-xs text-zinc-300 leading-relaxed animate-fade-in">{activeAnalysis.hints[1]}</p>
                  ) : (
                    <div className="flex flex-col gap-3 py-2 items-center text-center justify-center relative">
                      <p className="text-[11px] text-zinc-500 font-mono blur-[3.5px] select-none pointer-events-none w-full">
                        This formula setup demonstrates how to factor or isolate values step by step to solve the question.
                      </p>
                      <button
                        type="button"
                        onClick={() => setUnlockedHints(prev => ({ ...prev, hint2: true }))}
                        className="px-4 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 text-violet-300 text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                      >
                        Unlock Hint 2
                      </button>
                    </div>
                  )}
                </div>

                {/* Hint 3 / Guided Step (Lockable) */}
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2 relative overflow-hidden transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest">Guided Next Steps</span>
                    {!unlockedHints.guidedStep && (
                      <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Locked</span>
                    )}
                  </div>

                  {unlockedHints.guidedStep ? (
                    <div className="flex flex-col gap-3 animate-fade-in">
                      <p className="text-xs text-zinc-300 leading-relaxed">{activeAnalysis.guidedStep}</p>
                      {activeAnalysis.hints[2] && (
                        <p className="text-xs text-zinc-400 leading-relaxed italic border-t border-white/5 pt-2 mt-1">
                          💡 Additional tip: {activeAnalysis.hints[2]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 py-2 items-center text-center justify-center relative">
                      <p className="text-[11px] text-zinc-500 font-mono blur-[4px] select-none pointer-events-none w-full">
                        Isolate terms, check calculations, compare dimensions of velocity parameters, balance chemical counts step-by-step.
                      </p>
                      <button
                        type="button"
                        onClick={() => setUnlockedHints(prev => ({ ...prev, guidedStep: true }))}
                        className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                      >
                        Unlock Guided Step
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Socratic Self Check Question */}
              <div className="p-5 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.02] flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Socratic Self-Check challenge</span>
                  <p className="text-xs font-bold text-white">{activeAnalysis.selfCheck}</p>
                </div>

                <form onSubmit={handleCheckAnswer} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    className="glass-input px-3 py-2.5 text-xs font-semibold flex-grow"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs uppercase tracking-wide transition-all"
                  >
                    Check
                  </button>
                </form>

                {answerFeedback && (
                  <div className={`p-3 rounded-lg border text-xs font-semibold animate-fade-in ${
                    answerFeedback.startsWith("✓") 
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" 
                      : "border-rose-500/20 bg-rose-500/5 text-rose-300"
                  }`}>
                    {answerFeedback}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Right Column (Notepad Scratchpad & Sessions Logs History) */}
        <div className="flex flex-col gap-6">
          
          {/* Student Scratchpad Sandbox */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/5 h-[340px]">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">✏️ Scratch Workspace</h3>
                <p className="text-[10px] text-zinc-400">Sketch out calculations or code blocks here.</p>
              </div>
              <span className="text-[9px] font-black px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 uppercase tracking-widest animate-pulse">Autosaved</span>
            </div>

            <textarea
              className="glass-input p-3 text-xs font-mono w-full flex-grow resize-none leading-relaxed bg-[#09090b]/40 border-dashed border-white/10 text-zinc-300 focus:border-indigo-500/40"
              placeholder="e.g. Let's isolate x:
x^2 - 5x + 6 = 0
(x - 2)(x - 3) = 0
So x = 2 or x = 3..."
              value={scratchNotes}
              onChange={handleScratchChange}
            />
          </div>

          {/* Session history logs */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/5 flex-grow min-h-[250px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Session Log History</h3>
              {historyLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[9px] font-extrabold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors"
                >
                  Clear Logs
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {historyLogs.length === 0 ? (
                <div className="text-center py-10 select-none">
                  <span className="text-[10px] font-extrabold text-zinc-600 uppercase tracking-widest">No queries logged this session</span>
                </div>
              ) : (
                historyLogs.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLoadHistoryItem(item)}
                    className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-indigo-500/20 cursor-pointer flex flex-col gap-1 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{item.subject}</span>
                      <span className="text-[8px] text-zinc-500 font-mono font-bold">Concept review</span>
                    </div>
                    <span className="text-[11px] text-zinc-300 group-hover:text-white font-semibold truncate leading-tight">
                      {item.question}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
