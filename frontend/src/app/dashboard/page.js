"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardCard from "../../components/DashboardCard";

export default function DashboardOverview() {
  const [currentUser, setCurrentUser] = useState({ name: "Administrator", role: "admin" });
  const [counts, setCounts] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("dashboard_counts");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return { students: 5, teachers: 4 };
  });

  // Interactive To-Do List State
  const [todoInput, setTodoInput] = useState("");
  const [todos, setTodos] = useState([
    { id: 1, text: "Verify teacher attendance registry for today", completed: true },
    { id: 2, text: "Submit Class 12-B Database Systems grade files", completed: false },
    { id: 3, text: "Organize CS Lab 2 network setups for Class 10-A", completed: false },
    { id: 4, text: "Publish Summer Vacation official school notice", completed: false }
  ]);

  // Student Dashboard Specific States
  const [studentData, setStudentData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [goalInput, setGoalInput] = useState("");
  const [goalDate, setGoalDate] = useState("");

  // Parent Dashboard Specific States
  const [parentData, setParentData] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    // 1. Get logged in user details
    const savedUser = localStorage.getItem("user");
    let userObj = {};
    if (savedUser) {
      try {
        userObj = JSON.parse(savedUser);
        setCurrentUser(userObj);
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Proactively try fetching stats from Express backend (Admins and Teachers)
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch Students list to get count
        const sRes = await fetch("http://localhost:5000/api/students", { headers });
        const students = await sRes.json();
        
        // Fetch Teachers list to get count (only allowed for admins, so handle role)
        let teachers = [];
        if (userObj.role === "admin") {
          const tRes = await fetch("http://localhost:5000/api/teachers", { headers });
          teachers = await tRes.json();
        } else {
          // If teacher logged in, fall back to seed count
          teachers = [{}, {}, {}, {}];
        }

        if (Array.isArray(students) && Array.isArray(teachers)) {
          const newCounts = {
            students: students.length,
            teachers: teachers.length
          };
          setCounts(newCounts);
          localStorage.setItem("dashboard_counts", JSON.stringify(newCounts));
        }
      } catch (err) {
        console.log("Database fetch failed. Using fallback seed counts:", err.message);
      }
    };

    const fetchStudentInsights = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/insights/student/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStudentData(data);
          
          // Load goals
          const cachedGoals = localStorage.getItem(`student_goals_${data.student_id}`);
          if (cachedGoals) {
            setGoals(JSON.parse(cachedGoals));
          } else {
            // Default initial goals
            const defaults = [
              { id: 1, text: "Attend CS Lab sessions regularly", completed: true, date: "2026-06-05" },
              { id: 2, text: "Revise Applied Mathematics syllabus", completed: false, date: "2026-06-12" },
              { id: 3, text: "Complete final Physics project blueprint", completed: false, date: "2026-06-08" }
            ];
            setGoals(defaults);
            localStorage.setItem(`student_goals_${data.student_id}`, JSON.stringify(defaults));
          }
        }
      } catch (err) {
        console.error("Error pulling student learning data:", err);
      }
    };

    const fetchParentInsights = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/parent/child-insights", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setParentData(data);
        }
      } catch (err) {
        console.error("Error pulling parent child insights:", err);
      }
    };

    const fetchRecentAlerts = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/alerts", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const criticalAlerts = data.filter(a => a.severity?.toLowerCase() === "critical");
          if (criticalAlerts.length > 0) {
            setActiveAlert(criticalAlerts[0]);
          } else {
            setActiveAlert(null);
          }
        }
      } catch (err) {
        console.error("Error fetching recent alerts for banner:", err);
      }
    };

    if (userObj.role === "student") {
      fetchStudentInsights();
    } else if (userObj.role === "parent") {
      fetchParentInsights();
    } else {
      fetchStats();
    }
    fetchRecentAlerts();
  }, []);

  // Handler for Interactive To-Do Checklist (Admin/Teacher view)
  const handleToggleTodo = (id) => {
    setTodos(prev =>
      prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo)
    );
  };

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!todoInput.trim()) return;

    setTodos(prev => [
      ...prev,
      { id: Date.now(), text: todoInput.trim(), completed: false }
    ]);
    setTodoInput("");
  };

  const handleDeleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  // Handlers for Student Academic Goals Planner
  const handleToggleGoal = (id) => {
    if (!studentData) return;
    const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    setGoals(updated);
    localStorage.setItem(`student_goals_${studentData.student_id}`, JSON.stringify(updated));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!studentData || !goalInput.trim()) return;
    const newGoal = {
      id: Date.now(),
      text: goalInput.trim(),
      completed: false,
      date: goalDate || new Date().toISOString().split("T")[0]
    };
    const updated = [newGoal, ...goals];
    setGoals(updated);
    localStorage.setItem(`student_goals_${studentData.student_id}`, JSON.stringify(updated));
    setGoalInput("");
    setGoalDate("");
  };

  const handleDeleteGoal = (id) => {
    if (!studentData) return;
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    localStorage.setItem(`student_goals_${studentData.student_id}`, JSON.stringify(updated));
  };

  if (currentUser.role?.toLowerCase() === "parent" && parentData) {
    const overallRate = parentData.metrics.attendanceRate;
    const isAtRisk = overallRate < 75.0;
    
    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest pl-0.5">Parent Engagement Portal</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {currentUser.name}
            </h2>
            <p className="text-zinc-400 text-sm">
              Monitoring real-time academic files and compliance vectors for child: <strong className="text-violet-300 font-semibold">{parentData.studentName}</strong> (Roll: {parentData.rollNo}).
            </p>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl border border-violet-500/25 bg-violet-500/5 text-violet-300 font-extrabold text-xs uppercase tracking-wider">
            🏫 Classroom grade: {parentData.classGrade}
          </div>
        </div>

        {/* Critical Emergency Alert Banner */}
        {activeAlert && (
          <div className="p-5 rounded-3xl border border-rose-500/35 bg-rose-500/10 text-rose-300 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-500/15">
            <div className="flex items-center gap-3.5">
              <span className="text-2xl animate-bounce">🚨</span>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-extrabold text-sm uppercase tracking-wide text-white">CRITICAL SYSTEM PROTOCOL: {activeAlert.title}</h4>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  {activeAlert.message}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/alerts"
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider rounded-xl shadow-md whitespace-nowrap transition-all"
            >
              View System Directives
            </Link>
          </div>
        )}

        {/* Low Attendance Notification Banner */}
        {isAtRisk && (
          <div className="p-5 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-rose-400 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-500/10">
            <div className="flex items-center gap-3.5">
              <span className="text-2xl">⚠️</span>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-extrabold text-sm uppercase tracking-wide text-white">Low Attendance Notice Triggered</h4>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  Your child's attendance rate of <strong className="text-rose-400">{overallRate}%</strong> is below the mandatory <strong className="font-bold">75%</strong> threshold required to qualify for terminal exams.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/messages"
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider rounded-xl shadow-md whitespace-nowrap transition-all"
            >
              Contact Teacher
            </Link>
          </div>
        )}

        {/* Quick metrics cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Child Term Grade Avg"
            value={`${parentData.metrics.avgMarks}%`}
            change={parentData.metrics.avgMarks >= 75 ? "Excellent" : "Support Advised"}
            color="cyan"
            icon={
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
              </svg>
            }
          />
          <DashboardCard
            title="Attendance Compliance"
            value={`${overallRate}%`}
            change={overallRate >= 75 ? "Compliant" : "At Risk"}
            color={overallRate >= 75 ? "emerald" : "rose"}
            icon={
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
              </svg>
            }
          />
          <DashboardCard
            title="Days Attended"
            value={`${parentData.metrics.presentDays} / ${parentData.metrics.totalDays}`}
            change="Session Logs"
            color="violet"
            icon={
              <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <DashboardCard
            title="Enrolled Subjects"
            value={`${parentData.metrics.subjectsCount}`}
            change="Active Curriculum"
            color="indigo"
            icon={
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
              </svg>
            }
          />
        </div>

        {/* Layout breakdown panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Subject Averages progress bars */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/5">
              <div>
                <h4 className="text-lg font-bold text-white">📚 Child Subject-wise Academic Progress</h4>
                <p className="text-xs text-zinc-400">Review aggregates and calculated values per subject.</p>
              </div>

              <div className="flex flex-col gap-4.5 mt-2">
                {Object.keys(parentData.subjectAverages).length === 0 ? (
                  <span className="text-zinc-600 text-xs py-4 text-center font-bold">No academic logs found for your child.</span>
                ) : (
                  Object.keys(parentData.subjectAverages).map(sub => {
                    const score = parentData.subjectAverages[sub].average;
                    let barColor = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]";
                    if (score < 50) barColor = "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                    else if (score < 65) barColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";

                    return (
                      <div key={sub} className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300 font-bold">{sub}</span>
                          <span className={`font-mono font-bold ${score < 50 ? "text-rose-400" : score < 65 ? "text-amber-400" : "text-cyan-400"}`}>{score}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-0.5 border border-white/5">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Quick shortcuts & teacher contact actions */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
              <div>
                <h4 className="text-lg font-bold text-white">✉️ Portal Messaging Channels</h4>
                <p className="text-xs text-zinc-400">Directly contact your child's subject teachers.</p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/dashboard/messages"
                  className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all text-center leading-normal"
                >
                  💬 Open Parent-Teacher Mailbox
                </Link>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-zinc-400 text-xs leading-relaxed">
                  💡 **Tip:** Regular communication is advised for at-risk triggers. Open the Mailbox to schedule meetings or request revisions guidelines.
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  }

  if (currentUser.role?.toLowerCase() === "student" && studentData) {
    const isAtRisk = studentData.riskAssessment.riskLevel === "High";
    const completedGoals = goals.filter(g => g.completed).length;

    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {currentUser.name}
            </h2>
            <p className="text-zinc-400 text-sm">
              Here is your personalized student learning overview and academic command center.
            </p>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl border border-indigo-500/25 bg-indigo-500/5 text-indigo-300 font-extrabold text-xs uppercase tracking-wider">
            🏫 Class Room: {studentData.classGrade}
          </div>
        </div>

        {/* Critical Emergency Alert Banner */}
        {activeAlert && (
          <div className="p-5 rounded-3xl border border-rose-500/35 bg-rose-500/10 text-rose-300 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-500/15">
            <div className="flex items-center gap-3.5">
              <span className="text-2xl animate-bounce">🚨</span>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-extrabold text-sm uppercase tracking-wide text-white">CRITICAL SYSTEM PROTOCOL: {activeAlert.title}</h4>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  {activeAlert.message}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/alerts"
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider rounded-xl shadow-md whitespace-nowrap transition-all"
            >
              View System Directives
            </Link>
          </div>
        )}

        {/* Top learning stats metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Academic Term Average"
            value={`${studentData.metrics.avgMarks}%`}
            change={studentData.metrics.avgMarks >= 75 ? "Excellent" : "Needs Review"}
            color="cyan"
            icon={
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
              </svg>
            }
          />
          <DashboardCard
            title="Attendance Compliance"
            value={`${studentData.metrics.attendanceRate}%`}
            change={studentData.metrics.attendanceRate >= 75 ? "Compliant" : "At Risk"}
            color={studentData.metrics.attendanceRate >= 75 ? "emerald" : "rose"}
            icon={
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
              </svg>
            }
          />
          <DashboardCard
            title="Goals Completed"
            value={`${completedGoals} / ${goals.length}`}
            change="Planner Tasks"
            color="violet"
            icon={
              <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <DashboardCard
            title="Study Cohort Focus"
            value="12 Hours"
            change="This Week"
            color="indigo"
            icon={
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
              </svg>
            }
          />
        </div>

        {/* Dashboard layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Subject wise progress tracking */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/5">
              <div>
                <h4 className="text-lg font-bold text-white">📚 Subject-wise Progress Tracking</h4>
                <p className="text-xs text-zinc-400">Review aggregates and target percentages per enrolled class.</p>
              </div>

              <div className="flex flex-col gap-4.5 mt-2">
                {Object.keys(studentData.subjectAverages).length === 0 ? (
                  <span className="text-zinc-600 text-xs py-4 text-center font-bold">No grades records found in database.</span>
                ) : (
                  Object.keys(studentData.subjectAverages).map(sub => {
                    const score = studentData.subjectAverages[sub].average;
                    let barColor = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]";
                    if (score < 50) barColor = "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                    else if (score < 65) barColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";

                    return (
                      <div key={sub} className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300 font-bold">{sub}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 font-normal">Score:</span>
                            <span className={`font-mono font-bold text-sm ${score < 50 ? "text-rose-400" : score < 65 ? "text-amber-400" : "text-cyan-400"}`}>{score}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-0.5 border border-white/5">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Goal Setting & Achievement tracking planner */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  🎯 My Academic Goals Planner
                </h4>
                <p className="text-xs text-zinc-400">Set customized learning goals, specify target timelines, and check achievements.</p>
              </div>

              {/* Form to add Goal */}
              <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. Score > 85% in Computer Science Exam..."
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="glass-input px-4 py-3 text-xs font-semibold flex-1 text-white"
                  required
                />
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="glass-input px-4 py-3 text-xs font-semibold w-full sm:w-44 text-zinc-300"
                />
                <button
                  type="submit"
                  className="glow-btn px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex-shrink-0"
                >
                  Add Goal
                </button>
              </form>

              {/* Goals list */}
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {goals.length === 0 ? (
                  <span className="text-zinc-600 text-center text-xs py-10 font-bold uppercase tracking-widest select-none">
                    No active academic goals set
                  </span>
                ) : (
                  goals.map(g => (
                    <div
                      key={g.id}
                      className={`p-3.5 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-3 group transition-all ${
                        g.completed ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleToggleGoal(g.id)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            g.completed
                              ? "bg-indigo-500 border-indigo-400 text-white"
                              : "border-white/10 hover:border-indigo-500/50"
                          }`}
                        >
                          {g.completed && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className="flex flex-col overflow-hidden">
                          <span
                            onClick={() => handleToggleGoal(g.id)}
                            className={`text-xs font-semibold text-zinc-300 truncate cursor-pointer hover:text-white transition-colors ${
                              g.completed ? "line-through text-zinc-500" : ""
                            }`}
                          >
                            {g.text}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                            Target Date: {g.date}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(g.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Goal"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Column 3: Weekly Performance Summary Report */}
          <div className="flex flex-col gap-6">
            
            {/* Weekly performance report visualizer */}
            <div className="glass-card p-6 rounded-2xl border-white/5 flex flex-col gap-5">
              <div>
                <h4 className="text-lg font-bold text-white">📅 Weekly Performance Report</h4>
                <p className="text-xs text-zinc-400">Chronological analysis generated by the AI learning analyzer.</p>
              </div>

              {/* Weekly visual indicators */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                
                {/* Weekly chart */}
                <div className="flex items-end justify-between h-20 px-2 mt-2 relative border-b border-white/5">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="w-4 bg-indigo-500/20 hover:bg-indigo-500/30 transition-all rounded-t-sm w-8" style={{ height: '50px' }} />
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">W1</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 flex-1 border-x border-white/[0.02]">
                    <div className="w-4 bg-indigo-500/30 hover:bg-indigo-500/40 transition-all rounded-t-sm w-8" style={{ height: '65px' }} />
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">W2</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="w-4 bg-gradient-to-t from-indigo-500 to-cyan-500 rounded-t-sm w-8 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.2)]" style={{ height: '78px' }} />
                    <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest">W3</span>
                  </div>
                </div>

                {/* AI text report */}
                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">AI Cognitive Weekly Brief</span>
                  {isAtRisk ? (
                    <p className="text-xs text-rose-300 bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl leading-relaxed">
                      ⚠️ <strong>Warning:</strong> High risk support flag active in profile. Weekly exam averages (45%) are lagging despite your consistent 90% attendance. Strongly advised to register for remedial peer sessions.
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl leading-relaxed">
                      ✓ <strong>Compliant:</strong> Excellent academic trajectory logged this week. Overall aggregates remain secure ({studentData.metrics.avgMarks}%). Continue tracking tasks to maintain this trajectory.
                    </p>
                  )}
                </div>

              </div>

              <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-indigo-300 text-xs font-semibold leading-relaxed">
                💡 **Academic Recommendation:** Target your weakest subject first this week to clear low average values.
              </div>

            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome back, {currentUser.name}
        </h2>
        <p className="text-zinc-400 text-sm">
          Here is a premium breakdown of your academic system status today.
        </p>
      </div>

      {/* Critical Emergency Alert Banner */}
      {activeAlert && (
        <div className="p-5 rounded-3xl border border-rose-500/35 bg-rose-500/10 text-rose-300 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-500/15">
          <div className="flex items-center gap-3.5">
            <span className="text-2xl animate-bounce">🚨</span>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-extrabold text-sm uppercase tracking-wide text-white">CRITICAL SYSTEM PROTOCOL: {activeAlert.title}</h4>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                {activeAlert.message}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/alerts"
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider rounded-xl shadow-md whitespace-nowrap transition-all"
          >
            View System Directives
          </Link>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Enrolled Students"
          value={counts.students}
          change="8.2%"
          color="indigo"
          icon={
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <DashboardCard
          title="Specialized Teachers"
          value={counts.teachers}
          change="3.4%"
          color="cyan"
          icon={
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <DashboardCard
          title="Attendance Rate"
          value="96.2%"
          change="1.1%"
          color="emerald"
          icon={
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <DashboardCard
          title="Active Classes"
          value="14"
          change="16.7%"
          color="violet"
          icon={
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* NEW replacement section: Quick Shortcuts & Actions panel */}
      <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
        <div>
          <h4 className="text-lg font-bold text-zinc-100">Quick Administrative Shortcuts</h4>
          <p className="text-xs text-zinc-400">Directly jump to active school registries and schedules</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-1.5">
          <Link
            href="/dashboard/attendance"
            className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all"
          >
            📋 Mark Attendance
          </Link>
          <Link
            href="/dashboard/students"
            className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all"
          >
            🎓 Manage Students
          </Link>
          <Link
            href="/dashboard/timetable"
            className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all"
          >
            📅 View Timetable
          </Link>
          <Link
            href="/dashboard/holidays"
            className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all"
          >
            ☀️ Holiday Calendar
          </Link>
        </div>
      </div>

      {/* Grid: Announcement Notice Board on left, Interactive Planner on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Notice Board / Circulars */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
          <div>
            <h4 className="text-lg font-bold text-zinc-100">📢 Official Notice Board</h4>
            <p className="text-xs text-zinc-400">Academic updates, exams, and circular announcements</p>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Notice 1 */}
            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-16 h-16 rounded-full bg-cyan-500/5 blur-xl group-hover:scale-150 transition-all" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 uppercase tracking-widest">
                  Important
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold font-mono">May 24, 2026</span>
              </div>
              <h5 className="font-bold text-sm text-zinc-100 group-hover:text-cyan-300 transition-colors">
                Final Term Exams Schedule Released
              </h5>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Academic term exams are scheduled to commence from June 10, 2026. The detailed subject matrix has been published inside classroom desks.
              </p>
            </div>

            {/* Notice 2 */}
            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-16 h-16 rounded-full bg-purple-500/5 blur-xl group-hover:scale-150 transition-all" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 uppercase tracking-widest">
                  Events
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold font-mono">May 22, 2026</span>
              </div>
              <h5 className="font-bold text-sm text-zinc-100 group-hover:text-purple-300 transition-colors">
                Annual Science & Coding Exhibition
              </h5>
              <p className="text-zinc-400 text-xs leading-relaxed">
                EduPrime is hosting the Annual Science & Python Coding Hackathon on May 29. Teachers are requested to submit team participant roll records.
              </p>
            </div>

          </div>
        </div>

        {/* Interactive To-Do Planner */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
          <div>
            <h4 className="text-lg font-bold text-zinc-100">📋 Institutional To-Do Planner</h4>
            <p className="text-xs text-zinc-400">Track and manage your administrative tasks interactively</p>
          </div>

          {/* Form to Add Task */}
          <form onSubmit={handleAddTodo} className="flex gap-2.5">
            <input
              type="text"
              placeholder="e.g. Prepare Math exam papers..."
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              className="glass-input px-4 py-3 text-xs font-semibold w-full"
              required
            />
            <button
              type="submit"
              className="glow-btn px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex-shrink-0"
            >
              Add Task
            </button>
          </form>

          {/* Checklist Area */}
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {todos.length === 0 ? (
              <span className="text-zinc-600 text-center text-xs py-10 font-bold uppercase tracking-widest select-none">
                No active tasks found
              </span>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-3.5 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-3 group transition-all ${
                    todo.completed ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Circle checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(todo.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? "bg-indigo-500 border-indigo-400 text-white"
                          : "border-white/10 hover:border-indigo-500/50"
                      }`}
                    >
                      {todo.completed && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span
                      onClick={() => handleToggleTodo(todo.id)}
                      className={`text-xs font-semibold text-zinc-300 truncate cursor-pointer hover:text-white transition-colors ${
                        todo.completed ? "line-through text-zinc-500" : ""
                      }`}
                    >
                      {todo.text}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
