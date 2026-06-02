"use client";

import { useEffect, useState } from "react";

export default function AIInsightsPage() {
  const [currentUser, setCurrentUser] = useState({ name: "System User", role: "student" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Role: Admin/Teacher states
  const [dashboardData, setDashboardData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  
  // Selected Student for detailed AI suggestion drawer (Admin/Teacher view)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);

  // Role: Student states
  const [studentData, setStudentData] = useState(null);
  const [checkedSuggestions, setCheckedSuggestions] = useState({});

  useEffect(() => {
    // 1. Get logged-in user details
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        fetchData(parsed);
      } catch (e) {
        console.error("Error reading current user details", e);
        setError("Failed to resolve session keys.");
        setLoading(false);
      }
    } else {
      setError("Authorization required. Please log in.");
      setLoading(false);
    }
  }, []);

  const fetchData = async (userObj) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const headers = { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    };

    try {
      const roleLower = userObj.role?.toLowerCase();

      if (roleLower === "admin" || roleLower === "teacher") {
        const res = await fetch("http://localhost:5000/api/insights/dashboard", { headers });
        if (!res.ok) {
          throw new Error("Unable to pull administrator dashboard insights.");
        }
        const data = await res.json();
        setDashboardData(data);
      } else {
        // Logged in as student. Fetch student's own insights using dynamic 'me' path
        const res = await fetch("http://localhost:5000/api/insights/student/me", { headers });
        if (!res.ok) {
          throw new Error("Unable to pull student performance file.");
        }
        const data = await res.json();
        setStudentData(data);

        // Load checked suggestions from localStorage to maintain checklist persistence
        if (typeof window !== "undefined") {
          const cachedChecks = localStorage.getItem(`student_checklist_${data.student_id}`);
          if (cachedChecks) {
            try {
              setCheckedSuggestions(JSON.parse(cachedChecks));
            } catch (err) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentDrawer = async (studentId) => {
    setSuccess("");
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch(`http://localhost:5000/api/insights/student/${studentId}`, { headers });
      if (!res.ok) {
        throw new Error("Failed to load details for the selected student.");
      }
      const details = await res.json();
      setSelectedStudent(details);
      setIsDrawerOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRegenerateSuggestions = async (studentId) => {
    setRegeneratingId(studentId);
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/insights/suggestions/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId })
      });

      if (!res.ok) {
        throw new Error("Neural diagnostic model refused to calibrate.");
      }

      const result = await res.json();
      
      // Update local state drawer details
      if (selectedStudent && selectedStudent.student_id === studentId) {
        setSelectedStudent(prev => ({
          ...prev,
          suggestions: result.suggestions
        }));
      }

      // Update in main table list too
      if (dashboardData) {
        setDashboardData(prev => ({
          ...prev,
          students: prev.students.map(s => 
            s.student_id === studentId ? { ...s, suggestions: result.suggestions } : s
          )
        }));
      }

      setSuccess(`AI suggestions recalibrated for student.`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleToggleSuggestion = (taskText, id) => {
    if (!studentData) return;
    const newChecks = {
      ...checkedSuggestions,
      [taskText]: !checkedSuggestions[taskText]
    };
    setCheckedSuggestions(newChecks);
    localStorage.setItem(`student_checklist_${studentData.student_id}`, JSON.stringify(newChecks));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-cyan-500/10 border-b-cyan-400 animate-spin [animation-duration:1.5s]" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <span className="text-sm font-extrabold text-indigo-300 uppercase tracking-widest animate-pulse">Running AI Cognitive Diagnostics</span>
          <span className="text-[11px] text-zinc-500">Querying neural performance parameters and marks history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 rounded-3xl border-rose-500/20 bg-rose-500/5 max-w-xl mx-auto text-center flex flex-col gap-5 mt-10">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-white">Diagnostic Pulses Interrupted</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
        </div>
        <button
          onClick={() => fetchData(currentUser)}
          className="glow-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider mx-auto"
        >
          Retry Calibration
        </button>
      </div>
    );
  }

  // Determine which dashboard view to render
  const isTeacherOrAdmin = currentUser.role?.toLowerCase() === "admin" || currentUser.role?.toLowerCase() === "teacher";

  // Filter student listings (Admin/Teacher view)
  const filteredStudents = dashboardData
    ? dashboardData.students.filter(s => {
        const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.roll_no.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === "all" || s.riskAssessment.riskLevel.toLowerCase() === riskFilter.toLowerCase();
        
        let matchesClass = true;
        if (classFilter !== "all") {
          matchesClass = s.classGrade.toLowerCase().replace(/[^a-z0-9]/g, "") === classFilter.toLowerCase().replace(/[^a-z0-9]/g, "");
        }
        
        return matchesSearch && matchesRisk && matchesClass;
      })
    : [];

  const uniqueClasses = dashboardData
    ? Array.from(new Set(dashboardData.students.map(s => s.classGrade)))
    : [];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Title Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 uppercase tracking-widest">
              AI Powered
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 uppercase tracking-widest">
              Real-time Analytics
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">AI-Powered Performance Insights</h2>
          <p className="text-zinc-400 text-xs">
            {isTeacherOrAdmin
              ? "Predictive support monitoring, subject grading matrices, and automated diagnostic suggestions."
              : "Review your personalized AI diagnostic assessment, grades averages, and student study schedules."}
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-fade-in flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{success}</span>
        </div>
      )}

      {/* ======================= TEACHER / ADMIN DASHBOARD VIEW ======================= */}
      {isTeacherOrAdmin && dashboardData && (
        <>
          {/* Dashboard Summary Glow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Studied */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group border-white/5">
              <div className="absolute right-0 top-0 w-20 h-20 rounded-full bg-indigo-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Monitored Cohort</span>
              <h3 className="text-4xl font-extrabold text-white">{dashboardData.summary.totalStudents} <span className="text-xs font-medium text-zinc-500">Students</span></h3>
              <p className="text-[11px] text-zinc-400">Class 10-A, 11-A, & 12-B active rosters</p>
            </div>

            {/* Card 2: High Risk */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group border-rose-500/20 bg-rose-500/5">
              <div className="absolute right-0 top-0 w-20 h-20 rounded-full bg-rose-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Critical Focus Needed</span>
              <h3 className="text-4xl font-extrabold text-rose-400">{dashboardData.summary.highRisk} <span className="text-xs font-medium text-zinc-500">Students</span></h3>
              <p className="text-[11px] text-rose-300/80">Triggered: Grades &lt; 50% or Attendance &lt; 75%</p>
            </div>

            {/* Card 3: Avg Attendance */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group border-emerald-500/20 bg-emerald-500/5">
              <div className="absolute right-0 top-0 w-20 h-20 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Class Cohort Attendance</span>
              <h3 className="text-4xl font-extrabold text-emerald-400">{dashboardData.summary.averageAttendance}%</h3>
              <p className="text-[11px] text-emerald-300/80">Target threshold compliance: 75% min</p>
            </div>

            {/* Card 4: Avg Score */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group border-cyan-500/20 bg-cyan-500/5">
              <div className="absolute right-0 top-0 w-20 h-20 rounded-full bg-cyan-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Cohort Academic Average</span>
              <h3 className="text-4xl font-extrabold text-cyan-400">{dashboardData.summary.averageMarks}%</h3>
              <p className="text-[11px] text-cyan-300/80">Midterm and Final unified datasets</p>
            </div>

          </div>

          {/* Scatter Visual / Subject Grid Indicator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* AI Diagnostics Filter & Table (Col span 2) */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    🤖 AI Performance Support Predictor
                  </h4>
                  <p className="text-xs text-zinc-400">Heuristic predictions and risk metrics calculated dynamically.</p>
                </div>
              </div>

              {/* Advanced Filter Racks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="🔍 Search name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input px-3.5 py-2.5 text-xs font-semibold"
                />

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="glass-input px-3.5 py-2.5 text-xs font-semibold"
                >
                  <option value="all">⚠️ Filter Risk: All Statuses</option>
                  <option value="high">🔴 High Risk Only</option>
                  <option value="medium">🟡 Medium Risk Only</option>
                  <option value="low">🟢 Stable / Low Risk</option>
                </select>

                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="glass-input px-3.5 py-2.5 text-xs font-semibold"
                >
                  <option value="all">🏫 Filter Class: All</option>
                  {uniqueClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Student Insights Table Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      <th className="py-3 px-4">Student Profile</th>
                      <th className="py-3 px-4">Attendance Rate</th>
                      <th className="py-3 px-4">Avg Grade</th>
                      <th className="py-3 px-4">AI Risk Prediction</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider">
                          No matching student performance dossiers found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const risk = s.riskAssessment.riskLevel;
                        let riskColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                        if (risk === "High") riskColor = "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse";
                        else if (risk === "Medium") riskColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";

                        return (
                          <tr key={s.student_id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all group">
                            
                            {/* Profile Column */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  risk === "High" ? "bg-rose-500/10 text-rose-300" : "bg-indigo-500/10 text-indigo-300"
                                } border border-white/5`}>
                                  {s.studentName.substring(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">{s.studentName}</span>
                                  <span className="text-[10px] text-zinc-500 font-semibold font-mono">{s.roll_no} • {s.classGrade}</span>
                                </div>
                              </div>
                            </td>

                            {/* Attendance Column */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${s.metrics.attendanceRate < 75 ? "bg-rose-500" : "bg-emerald-500"}`} 
                                    style={{ width: `${s.metrics.attendanceRate}%` }} 
                                  />
                                </div>
                                <span className={`text-xs font-bold font-mono ${s.metrics.attendanceRate < 75 ? "text-rose-400" : "text-zinc-300"}`}>
                                  {s.metrics.attendanceRate}%
                                </span>
                              </div>
                            </td>

                            {/* Average Grade Column */}
                            <td className="py-4 px-4">
                              <span className={`text-xs font-bold font-mono ${s.metrics.avgMarks < 50 ? "text-rose-400" : "text-cyan-400"}`}>
                                {s.metrics.avgMarks}%
                              </span>
                            </td>

                            {/* AI Risk assessment badge */}
                            <td className="py-4 px-4">
                              <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${riskColor}`}>
                                {risk} Risk
                              </span>
                            </td>

                            {/* View detailed diagnostic actions */}
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleOpenStudentDrawer(s.student_id)}
                                className="px-3.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider transition-all"
                              >
                                View AI Diagnostics
                              </button>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Performance Visualizer scatter/bar chart (Col span 1) */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
              <div>
                <h4 className="text-lg font-bold text-white">📊 Diagnostic Cluster</h4>
                <p className="text-xs text-zinc-400">Scatter matrix correlating average grades vs attendance rate.</p>
              </div>

              {/* Chart Body */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                
                {/* SVG simulated Scatter chart */}
                <div className="relative w-full h-44 border-b border-l border-zinc-700 mt-2">
                  
                  {/* Legend Grid labels */}
                  <span className="absolute left-1 bottom-full text-[8px] text-zinc-500 font-mono">100% Grade</span>
                  <span className="absolute left-full bottom-1 text-[8px] text-zinc-500 font-mono whitespace-nowrap ml-1">100% Att.</span>
                  <span className="absolute left-1 bottom-1 text-[8px] text-zinc-600 font-mono">0%</span>

                  {/* Seeded Student Dots */}
                  {/* Rahul Verma (Avg: 45%, Att: 90%) -> X=90%, Y=45% */}
                  <div 
                    className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 border border-white/10 flex items-center justify-center group cursor-pointer animate-bounce shadow-lg shadow-rose-500/40"
                    style={{ left: '90%', bottom: '45%', transform: 'translate(-50%, 50%)' }}
                    onClick={() => handleOpenStudentDrawer(1)}
                  >
                    <span className="text-[7px] text-white font-extrabold">RV</span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-[#09090b] border border-white/10 p-2 rounded text-[9px] font-semibold text-zinc-300 z-10 whitespace-nowrap shadow-xl">
                      Rahul Verma (High Attendance, Academic At-Risk)
                    </div>
                  </div>

                  {/* Sana Khan (Avg: 93.6%, Att: 60%) -> X=60%, Y=93% */}
                  <div 
                    className="absolute w-3.5 h-3.5 rounded-full bg-rose-500 border border-white/10 flex items-center justify-center group cursor-pointer animate-bounce shadow-lg shadow-rose-500/40 [animation-delay:0.3s]"
                    style={{ left: '60%', bottom: '93%', transform: 'translate(-50%, 50%)' }}
                    onClick={() => handleOpenStudentDrawer(2)}
                  >
                    <span className="text-[7px] text-white font-extrabold">SK</span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-[#09090b] border border-white/10 p-2 rounded text-[9px] font-semibold text-zinc-300 z-10 whitespace-nowrap shadow-xl">
                      Sana Khan (Outstanding Grades, Attendance At-Risk)
                    </div>
                  </div>

                  {/* Healthy cohort cluster zone */}
                  <div className="absolute right-2 top-2 border border-dashed border-emerald-500/20 bg-emerald-500/[0.02] w-24 h-16 rounded-xl flex items-center justify-center">
                    <span className="text-[8px] font-bold text-emerald-500/40 uppercase tracking-widest">Healthy Zone</span>
                  </div>

                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2.5 text-[10px] text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                    <span>Red nodes highlight students breaching support thresholds.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-dashed border-emerald-500/40" />
                    <span>Healthy zone denotes compliant grades & attendance values.</span>
                  </div>
                </div>

              </div>

              <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-indigo-300 text-xs font-semibold leading-relaxed">
                💡 **Pro Tip:** Click the labeled nodes (`RV` for Rahul, `SK` for Sana) in the scatter cluster to jump directly into their cognitive study logs.
              </div>

            </div>

          </div>

          {/* SLIDE OUT DRAWER OVERLAY FOR DETAILED AI DIAGNOSTIC FILE */}
          {isDrawerOpen && selectedStudent && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/85 backdrop-blur-sm animate-fade-in">
              <div 
                className="absolute inset-0 cursor-pointer" 
                onClick={() => setIsDrawerOpen(false)} 
              />
              
              <div className="relative w-full max-w-2xl h-screen bg-[#09090b] border-l border-white/10 shadow-2xl flex flex-col p-8 overflow-y-auto z-10 animate-fade-in">
                
                {/* Close Drawer Button */}
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute top-6 right-6 w-9 h-9 rounded-xl border border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
                >
                  ✕
                </button>

                {/* Student Drawer Header */}
                <div className="flex items-center gap-4 mb-6 pr-10">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500/30 text-indigo-300 font-extrabold text-xl uppercase">
                    {selectedStudent.studentName.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white leading-tight">{selectedStudent.studentName}</h3>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedStudent.roll_no} • {selectedStudent.classGrade} Dossier</span>
                  </div>
                </div>

                {/* Risk Diagnostic Summary */}
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4 mb-6">
                  
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">AI Predictive Support Level</span>
                    
                    {/* Risk Badge */}
                    <span className={`text-[10px] font-black px-3 py-0.5 rounded-full border uppercase tracking-wider ${
                      selectedStudent.riskAssessment.riskLevel === "High"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : selectedStudent.riskAssessment.riskLevel === "Medium"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {selectedStudent.riskAssessment.riskLevel} Support Risk
                    </span>
                  </div>

                  {/* Diagnostic triggers */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Support Trigger Alerts</span>
                    {selectedStudent.riskAssessment.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-medium">
                        <span className="text-rose-400 mt-0.5">⚠️</span>
                        <p>{reason}</p>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Diagnostic metrics bar grids */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Calculated Attendance</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-white">{selectedStudent.metrics.attendanceRate}%</span>
                      <span className="text-[10px] text-zinc-500">({selectedStudent.metrics.presentDays}/{selectedStudent.metrics.totalDays} sessions)</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Calculated Grade Avg</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-white">{selectedStudent.metrics.avgMarks}%</span>
                      <span className="text-[10px] text-zinc-500">({selectedStudent.metrics.subjectsCount} subjects)</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Subject Breakdown bars */}
                <div className="flex flex-col gap-4 mb-6">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Academic Performance breakdown</h4>
                  <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                    {Object.keys(selectedStudent.subjectAverages).length === 0 ? (
                      <span className="text-zinc-600 text-xs py-4 text-center font-bold">No academic history available for analysis.</span>
                    ) : (
                      Object.keys(selectedStudent.subjectAverages).map(sub => {
                        const score = selectedStudent.subjectAverages[sub].average;
                        return (
                          <div key={sub} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-zinc-300">{sub}</span>
                              <span className={score < 50 ? "text-rose-400 font-mono font-bold" : score < 65 ? "text-amber-400 font-mono font-bold" : "text-cyan-400 font-mono font-bold"}>{score}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${score < 50 ? "bg-rose-500" : score < 65 ? "bg-amber-500" : "bg-cyan-500"}`} 
                                style={{ width: `${score}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* AI Personalized Study Plan Checklists drawer */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Generated Remedial Suggestions</h4>
                    <button
                      onClick={() => handleRegenerateSuggestions(selectedStudent.student_id)}
                      disabled={regeneratingId === selectedStudent.student_id}
                      className="glow-btn px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-extrabold text-[9px] uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {regeneratingId === selectedStudent.student_id ? (
                        <>
                          <svg className="animate-spin h-3 w-3 text-indigo-300" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Calibrating model...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Recalibrate Heuristics</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {selectedStudent.suggestions.map((sug) => {
                      let priorityColor = "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
                      if (sug.priority === "high") priorityColor = "bg-rose-500/15 text-rose-300 border-rose-500/20";
                      else if (sug.priority === "medium") priorityColor = "bg-amber-500/15 text-amber-300 border-amber-500/20";

                      return (
                        <div 
                          key={sug.id} 
                          className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2 relative group overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{sug.category}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityColor}`}>
                              {sug.priority} Priority
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 font-medium leading-relaxed">{sug.task}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}

      {/* ======================= STUDENT DASHBOARD VIEW ======================= */}
      {!isTeacherOrAdmin && studentData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main profile evaluation & suggestion checkboxes (Col span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Dynamic AI assessment message card */}
            {(() => {
              const risk = studentData.riskAssessment.riskLevel;
              let bannerColor = "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
              let title = "Stable & Self-Sufficient";
              let textDesc = "AI diagnostic logs show zero immediate support triggers. Maintain your current study vectors to remain compliant.";
              
              if (risk === "High") {
                bannerColor = "border-rose-500/20 bg-rose-500/5 text-rose-400 animate-pulse";
                title = "Academic/Attendance Remediation Recommended";
                textDesc = "AI diagnostic logs have detected critical risk triggers in your file. Review the personalized study schedule steps below.";
              } else if (risk === "Medium") {
                bannerColor = "border-amber-500/20 bg-amber-500/5 text-amber-400";
                title = "Academic Warning Triggered";
                textDesc = "Minor performance drops detected. Leverage the suggested study items to prevent support trigger breaches.";
              }

              return (
                <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center ${bannerColor}`}>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 flex-shrink-0">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-extrabold text-sm uppercase tracking-wide text-white">{title}</h4>
                    <p className="text-xs text-zinc-300 leading-normal">{textDesc}</p>
                  </div>
                </div>
              );
            })()}

            {/* Performance suggestions checklist */}
            <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-5">
              <div>
                <h4 className="text-lg font-bold text-white">📋 My AI Personalized Study Plan</h4>
                <p className="text-xs text-zinc-400">Action items compiled specifically for you based on current performance variables.</p>
              </div>

              {/* Suggestions items list */}
              <div className="flex flex-col gap-3.5">
                {studentData.suggestions.map((sug) => {
                  const isChecked = !!checkedSuggestions[sug.task];
                  let priorityLabel = "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
                  if (sug.priority === "high") priorityLabel = "bg-rose-500/15 text-rose-300 border-rose-500/20";
                  else if (sug.priority === "medium") priorityLabel = "bg-amber-500/15 text-amber-300 border-amber-500/20";

                  return (
                    <div 
                      key={sug.id}
                      className={`p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex items-start gap-4 transition-all ${
                        isChecked ? "opacity-45" : ""
                      }`}
                    >
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSuggestion(sug.task, sug.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${
                          isChecked
                            ? "bg-indigo-500 border-indigo-400 text-white"
                            : "border-white/10 hover:border-indigo-500/50"
                        }`}
                      >
                        {isChecked && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Content panel */}
                      <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{sug.category}</span>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityLabel}`}>
                            {sug.priority}
                          </span>
                        </div>
                        <p 
                          onClick={() => handleToggleSuggestion(sug.task, sug.id)}
                          className={`text-xs font-semibold text-zinc-300 leading-normal cursor-pointer hover:text-white transition-colors ${
                            isChecked ? "line-through text-zinc-500" : ""
                          }`}
                        >
                          {sug.task}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* Performance breakdown ring & bars (Col span 1) */}
          <div className="flex flex-col gap-6">
            
            {/* Attendance radial progress card */}
            <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col items-center text-center gap-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Attendance Status Ring</span>
                <span className="text-[11px] font-bold text-indigo-400">Total rate: {studentData.metrics.attendanceRate}%</span>
              </div>

              {/* Circular progress SVG */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.03)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="url(#radialGlow)"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - studentData.metrics.attendanceRate / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="radialGlow" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{studentData.metrics.attendanceRate}%</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Verified</span>
                </div>
              </div>

              <div className="p-3.5 w-full rounded-2xl border border-white/5 bg-white/[0.01] flex justify-between text-xs font-semibold">
                <div className="flex flex-col items-center flex-1 border-r border-white/5">
                  <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Present</span>
                  <span className="text-emerald-400 font-bold font-mono">{studentData.metrics.presentDays} Days</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Absent</span>
                  <span className="text-rose-400 font-bold font-mono">{studentData.metrics.totalDays - studentData.metrics.presentDays} Days</span>
                </div>
              </div>

            </div>

            {/* Subject performance progress bars */}
            <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Subject Performance Directory</h4>
                <p className="text-[11px] text-zinc-500">Subject aggregate marks compiled from term assessments.</p>
              </div>

              <div className="flex flex-col gap-4">
                {Object.keys(studentData.subjectAverages).length === 0 ? (
                  <span className="text-zinc-600 text-xs py-4 text-center font-bold">No academic history registers found.</span>
                ) : (
                  Object.keys(studentData.subjectAverages).map(sub => {
                    const score = studentData.subjectAverages[sub].average;
                    return (
                      <div key={sub} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300">{sub}</span>
                          <span className={score < 50 ? "text-rose-400 font-mono font-bold" : score < 65 ? "text-amber-400 font-mono font-bold" : "text-cyan-400 font-mono font-bold"}>{score}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${score < 50 ? "bg-rose-500" : score < 65 ? "bg-amber-500" : "bg-cyan-500"}`} 
                            style={{ width: `${score}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
