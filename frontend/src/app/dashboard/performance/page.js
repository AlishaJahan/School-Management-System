"use client";

import { useEffect, useState } from "react";

export default function PerformanceDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Teachers list (used by student feedback and admin inspector)
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  // Performance data (for teachers & admins)
  const [performanceData, setPerformanceData] = useState(null);

  // Student feedback form states
  const [feedbackTeacherId, setFeedbackTeacherId] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Teacher assignment creator form states
  const [assTitle, setAssTitle] = useState("");
  const [assClassGrade, setAssClassGrade] = useState("");
  const [assDueDate, setAssDueDate] = useState("");
  const [assLoading, setAssLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        initializeData(parsedUser);
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const initializeData = async (user) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      // 1. If student or admin, load the list of active teachers
      if (user.role === "student" || user.role === "admin") {
        const res = await fetch("http://localhost:5000/api/performance/teachers", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const teacherList = await res.json();
          setTeachers(teacherList);
          
          // If admin, select the first teacher by default to load metrics
          if (user.role === "admin" && teacherList.length > 0) {
            setSelectedTeacherId(teacherList[0].teacher_id);
            await fetchPerformanceMetrics(teacherList[0].teacher_id, token);
          }
        } else {
          setError("Failed to fetch teacher register database.");
        }
      }

      // 2. If teacher, load their own performance metrics
      if (user.role === "teacher") {
        await fetchPerformanceMetrics("me", token);
      }

    } catch (err) {
      console.error(err);
      setError("Network connection issue with EduPrime servers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceMetrics = async (teacherId, overrideToken) => {
    setMetricsLoading(true);
    setError("");
    const token = overrideToken || localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/performance/metrics/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPerformanceData(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to compile teacher performance metrics.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching metrics.");
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleTeacherChange = (e) => {
    const val = e.target.value;
    setSelectedTeacherId(val);
    if (val) {
      fetchPerformanceMetrics(val);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!feedbackTeacherId) {
      setError("Please select a teacher from the active register.");
      return;
    }
    if (feedbackRating === 0) {
      setError("Please select a star rating (1 to 5 stars).");
      return;
    }

    setFeedbackLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/performance/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teacherId: parseInt(feedbackTeacherId),
          rating: feedbackRating,
          comment: feedbackComment
        })
      });

      if (res.ok) {
        setSuccess("Success! Your rating and feedback have been anonymously submitted.");
        setFeedbackTeacherId("");
        setFeedbackRating(0);
        setFeedbackComment("");
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to submit rating.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed while transmitting feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!assTitle || !assClassGrade || !assDueDate) {
      setError("Please fill in all assignment creation parameters.");
      return;
    }

    setAssLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/performance/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: assTitle,
          class_grade: assClassGrade,
          due_date: assDueDate
        })
      });

      if (res.ok) {
        setSuccess("Success! The assignment has been added. Submissions are now tracked.");
        setAssTitle("");
        setAssClassGrade("");
        setAssDueDate("");
        // Reload performance metrics to include new assignment
        fetchPerformanceMetrics("me");
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to create assignment.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed while creating assignment.");
    } finally {
      setAssLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-zinc-400 font-semibold text-sm">Compiling institutional performance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-zinc-900/50 to-zinc-950/30 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Analytics Dashboard</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">
            {currentUser?.role === "student" ? "Teacher Performance Feedback" : "Academic Performance Analytics"}
          </h2>
          <p className="text-sm text-zinc-400">
            {currentUser?.role === "student"
              ? "Submit anonymous feedback ratings and help improve teaching standards."
              : "Review subjects average marks, assignment completion bars, and feedback averages."}
          </p>
        </div>

        {/* Admin Switcher Panel */}
        {currentUser?.role === "admin" && (
          <div className="flex flex-col gap-1.5 min-w-[240px] z-10">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Select Active Faculty</label>
            <select
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              className="glass-input px-4 py-2.5 text-sm font-semibold text-white bg-zinc-900/90 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
            >
              {teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id} className="bg-zinc-950 text-white">
                  {t.name} ({t.subject})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

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

      {/* STUDENT VIEW - FEEDBACK FORM */}
      {currentUser?.role === "student" && (
        <div className="grid grid-cols-1 max-w-2xl mx-auto w-full">
          <div className="glass-card p-8 rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md relative overflow-hidden flex flex-col gap-6">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold text-white">Anonymous Faculty Evaluation</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Your rating and comment will remain entirely anonymous. Help teachers tailor their academic pacing.
              </p>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-5">
              {/* Select Teacher */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Choose Teacher</label>
                <select
                  value={feedbackTeacherId}
                  onChange={(e) => setFeedbackTeacherId(e.target.value)}
                  className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                  required
                >
                  <option value="" className="bg-zinc-950 text-zinc-500">Select a Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.teacher_id} value={t.teacher_id} className="bg-zinc-950 text-white">
                      {t.name} — {t.subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Rating Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Faculty Rating</label>
                <div className="flex items-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isLit = star <= (feedbackHoverRating || feedbackRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        onMouseEnter={() => setFeedbackHoverRating(star)}
                        onMouseLeave={() => setFeedbackHoverRating(0)}
                        className="p-1 transition-transform active:scale-[0.8] duration-100 hover:scale-[1.15]"
                      >
                        <svg
                          className={`w-10 h-10 ${
                            isLit ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "text-zinc-700"
                          } transition-colors duration-150`}
                          fill={isLit ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499c.196-.612 1.056-.612 1.253 0l2.196 6.857a.75.75 0 00.712.513h7.207c.643 0 .908.825.388 1.218l-5.83 4.45a.75.75 0 00-.27 826l2.196 6.857c.196.612-.552 1.154-1.072.748L12 18.232l-5.83 4.45a.75.75 0 01-1.072-.748l2.196-6.857a.75.75 0 00-.27-.826L1.24 12.086c-.52-.393-.255-1.218.388-1.218h7.207a.75.75 0 00.712-.513L11.48 3.5z"
                          />
                        </svg>
                      </button>
                    );
                  })}
                  {feedbackRating > 0 && (
                    <span className="text-xs font-black text-amber-400 pl-2">
                      ({feedbackRating} Star{feedbackRating > 1 ? "s" : ""})
                    </span>
                  )}
                </div>
              </div>

              {/* Qualitative comments */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Review Comments</label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us what you like about this teacher's pace, notes, and explanation style. Be honest and constructive."
                  className="glass-input px-4 py-3.5 text-sm font-semibold w-full text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none min-h-[120px] resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={feedbackLoading}
                className="glow-btn py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                {feedbackLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                    <span>Submitting Evaluation...</span>
                  </>
                ) : (
                  <span>Submit Anonymous Feedback</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER & ADMIN VIEW - ANALYTICS PANELS */}
      {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
        <div className="flex flex-col gap-8 w-full animate-fade-in">
          {metricsLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
            </div>
          ) : performanceData ? (
            <>
              {/* METRIC TOP CARDS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Subject & General info */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/10 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Faculty Specialization</span>
                    <h3 className="text-xl font-bold text-zinc-100">{performanceData.teacherInfo.subject}</h3>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-white/5 pt-3 mt-4">
                    <span>Joined: {new Date(performanceData.teacherInfo.joining_date).toLocaleDateString()}</span>
                    <span className="font-bold text-emerald-400 capitalize bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                      {performanceData.teacherInfo.status}
                    </span>
                  </div>
                </div>

                {/* 2. Feedback average rating */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/10 flex items-center justify-between min-h-[140px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Student Rating Average</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-white font-mono">{performanceData.feedback.averageRating}</span>
                      <span className="text-sm font-semibold text-zinc-500">/ 5.0</span>
                    </div>
                    <span className="text-xs text-zinc-500">Based on {performanceData.feedback.totalCount} evaluations</span>
                  </div>
                  
                  {/* Large star glyph */}
                  <div className="text-amber-500/10 text-7xl font-light pr-2 select-none">★</div>
                </div>

                {/* 3. Class count & Assignments published */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/10 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Assignments Tracked</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-white font-mono">{performanceData.assignments.length}</span>
                      <span className="text-xs text-zinc-500">published items</span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 border-t border-white/5 pt-3 mt-4">
                    Active classes: {Array.from(new Set(performanceData.classPerformance.map(c => c.class_grade))).join(", ") || "None"}
                  </div>
                </div>
              </div>

              {/* CLASS STATISTICS & RATING BREAKDOWN GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* A. Class Performance Statistics */}
                <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Class Grades Performance</h3>
                    <p className="text-xs text-zinc-500 mt-1">Average grades, pass rates, and exam score variations in taught classes.</p>
                  </div>

                  {performanceData.classPerformance.length === 0 ? (
                    <div className="flex items-center justify-center p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-zinc-500 text-xs">
                      No exam marks recorded for this teacher's subject yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {performanceData.classPerformance.map((stat, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div>
                              <span className="text-xs font-bold text-indigo-400">{stat.subject}</span>
                              <h4 className="text-sm font-black text-zinc-100">{stat.class_grade}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-zinc-400">Class Average</span>
                              <div className="text-lg font-bold text-white font-mono">{stat.avg_marks}%</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-zinc-500 uppercase tracking-wider">
                            <div className="p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                              <span className="block text-zinc-500">Highest Score</span>
                              <strong className="block text-white text-sm font-mono mt-0.5">{stat.max_marks}</strong>
                            </div>
                            <div className="p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                              <span className="block text-zinc-500">Lowest Score</span>
                              <strong className="block text-zinc-300 text-sm font-mono mt-0.5">{stat.min_marks}</strong>
                            </div>
                            <div className="p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                              <span className="block text-zinc-500">Pass Rate</span>
                              <strong className="block text-emerald-400 text-sm font-mono mt-0.5">{stat.pass_rate}%</strong>
                            </div>
                          </div>

                          {/* Progress bar visual for Class Average */}
                          <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 rounded-full"
                              style={{ width: `${stat.avg_marks}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* B. Student Feedback Star Breakdown */}
                <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Feedback Star Rating Breakdown</h3>
                    <p className="text-xs text-zinc-500 mt-1">Review the qualitative score weightings submitted by students.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = performanceData.feedback.distribution[star] || 0;
                      const total = performanceData.feedback.totalCount;
                      const percentage = total > 0 ? (count / total) * 100 : 0;

                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-zinc-400 w-3 font-mono">{star}★</span>
                          
                          {/* Progress bar track */}
                          <div className="flex-1 bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-300 h-2.5 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <span className="text-xs font-bold text-zinc-500 w-10 text-right font-mono">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 text-zinc-400 text-xs flex items-start gap-2.5 mt-2">
                    <span className="text-lg leading-none mt-0.5">ℹ️</span>
                    <p className="leading-relaxed">
                      Student evaluations help refine pedagogical design, lecture speed, and lesson material structure. Ratings are compiled automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* ASSIGNMENTS TRACKER WITH SVG PROGRESS BARS */}
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Assignment Completion Rates</h3>
                    <p className="text-xs text-zinc-500 mt-1">Visual compliance progress logs representing on-time, late, or missing student submissions.</p>
                  </div>

                  {/* Create Assignment Button (Teachers only) */}
                  {currentUser.role === "teacher" && (
                    <a href="#create-assignment" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 px-3.5 py-2 rounded-xl transition-all">
                      + Post New Assignment
                    </a>
                  )}
                </div>

                {performanceData.assignments.length === 0 ? (
                  <div className="flex items-center justify-center p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-zinc-500 text-xs">
                    No assignments published.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {performanceData.assignments.map((ass) => {
                      const totalExpected = ass.expected_students;
                      const pctSubmitted = totalExpected > 0 ? (ass.submitted_count / totalExpected) * 100 : 0;
                      const pctLate = totalExpected > 0 ? (ass.late_count / totalExpected) * 100 : 0;
                      const pctMissing = totalExpected > 0 ? (ass.missing_count / totalExpected) * 100 : 0;

                      return (
                        <div key={ass.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                {ass.class_grade}
                              </span>
                              <h4 className="text-base font-bold text-white mt-2 leading-snug">{ass.title}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Completion</span>
                              <div className="text-lg font-black text-emerald-400 font-mono">{ass.completion_rate}%</div>
                            </div>
                          </div>

                          <div className="text-xs text-zinc-500 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Due: {new Date(ass.due_date).toLocaleDateString()}</span>
                            <span>Expected: {totalExpected} Students</span>
                          </div>

                          {/* Complex stacked progress bar */}
                          <div className="flex w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/5 mt-1">
                            {ass.submitted_count > 0 && (
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3"
                                style={{ width: `${pctSubmitted}%` }}
                                title={`Submitted: ${ass.submitted_count}`}
                              />
                            )}
                            {ass.late_count > 0 && (
                              <div
                                className="bg-gradient-to-r from-amber-500 to-amber-400 h-3"
                                style={{ width: `${pctLate}%` }}
                                title={`Late: ${ass.late_count}`}
                              />
                            )}
                            {ass.missing_count > 0 && (
                              <div
                                className="bg-gradient-to-r from-rose-500 to-rose-400 h-3"
                                style={{ width: `${pctMissing}%` }}
                                title={`Missing: ${ass.missing_count}`}
                              />
                            )}
                          </div>

                          {/* Legend breakdown */}
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-zinc-500 mt-1 uppercase font-semibold">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>On-Time ({ass.submitted_count})</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>Late ({ass.late_count})</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-400" />
                              <span>Missing ({ass.missing_count})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* COMMENTS TIMELINE */}
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">Student Feedback Message Feed</h3>
                  <p className="text-xs text-zinc-500 mt-1">Scrollable timeline of qualitative teacher comments and ratings submitted anonymously.</p>
                </div>

                {performanceData.feedback.comments.length === 0 ? (
                  <div className="flex items-center justify-center p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-zinc-500 text-xs">
                    No written feedback reviews matching criteria found.
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin">
                    {performanceData.feedback.comments.map((cmt, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-amber-400">
                            {cmt.rating} ★
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500 font-mono">
                            {new Date(cmt.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 italic leading-relaxed">
                          "{cmt.comment || "No commentary added."}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* POST NEW ASSIGNMENT MODULE (Teachers only) */}
              {currentUser.role === "teacher" && (
                <div id="create-assignment" className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6 scroll-mt-6">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Publish New Class Assignment</h3>
                    <p className="text-xs text-zinc-500 mt-1">Publish a new assignment for your classes. Compliance metrics will automatically track submissions.</p>
                  </div>

                  <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Assignment Title</label>
                      <input
                        type="text"
                        value={assTitle}
                        onChange={(e) => setAssTitle(e.target.value)}
                        placeholder="e.g. Midterm SQL Joins Sheet"
                        className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Class Grade Room</label>
                      <select
                        value={assClassGrade}
                        onChange={(e) => setAssClassGrade(e.target.value)}
                        className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                        required
                      >
                        <option value="" className="bg-zinc-950 text-zinc-500">Select Class</option>
                        <option value="Class 10-A" className="bg-zinc-950 text-white">Class 10-A</option>
                        <option value="Class 12-B" className="bg-zinc-950 text-white">Class 12-B</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Submission Due Date</label>
                      <input
                        type="date"
                        value={assDueDate}
                        onChange={(e) => setAssDueDate(e.target.value)}
                        className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="md:col-span-3 flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={assLoading}
                        className="glow-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                      >
                        {assLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                            <span>Publishing Item...</span>
                          </>
                        ) : (
                          <span>Publish Assignment & Track</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-3xl text-zinc-400 text-center">
              No performance records available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
