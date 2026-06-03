"use client";

import { useEffect, useState, useRef } from "react";

export default function ExamsPortal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Exams catalog
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);

  // Student analytics dashboard
  const [studentStats, setStudentStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Active exam/quiz taking states (Student)
  const [activeQuiz, setActiveQuiz] = useState(null); // exam + questions
  const [quizAnswers, setQuizAnswers] = useState({}); // { [questionId]: 'A'/'B'/'C'/'D' }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [quizResults, setQuizResults] = useState(null); // graded report card
  const timerRef = useRef(null);

  // Teacher MCQ Creator state
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examClass, setExamClass] = useState("");
  const [examDuration, setExamDuration] = useState("");
  const [examQuestions, setExamQuestions] = useState([
    { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A" }
  ]);
  const [createLoading, setCreateLoading] = useState(false);

  // Teacher Analytics state
  const [selectedExamId, setSelectedEventId] = useState("");
  const [examAnalytics, setExamAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        fetchCatalog(parsedUser);
        if (parsedUser.role === "student") {
          fetchStudentStats();
        }
      } catch (e) {
        console.error("Error loading user context:", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    
    // Clear timer on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchCatalog = async (userContext) => {
    setExamsLoading(true);
    setError("");
    const user = userContext || currentUser;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/exams", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      } else {
        setError("Failed to fetch MCQ exams catalog.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching catalog.");
    } finally {
      setExamsLoading(false);
      setLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    setStatsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/exams/student/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Student: initiates quiz taking
  const startQuiz = async (examId) => {
    setError("");
    setSuccess("");
    setQuizResults(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQuiz(data);
        setQuizAnswers({});
        
        // Setup countdown timer (minutes -> seconds)
        const seconds = data.exam.duration_minutes * 60;
        setTimeLeft(seconds);
        
        // Start Interval Timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              // Trigger auto-submit when timer expires
              triggerAutoSubmit(examId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError("Failed to load quiz details.");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection issue launching quiz.");
    }
  };

  const selectAnswer = (questionId, option) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const submitQuiz = async (e) => {
    if (e) e.preventDefault();
    if (!activeQuiz) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/exams/${activeQuiz.exam.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers: quizAnswers })
      });

      if (res.ok) {
        const data = await res.json();
        setQuizResults(data.results);
        setSuccess("Quiz submitted successfully! Review your grade report card below.");
        fetchCatalog();
        fetchStudentStats();
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to submit answers.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issue submitting answers.");
    }
  };

  const triggerAutoSubmit = async (examId) => {
    // Collect whatever answers were clicked
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers: quizAnswers })
      });
      if (res.ok) {
        const data = await res.json();
        setQuizResults(data.results);
        setError("Time Expired! Your answers were automatically compiled and graded.");
        fetchCatalog();
        fetchStudentStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Teacher: creates exam
  const handleAddQuestionField = () => {
    setExamQuestions(prev => [
      ...prev,
      { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A" }
    ]);
  };

  const handleRemoveQuestionField = (idx) => {
    if (examQuestions.length <= 1) return;
    setExamQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    setExamQuestions(prev => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  const handleCreateMCQExam = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!examTitle || !examSubject || !examClass || !examDuration) {
      setError("All exam header settings are required.");
      return;
    }

    setCreateLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: examTitle,
          subject: examSubject,
          class_grade: examClass,
          duration_minutes: parseInt(examDuration),
          questions: examQuestions
        })
      });

      if (res.ok) {
        setSuccess(`Online exam "${examTitle}" successfully created and catalogued!`);
        setExamTitle("");
        setExamSubject("");
        setExamClass("");
        setExamDuration("");
        setExamQuestions([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A" }]);
        fetchCatalog();
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to publish online exam.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issue creating exam.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Teacher: retrieves exam analytics
  const fetchExamAnalytics = async (examId) => {
    if (!examId) {
      setExamAnalytics(null);
      return;
    }
    setAnalyticsLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/exams/${examId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExamAnalytics(data);
      } else {
        setError("Failed to compile quiz analytics database.");
      }
    } catch (err) {
      console.error(err);
      setError("Network issue compiling stats.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-zinc-400 font-semibold text-sm">Synchronizing evaluation console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Banner / Header */}
      {!activeQuiz && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-zinc-900/50 to-zinc-950/30 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">E-Examination Board</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight leading-none">Online Exam & Auto Evaluation</h2>
            <p className="text-sm text-zinc-400">
              {currentUser?.role === "student"
                ? "Complete MCQ-based exams under a timer. Results are evaluated instantly and logged into your marks ledger."
                : "Publish Multiple-Choice Question (MCQ) exams and view real-time class averages and grade distributions."}
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* STUDENT PORTAL VIEWS */}
      {currentUser?.role === "student" && (
        <div className="flex flex-col gap-8 w-full">
          
          {/* Active Quiz Sheet (Timer + Questions overlay) */}
          {activeQuiz && (
            <div className="glass-card p-6 md:p-10 rounded-3xl border border-indigo-500/20 bg-zinc-950/80 backdrop-blur-md relative overflow-hidden flex flex-col gap-8 w-full animate-fade-in">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              {/* Header inside Quiz */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-5">
                <div>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 uppercase tracking-widest">
                    {activeQuiz.exam.subject}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2 leading-none">{activeQuiz.exam.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">Instructor: {activeQuiz.exam.teacher_name}</p>
                </div>

                {/* Live Countdown Timer */}
                <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border min-w-[120px] ${
                  timeLeft < 60 
                    ? "bg-rose-500/10 border-rose-500/25 text-rose-400 animate-pulse" 
                    : "bg-zinc-900 border-white/5 text-zinc-300"
                }`}>
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Time Remaining</span>
                  <span className="text-xl font-bold font-mono mt-0.5">{formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* Questions Checklist */}
              <form onSubmit={submitQuiz} className="flex flex-col gap-8">
                <div className="flex flex-col gap-6">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-zinc-100 leading-normal">{q.question_text}</h4>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                        {["a", "b", "c", "d"].map((opt) => {
                          const optionKey = `option_${opt}`;
                          const optionText = q[optionKey];
                          const uppercaseOpt = opt.toUpperCase();
                          const isSelected = quizAnswers[q.id] === uppercaseOpt;

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => selectAnswer(q.id, uppercaseOpt)}
                              className={`p-3 text-left text-xs font-semibold rounded-xl border transition-all flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] ${
                                isSelected 
                                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-inner" 
                                  : "bg-zinc-900/40 border-white/5 text-zinc-400"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full border text-[9px] font-black flex items-center justify-center ${
                                isSelected 
                                  ? "bg-indigo-400 text-zinc-950 border-indigo-400" 
                                  : "border-zinc-700 text-zinc-500"
                              }`}>
                                {uppercaseOpt}
                              </span>
                              <span>{optionText}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 justify-end border-t border-white/5 pt-5">
                  <button
                    type="submit"
                    className="glow-btn px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    Submit Answers & Finish
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (timerRef.current) clearInterval(timerRef.current);
                      setActiveQuiz(null);
                    }}
                    className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-xs font-semibold"
                  >
                    Discard Quiz
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Graded report feedback sheet */}
          {quizResults && (
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-emerald-500/20 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase">
                    <span>🛡️ Exam Assessment complete</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1 leading-none">Instant Result Card</h3>
                </div>

                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  quizResults.passed 
                    ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" 
                    : "bg-rose-400/10 border-rose-400/20 text-rose-400"
                }`}>
                  {quizResults.passed ? "Passed" : "Failed"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Correct Answers</span>
                  <strong className="block text-2xl font-bold text-white font-mono mt-1">
                    {quizResults.score_obtained} / {quizResults.total_score}
                  </strong>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Score Percentage</span>
                  <strong className="block text-2xl font-bold text-indigo-400 font-mono mt-1">
                    {quizResults.percentage}%
                  </strong>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Pass Criteria</span>
                  <strong className="block text-sm font-bold text-zinc-300 mt-2">
                    50.0% Minimum
                  </strong>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] sm:col-span-1">
                  <button
                    onClick={() => setQuizResults(null)}
                    className="w-full h-full text-xs font-bold text-zinc-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl transition-all"
                  >
                    Close Result Card
                  </button>
                </div>
              </div>

              {/* Correct answers audit details */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Answer Audit Logs</h4>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {activeQuiz?.questions.map((q, idx) => {
                    const studentAns = quizAnswers[q.id];
                    const correctAns = quizResults.correct_answers[q.id];
                    const isRight = studentAns === correctAns;

                    return (
                      <div key={q.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs gap-4">
                        <div className="overflow-hidden">
                          <strong className="text-zinc-300 block truncate">Q{idx + 1}: {q.question_text}</strong>
                          <span className="text-zinc-500 text-[10px] block mt-1 font-semibold">
                            Correct Option: <strong className="text-emerald-400">{correctAns}</strong> | Selected: <strong className={isRight ? "text-emerald-400" : "text-rose-400"}>{studentAns || "None"}</strong>
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex-shrink-0 ${
                          isRight ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-rose-400/10 border-rose-400/20 text-rose-400"
                        }`}>
                          {isRight ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Student Stats and Comparison Graph */}
          {studentStats && !activeQuiz && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Analytics Header Summary */}
              <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Aggregate Standing</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-black text-white font-mono">{studentStats.summary.overall_percentage}%</span>
                    <span className="text-sm font-semibold text-zinc-500">Overall</span>
                  </div>
                  <span className="text-xs text-zinc-500 mt-2 block font-semibold">
                    Based on {studentStats.summary.total_exams_taken} submitted online quizzes
                  </span>
                </div>
                
                {/* Visual average indicator track */}
                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-white/5 mt-6">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full"
                    style={{ width: `${studentStats.summary.overall_percentage}%` }}
                  />
                </div>
              </div>

              {/* Student vs Class Average Comparison Graph */}
              <div className="lg:col-span-3 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white leading-none">Class Average Comparisons</h3>
                  <p className="text-xs text-zinc-500 mt-1">Review your exam score percentages vs overall class averages.</p>
                </div>

                {studentStats.comparisons.length === 0 ? (
                  <div className="flex items-center justify-center p-8 border border-white/5 bg-white/[0.01] rounded-xl text-zinc-500 text-xs">
                    No quiz submissions found to compare.
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {studentStats.comparisons.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-3">
                        <div className="flex justify-between items-start border-b border-white/5 pb-2">
                          <div>
                            <span className="text-[10px] font-black text-indigo-400">{item.subject}</span>
                            <h4 className="text-xs font-bold text-zinc-200 mt-0.5 truncate max-w-[200px]">{item.title}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-zinc-500">Score: {item.score_obtained}/{item.total_score}</span>
                          </div>
                        </div>

                        {/* Bars stack comparisons */}
                        <div className="flex flex-col gap-2">
                          {/* Student Bar */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-zinc-400 w-24 flex-shrink-0">Your Score:</span>
                            <div className="flex-1 bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full"
                                style={{ width: `${item.student_percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-indigo-300 font-mono w-10 text-right">{item.student_percentage}%</span>
                          </div>

                          {/* Class Average Bar */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-zinc-500 w-24 flex-shrink-0">Class Avg:</span>
                            <div className="flex-1 bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="bg-gradient-to-r from-zinc-700 to-zinc-650 h-2 rounded-full"
                                style={{ width: `${item.class_average_percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 font-mono w-10 text-right">{item.class_average_percentage}%</span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Catalog grid */}
          {!activeQuiz && (
            <div className="flex flex-col gap-6 w-full">
              <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/5 flex flex-col gap-4">
                <h3 className="text-xl font-bold text-white leading-none">Exams Catalog</h3>
                <p className="text-xs text-zinc-500 mt-1">Available online exams for your class room grade.</p>
              </div>

              {examsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                </div>
              ) : exams.length === 0 ? (
                <div className="p-8 border border-white/5 bg-white/[0.01] rounded-3xl text-zinc-500 text-center text-xs">
                  No online exams published for your grade room yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exams.map((ex) => (
                    <div key={ex.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                      <div className="flex justify-between items-start border-b border-white/5 pb-3">
                        <div>
                          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-semibold">
                            {ex.subject}
                          </span>
                          <h4 className="text-lg font-bold text-white mt-2 leading-tight">{ex.title}</h4>
                          <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                            Duration: {ex.duration_minutes} Minutes
                          </span>
                        </div>

                        {ex.is_submitted === 1 ? (
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 uppercase tracking-wider">
                            Score: {ex.score_obtained} / {ex.total_score}
                          </span>
                        ) : (
                          <button
                            onClick={() => startQuiz(ex.id)}
                            className="px-4 py-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded-xl transition-all cursor-pointer"
                          >
                            Take Exam
                          </button>
                        )}
                      </div>
                      
                      <p className="text-sm text-zinc-400 leading-relaxed font-semibold">
                        Timer countdown begins immediately upon entering the workspace. Auto-evaluates on exit/expiration.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* TEACHER & ADMIN PORTAL VIEWS */}
      {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* 1. Left Panel: MCQ Creator Form */}
          <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md relative overflow-hidden flex flex-col gap-6 h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold text-white">Exam Creator Board</h3>
              <p className="text-xs text-zinc-500 mt-1">Design Multiple-Choice Question (MCQ) online exams for classrooms.</p>
            </div>

            <form onSubmit={handleCreateMCQExam} className="flex flex-col gap-5">
              {/* Header Details */}
              <div className="flex flex-col gap-4 border-b border-white/5 pb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Exam Title</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g. Science MCQ Final Term"
                    className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Subject</label>
                    <select
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="glass-input px-3 py-3 text-xs font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="" className="bg-zinc-950 text-zinc-500">Select</option>
                      <option value="Computer Science" className="bg-zinc-950 text-white">CS</option>
                      <option value="Mathematics" className="bg-zinc-950 text-white">Math</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 col-span-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Grade Room</label>
                    <select
                      value={examClass}
                      onChange={(e) => setExamClass(e.target.value)}
                      className="glass-input px-3 py-3 text-xs font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="" className="bg-zinc-950 text-zinc-500">Select</option>
                      <option value="Class 10-A" className="bg-zinc-950 text-white">10-A</option>
                      <option value="Class 12-B" className="bg-zinc-950 text-white">12-B</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 col-span-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Minutes</label>
                    <input
                      type="number"
                      value={examDuration}
                      onChange={(e) => setExamDuration(e.target.value)}
                      placeholder="e.g. 15"
                      min="1"
                      className="glass-input px-3 py-3 text-xs font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center pl-1">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Exam Questions ({examQuestions.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestionField}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {examQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-3 relative">
                      {examQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionField(idx)}
                          className="absolute top-3 right-3 text-zinc-500 hover:text-rose-400 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Question {idx + 1}</label>
                        <input
                          type="text"
                          value={q.question_text}
                          onChange={(e) => handleQuestionChange(idx, "question_text", e.target.value)}
                          placeholder="What is the output of...?"
                          className="glass-input px-3 py-2 text-xs text-white bg-zinc-950/60 border border-white/10 rounded-lg focus:border-indigo-500 focus:outline-none"
                          required
                        />
                      </div>

                      {/* Options A and B */}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={q.option_a}
                          onChange={(e) => handleQuestionChange(idx, "option_a", e.target.value)}
                          placeholder="Option A"
                          className="glass-input px-3 py-2 text-xs text-white bg-zinc-950/60 border border-white/10 rounded-lg focus:outline-none"
                          required
                        />
                        <input
                          type="text"
                          value={q.option_b}
                          onChange={(e) => handleQuestionChange(idx, "option_b", e.target.value)}
                          placeholder="Option B"
                          className="glass-input px-3 py-2 text-xs text-white bg-zinc-950/60 border border-white/10 rounded-lg focus:outline-none"
                          required
                        />
                      </div>

                      {/* Options C and D */}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={q.option_c}
                          onChange={(e) => handleQuestionChange(idx, "option_c", e.target.value)}
                          placeholder="Option C"
                          className="glass-input px-3 py-2 text-xs text-white bg-zinc-950/60 border border-white/10 rounded-lg focus:outline-none"
                          required
                        />
                        <input
                          type="text"
                          value={q.option_d}
                          onChange={(e) => handleQuestionChange(idx, "option_d", e.target.value)}
                          placeholder="Option D"
                          className="glass-input px-3 py-2 text-xs text-white bg-zinc-950/60 border border-white/10 rounded-lg focus:outline-none"
                          required
                        />
                      </div>

                      {/* Correct Option */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Correct Option</label>
                        <select
                          value={q.correct_option}
                          onChange={(e) => handleQuestionChange(idx, "correct_option", e.target.value)}
                          className="glass-input px-3 py-2 text-xs text-white bg-zinc-950/60 border border-white/10 rounded-lg focus:outline-none font-bold"
                          required
                        >
                          <option value="A" className="bg-zinc-950 text-white">A</option>
                          <option value="B" className="bg-zinc-950 text-white">B</option>
                          <option value="C" className="bg-zinc-950 text-white">C</option>
                          <option value="D" className="bg-zinc-950 text-white">D</option>
                        </select>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="glow-btn py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                {createLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                    <span>Publishing Exam...</span>
                  </>
                ) : (
                  <span>Publish MCQ Exam</span>
                )}
              </button>
            </form>
          </div>

          {/* 2. Right Panel: Exams catalog & Submission Analytics */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Catalog Selector */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white leading-none">Submissions Registry</h3>
                  <p className="text-xs text-zinc-500 mt-1">Select an exam to view detailed grading analytics and student scores.</p>
                </div>

                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    fetchExamAnalytics(e.target.value);
                  }}
                  className="glass-input px-4 py-2 text-xs font-bold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none min-w-[200px]"
                >
                  <option value="" className="bg-zinc-950 text-zinc-500">Select Exam</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id} className="text-white">
                      {ex.title} ({ex.class_grade})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Analytics Output Panel */}
            {analyticsLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </div>
            ) : examAnalytics ? (
              <div className="flex flex-col gap-6 w-full animate-fade-in">
                
                {/* Stats overview cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Submitted</span>
                    <strong className="block text-xl font-black text-white font-mono mt-1">
                      {examAnalytics.summary.total_submissions}
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Average Pct</span>
                    <strong className="block text-xl font-black text-indigo-400 font-mono mt-1">
                      {examAnalytics.summary.avg_percentage}%
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Pass Rate</span>
                    <strong className="block text-xl font-black text-emerald-400 font-mono mt-1">
                      {examAnalytics.summary.pass_rate}%
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">High / Low</span>
                    <strong className="block text-sm font-bold text-zinc-350 mt-2 font-mono">
                      {examAnalytics.summary.max_score} / {examAnalytics.summary.min_score}
                    </strong>
                  </div>
                </div>

                {/* Submissions list table */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/5 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider pl-1">Graded Student Registry</h4>
                  
                  {examAnalytics.submissions.length === 0 ? (
                    <div className="p-6 text-zinc-500 border border-white/5 bg-white/[0.01] rounded-xl text-center text-xs">
                      No student submissions recorded for this exam yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                      {examAnalytics.submissions.map((sub) => {
                        const scorePct = (sub.score_obtained / sub.total_score) * 100;
                        const passed = scorePct >= 50.0;

                        return (
                          <div key={sub.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-bold text-white leading-none">{sub.student_name}</h4>
                              <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                                Roll: {sub.roll_no} | Class: {sub.class_grade}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                passed ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-rose-400/10 border-rose-400/20 text-rose-400"
                              }`}>
                                {sub.score_obtained} / {sub.total_score} ({Math.round(scorePct)}%)
                              </span>
                              <span className="text-[9px] text-zinc-500 block mt-1 font-mono">
                                {new Date(sub.submitted_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-center text-zinc-500 gap-2 text-xs">
                <span>📊</span>
                <p>Choose a classroom exam from the dropdown selector to investigate auto-evaluation results logs.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
