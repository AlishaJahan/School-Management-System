"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function LeaderboardAndBadges() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Common Gamification Data
  const [leaderboard, setLeaderboard] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [students, setStudents] = useState([]); // For dropdowns

  // Student specific data (used for student and parent views)
  const [studentGamification, setStudentGamification] = useState(null);

  // Active view tab for student/parent: "dashboard" or "leaderboard" or "badges"
  const [activeTab, setActiveTab] = useState("dashboard");

  // Selected student for details inspection modal
  const [inspectedStudent, setInspectedStudent] = useState(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);

  // Teacher/Admin form states
  const [actionTab, setActionTab] = useState("points"); // "points" or "badge" or "create-badge"
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [awardPointsVal, setAwardPointsVal] = useState("10");
  const [awardCategory, setAwardCategory] = useState("participation");
  const [awardDescription, setAwardDescription] = useState("");
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  
  // Create Badge states
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeDesc, setNewBadgeDesc] = useState("");
  const [newBadgeIcon, setNewBadgeIcon] = useState("⭐");

  // Search filter for leaderboard
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        loadCommonData(u);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadCommonData = async (user) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Fetch global leaderboard
      const lbRes = await fetch("http://localhost:5000/api/gamification/leaderboard", { headers });
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData);
      }

      // 2. Fetch all badges
      const bgRes = await fetch("http://localhost:5000/api/gamification/badges", { headers });
      if (bgRes.ok) {
        const bgData = await bgRes.json();
        setAllBadges(bgData);
        if (bgData.length > 0) setSelectedBadgeId(bgData[0].id);
      }

      // 3. Load students list for dropdown (teachers/admins)
      if (user.role === "admin" || user.role === "teacher") {
        const stuRes = await fetch("http://localhost:5000/api/students", { headers });
        if (stuRes.ok) {
          const stuData = await stuRes.json();
          setStudents(stuData);
          if (stuData.length > 0) setSelectedStudentId(stuData[0].student_id);
        }
      }

      // 4. Fetch specific student status if role is student or parent
      if (user.role === "student") {
        const stRes = await fetch("http://localhost:5000/api/gamification/status/me", { headers });
        if (stRes.ok) {
          const stData = await stRes.json();
          setStudentGamification(stData);
        } else {
          const errData = await stRes.json();
          setError(errData.message || "Failed to load student status");
        }
      } else if (user.role === "parent") {
        // First resolve child insights
        const childRes = await fetch("http://localhost:5000/api/parent/child-insights", { headers });
        if (childRes.ok) {
          const childData = await childRes.json();
          const childId = childData.student_id;
          // Then resolve child status
          const stRes = await fetch(`http://localhost:5000/api/gamification/status/${childId}`, { headers });
          if (stRes.ok) {
            const stData = await stRes.json();
            setStudentGamification(stData);
          } else {
            setError("Failed to load child gamification profile");
          }
        } else {
          setError("Failed to locate linked child records");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error communicating with the school servers");
    } finally {
      setLoading(false);
    }
  };

  const handleInspectStudent = async (studentId) => {
    setInspectionLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/gamification/status/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInspectedStudent(data);
      } else {
        alert("Failed to load student gamification inspection cards.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInspectionLoading(false);
    }
  };

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !awardPointsVal || !awardDescription.trim()) {
      setError("All fields are required to award points");
      return;
    }

    setSuccess("");
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/gamification/award-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          points: awardPointsVal,
          category: awardCategory,
          description: awardDescription.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Successfully awarded ${awardPointsVal} points to student!`);
        setAwardDescription("");
        // Reload data
        loadCommonData(currentUser);
      } else {
        setError(data.message || "Failed to award points");
      }
    } catch (err) {
      setError("Network failure awarding points");
    }
  };

  const handleAwardBadge = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedBadgeId) {
      setError("Please select both a student and a badge");
      return;
    }

    setSuccess("");
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/gamification/award-badge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          badgeId: selectedBadgeId
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Badge successfully awarded to student!");
        loadCommonData(currentUser);
      } else {
        setError(data.message || "Failed to award badge");
      }
    } catch (err) {
      setError("Network failure awarding badge");
    }
  };

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    if (!newBadgeName.trim() || !newBadgeDesc.trim() || !newBadgeIcon.trim()) {
      setError("Please fill out all customizable badge parameters");
      return;
    }

    setSuccess("");
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/gamification/badges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newBadgeName.trim(),
          description: newBadgeDesc.trim(),
          icon: newBadgeIcon.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Custom badge successfully added to the school achievements database!");
        setNewBadgeName("");
        setNewBadgeDesc("");
        setNewBadgeIcon("⭐");
        loadCommonData(currentUser);
      } else {
        setError(data.message || "Failed to create badge");
      }
    } catch (err) {
      setError("Network failure creating badge");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-zinc-400">Loading school gamification models...</span>
        </div>
      </div>
    );
  }

  // Filtered leaderboard list
  const filteredLeaderboard = leaderboard.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.class_grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.roll_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Top 3 Podium
  const podium = leaderboard.slice(0, 3);

  // Role helpers
  const isStudentOrParent = currentUser?.role === "student" || currentUser?.role === "parent";
  const isTeacherOrAdmin = currentUser?.role === "teacher" || currentUser?.role === "admin";

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-16">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-0.5">Achievements & Engagement</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            School Leaderboards & Badges
          </h2>
          <p className="text-zinc-400 text-sm">
            {isStudentOrParent 
              ? `Review points earned, complete badge tasks, and track leaderboard standing for ${studentGamification?.name || 'student'}.`
              : "Administrative dashboard for custom badge templates creation, manual points logs, and ranking details."
            }
          </p>
        </div>
        {isStudentOrParent && studentGamification && (
          <div className="glass-card px-4 py-2 rounded-xl border border-indigo-500/25 bg-indigo-500/5 text-indigo-300 font-extrabold text-xs uppercase tracking-wider">
            🏆 Roll: {studentGamification.roll_no} | {studentGamification.class_grade}
          </div>
        )}
      </div>

      {/* Error and Success Notifications */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold animate-fade-in flex items-center gap-2.5">
          <span>⚠️ {error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-fade-in flex items-center gap-2.5">
          <span>✓ {success}</span>
        </div>
      )}

      {/* STUDENT & PARENT VIEW */}
      {isStudentOrParent && studentGamification && (
        <div className="flex flex-col gap-8">
          
          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-white/5 gap-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-3.5 px-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "dashboard" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🎯 My Points Dashboard
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={`pb-3.5 px-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "badges" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🏅 My Badge Case
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`pb-3.5 px-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "leaderboard" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🏆 School Leaderboard
            </button>
          </div>

          {/* TAB 1: POINTS DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Radial Points Tracker Card */}
              <div className="glass-card p-8 rounded-3xl border-white/5 flex flex-col items-center text-center gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
                
                <div>
                  <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Total Points Balance</h4>
                  <p className="text-xs text-zinc-500 mt-1">Updates in real-time based on academic achievements</p>
                </div>

                {/* Animated Glowing Ring */}
                <div className="relative w-44 h-44 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.01]">
                  <div className="absolute inset-2.5 rounded-full border border-indigo-500/20 bg-[#09090b] flex flex-col items-center justify-center shadow-2xl">
                    <span className="text-4xl font-black text-white tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                      {studentGamification.totalPoints}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">XP Points</span>
                  </div>
                  {/* Dynamic glow borders */}
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/40 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.25)]" />
                </div>

                {/* Standing Summary */}
                <div className="w-full grid grid-cols-2 gap-4 border-t border-white/5 pt-6 text-center">
                  <div className="flex flex-col gap-1 border-r border-white/5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">School Rank</span>
                    <span className="text-xl font-extrabold text-white">#{studentGamification.rank}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Badges Earned</span>
                    <span className="text-xl font-extrabold text-white">{studentGamification.badges?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Points Breakdown Grid */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="glass-card p-6 rounded-2xl border-white/5 flex flex-col gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">📊 Score Categories Breakdown</h4>
                    <p className="text-xs text-zinc-400">XP point allocations gained from different academic compliance channels.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    
                    {/* Attendance points */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📅</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Daily Attendance</span>
                          <span className="text-[9px] text-zinc-500 font-semibold font-mono">+10 pts per present</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-400 font-mono">+{studentGamification.pointsBreakdown.attendance} XP</span>
                    </div>

                    {/* Assignment points */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏆</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Assignments & Exams</span>
                          <span className="text-[9px] text-zinc-500 font-semibold font-mono">+20 pts per term grade</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-cyan-400 font-mono">+{studentGamification.pointsBreakdown.assignments} XP</span>
                    </div>

                    {/* Socratic Helper points */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🧠</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Socratic AI Assistant</span>
                          <span className="text-[9px] text-zinc-500 font-semibold font-mono">+10 pts per helper query</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-indigo-400 font-mono">+{studentGamification.pointsBreakdown.homeworkHelper} XP</span>
                    </div>

                    {/* Participation points */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💬</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Classroom Participation</span>
                          <span className="text-[9px] text-zinc-500 font-semibold font-mono">Manually awarded by faculty</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-violet-400 font-mono">+{studentGamification.pointsBreakdown.manual} XP</span>
                    </div>

                  </div>
                </div>

                {/* Points Logs History */}
                <div className="glass-card p-6 rounded-2xl border-white/5 flex flex-col gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">📜 Activity XP Ledger</h4>
                    <p className="text-xs text-zinc-400">Detailed records of manual points and custom awards recorded in your profile.</p>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1 mt-2">
                    {studentGamification.pointsHistory?.length === 0 ? (
                      <div className="text-center py-8 border border-white/5 rounded-xl text-zinc-500 text-xs font-bold uppercase tracking-wider">
                        No manual point transactions recorded yet.
                      </div>
                    ) : (
                      studentGamification.pointsHistory?.map(log => (
                        <div key={log.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="text-xs font-semibold text-white truncate">{log.description}</span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                              Category: {log.category} | {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-xs font-black text-violet-400 font-mono whitespace-nowrap bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20">
                            +{log.points} XP
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MY BADGE CASE */}
          {activeTab === "badges" && (
            <div className="glass-card p-8 rounded-3xl border-white/5 flex flex-col gap-6">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">🏅 Achievements Badge Showcase</h4>
                <p className="text-xs text-zinc-400">Displaying system-evaluated targets and teacher-granted honors. Grayed-out badges are lockable.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-2">
                {allBadges.map(badge => {
                  const earnedRecord = studentGamification.badges?.find(b => b.id === badge.id);
                  const isEarned = !!earnedRecord;
                  
                  return (
                    <div
                      key={badge.id}
                      className={`p-6 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all duration-300 relative group overflow-hidden ${
                        isEarned 
                          ? "border-indigo-500/20 bg-indigo-500/5 shadow-lg shadow-indigo-500/5" 
                          : "border-white/5 bg-white/[0.01] opacity-40 hover:opacity-50"
                      }`}
                    >
                      {/* Badge Icon */}
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border text-3xl shadow-inner ${
                        isEarned 
                          ? "border-indigo-500/30 bg-indigo-500/20 text-indigo-300 shadow-indigo-500/20" 
                          : "border-white/10 bg-white/5 text-zinc-500"
                      }`}>
                        {badge.icon}
                      </div>

                      {/* Locked Padlock */}
                      {!isEarned && (
                        <div className="absolute top-3 right-3 text-xs bg-zinc-900 border border-white/10 text-zinc-500 w-6 h-6 rounded-full flex items-center justify-center">
                          🔒
                        </div>
                      )}

                      {/* Details */}
                      <div>
                        <h5 className={`font-extrabold text-sm ${isEarned ? "text-white" : "text-zinc-500"}`}>{badge.name}</h5>
                        <p className="text-[11px] text-zinc-400 leading-normal mt-1 px-1">{badge.description}</p>
                      </div>

                      {/* Award Details */}
                      {isEarned && (
                        <div className="mt-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest border-t border-white/5 pt-2 w-full text-center font-mono">
                          {earnedRecord.type === "system" 
                            ? "✓ System Unlocked" 
                            : `★ Granted by ${earnedRecord.awarded_by_name || 'Faculty'}`
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SCHOOL LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="flex flex-col gap-8">
              
              {/* Podium display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end justify-center max-w-4xl mx-auto w-full mt-4">
                
                {/* 2nd place */}
                {podium[1] && (
                  <div className="flex flex-col items-center gap-3 md:order-1 order-2">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-slate-400 flex items-center justify-center text-xl font-black text-slate-300 shadow-lg shadow-slate-500/10">
                      🥈
                    </div>
                    <div className="glass-card w-full p-5 rounded-2xl border border-white/5 text-center flex flex-col gap-1 relative overflow-hidden h-[130px] justify-center bg-white/[0.01]">
                      <span className="text-xs font-extrabold text-white truncate px-1">{podium[1].name}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{podium[1].class_grade}</span>
                      <span className="text-lg font-black text-slate-300 font-mono mt-1.5">{podium[1].points} XP</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{podium[1].badgeCount} Badges</span>
                    </div>
                  </div>
                )}

                {/* 1st place */}
                {podium[0] && (
                  <div className="flex flex-col items-center gap-3 md:order-2 order-1 md:-translate-y-4">
                    <div className="w-20 h-20 rounded-full bg-amber-950/20 border-2 border-amber-400 flex items-center justify-center text-3xl font-black text-amber-400 shadow-xl shadow-amber-500/20 animate-bounce">
                      👑
                    </div>
                    <div className="glass-card w-full p-6 rounded-2xl border border-amber-500/20 text-center flex flex-col gap-1 relative overflow-hidden h-[160px] justify-center bg-amber-500/5 shadow-lg shadow-amber-500/5">
                      <span className="text-sm font-black text-white truncate px-1">{podium[0].name}</span>
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">{podium[0].class_grade}</span>
                      <span className="text-2xl font-black text-amber-300 font-mono mt-2 bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">{podium[0].points} XP</span>
                      <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider mt-0.5">{podium[0].badgeCount} Badges</span>
                    </div>
                  </div>
                )}

                {/* 3rd place */}
                {podium[2] && (
                  <div className="flex flex-col items-center gap-3 md:order-3 order-3">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-amber-700 flex items-center justify-center text-xl font-black text-amber-600 shadow-lg shadow-amber-800/10">
                      🥉
                    </div>
                    <div className="glass-card w-full p-5 rounded-2xl border border-white/5 text-center flex flex-col gap-1 relative overflow-hidden h-[130px] justify-center bg-white/[0.01]">
                      <span className="text-xs font-extrabold text-white truncate px-1">{podium[2].name}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{podium[2].class_grade}</span>
                      <span className="text-lg font-black text-amber-600 font-mono mt-1.5">{podium[2].points} XP</span>
                      <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mt-0.5">{podium[2].badgeCount} Badges</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Leaderboard Table List */}
              <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-5 mt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">🏆 Complete Leaderboard Rankings</h4>
                    <p className="text-xs text-zinc-400">Total student population scores index. You can search by name or class grade.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-input px-4 py-2.5 text-xs font-semibold w-full sm:w-64"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-3 pl-2">Rank</th>
                        <th className="pb-3">Student Name</th>
                        <th className="pb-3">Class Grade</th>
                        <th className="pb-3">Roll No</th>
                        <th className="pb-3">Badges</th>
                        <th className="pb-3 text-right pr-2">Total Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredLeaderboard.map((item, index) => {
                        const isSelf = item.student_id === studentGamification.student_id;
                        let rankBadge = item.rank;
                        if (item.rank === 1) rankBadge = "🥇";
                        else if (item.rank === 2) rankBadge = "🥈";
                        else if (item.rank === 3) rankBadge = "🥉";

                        return (
                          <tr key={item.student_id} className={`hover:bg-white/[0.02] transition-colors ${isSelf ? "bg-indigo-500/5 text-indigo-300" : "text-zinc-300"}`}>
                            <td className="py-4 pl-2 font-black font-mono text-sm">{rankBadge}</td>
                            <td className="py-4 font-extrabold text-white">
                              {item.name} {isSelf && <span className="text-[9px] font-black uppercase text-indigo-400 border border-indigo-500/25 bg-indigo-500/10 px-1.5 py-0.5 rounded ml-1">You</span>}
                            </td>
                            <td className="py-4">{item.class_grade}</td>
                            <td className="py-4 font-mono">{item.roll_no}</td>
                            <td className="py-4 font-mono">{item.badgeCount}</td>
                            <td className="py-4 text-right pr-2 font-black font-mono text-indigo-400">{item.points} XP</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* TEACHER & ADMIN CONSOLE VIEW */}
      {isTeacherOrAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Column 1 & 2: Leaderboard Table and Inspection panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Rankings and Inspection Table */}
            <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">🏆 School Leaderboard Console</h4>
                  <p className="text-xs text-zinc-400">Rankings index. Click any student row to inspect points details and badge cases.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input px-4 py-2.5 text-xs font-semibold w-full sm:w-64"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="pb-3 pl-2">Rank</th>
                      <th className="pb-3">Student Name</th>
                      <th className="pb-3">Class Grade</th>
                      <th className="pb-3">Roll No</th>
                      <th className="pb-3">Badges</th>
                      <th className="pb-3 text-right">Points</th>
                      <th className="pb-3 text-right pr-2">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {filteredLeaderboard.map((item) => {
                      let rankBadge = item.rank;
                      if (item.rank === 1) rankBadge = "🥇";
                      else if (item.rank === 2) rankBadge = "🥈";
                      else if (item.rank === 3) rankBadge = "🥉";

                      return (
                        <tr key={item.student_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 pl-2 font-black font-mono text-sm">{rankBadge}</td>
                          <td className="py-4 font-extrabold text-white">{item.name}</td>
                          <td className="py-4">{item.class_grade}</td>
                          <td className="py-4 font-mono">{item.roll_no}</td>
                          <td className="py-4 font-mono">{item.badgeCount}</td>
                          <td className="py-4 text-right font-black font-mono text-indigo-400">{item.points} XP</td>
                          <td className="py-4 text-right pr-2">
                            <button
                              onClick={() => handleInspectStudent(item.student_id)}
                              className="px-2.5 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 text-[10px] uppercase font-black tracking-wider transition-all"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Column 3: Control Panel Forms */}
          <div className="flex flex-col gap-6">
            
            <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-5">
              
              {/* Form Navigation Tabs */}
              <div className="flex border-b border-white/5 mb-3 gap-2">
                <button
                  onClick={() => { setActionTab("points"); setSuccess(""); setError(""); }}
                  className={`pb-2 px-1 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    actionTab === "points" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Award Points
                </button>
                <button
                  onClick={() => { setActionTab("badge"); setSuccess(""); setError(""); }}
                  className={`pb-2 px-1 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    actionTab === "badge" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Award Badge
                </button>
                <button
                  onClick={() => { setActionTab("create-badge"); setSuccess(""); setError(""); }}
                  className={`pb-2 px-1 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    actionTab === "create-badge" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Create Badge
                </button>
              </div>

              {/* ACTION 1: AWARD POINTS FORM */}
              {actionTab === "points" && (
                <form onSubmit={handleAwardPoints} className="flex flex-col gap-4 animate-fade-in">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Select Student</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="glass-input px-3 py-2 text-xs font-semibold w-full text-zinc-300"
                    >
                      {students.map(s => (
                        <option key={s.student_id} value={s.student_id} className="bg-[#09090b]">
                          {s.name} ({s.class_grade})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Category</label>
                      <select
                        value={awardCategory}
                        onChange={(e) => setAwardCategory(e.target.value)}
                        className="glass-input px-3 py-2 text-xs font-semibold w-full text-zinc-300"
                      >
                        <option value="participation" className="bg-[#09090b]">Participation</option>
                        <option value="assignment" className="bg-[#09090b]">Assignment</option>
                        <option value="attendance" className="bg-[#09090b]">Attendance</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Points amount</label>
                      <select
                        value={awardPointsVal}
                        onChange={(e) => setAwardPointsVal(e.target.value)}
                        className="glass-input px-3 py-2 text-xs font-semibold w-full text-zinc-300"
                      >
                        <option value="5" className="bg-[#09090b]">+5 XP</option>
                        <option value="10" className="bg-[#09090b]">+10 XP</option>
                        <option value="20" className="bg-[#09090b]">+20 XP</option>
                        <option value="30" className="bg-[#09090b]">+30 XP</option>
                        <option value="50" className="bg-[#09090b]">+50 XP</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Award Description / Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Active solution in Calculus lab answers"
                      value={awardDescription}
                      onChange={(e) => setAwardDescription(e.target.value)}
                      className="glass-input px-4 py-3 text-xs font-semibold w-full text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="glow-btn mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Award points to student
                  </button>
                </form>
              )}

              {/* ACTION 2: AWARD BADGE FORM */}
              {actionTab === "badge" && (
                <form onSubmit={handleAwardBadge} className="flex flex-col gap-4 animate-fade-in">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Select Student</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="glass-input px-3 py-2 text-xs font-semibold w-full text-zinc-300"
                    >
                      {students.map(s => (
                        <option key={s.student_id} value={s.student_id} className="bg-[#09090b]">
                          {s.name} ({s.class_grade})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Select Badge</label>
                    <select
                      value={selectedBadgeId}
                      onChange={(e) => setSelectedBadgeId(e.target.value)}
                      className="glass-input px-3 py-2 text-xs font-semibold w-full text-zinc-300"
                    >
                      {allBadges.map(b => (
                        <option key={b.id} value={b.id} className="bg-[#09090b]">
                          {b.icon} {b.name} ({b.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="glow-btn mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Award badge to student
                  </button>
                </form>
              )}

              {/* ACTION 3: CREATE BADGE FORM */}
              {actionTab === "create-badge" && (
                <form onSubmit={handleCreateBadge} className="flex flex-col gap-4 animate-fade-in">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Badge Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Quick Thinker"
                      value={newBadgeName}
                      onChange={(e) => setNewBadgeName(e.target.value)}
                      className="glass-input px-4 py-3 text-xs font-semibold w-full text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Badge Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Solved DBMS queries rapidly"
                        value={newBadgeDesc}
                        onChange={(e) => setNewBadgeDesc(e.target.value)}
                        className="glass-input px-4 py-3 text-xs font-semibold w-full text-white"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Icon / Emoji</label>
                      <select
                        value={newBadgeIcon}
                        onChange={(e) => setNewBadgeIcon(e.target.value)}
                        className="glass-input px-3 py-2.5 text-xs font-semibold w-full text-zinc-300"
                      >
                        <option value="⭐">⭐ Star</option>
                        <option value="🚀">🚀 Rocket</option>
                        <option value="💡">💡 Idea</option>
                        <option value="🔥">🔥 Fire</option>
                        <option value="🧠">🧠 Brain</option>
                        <option value="🏅">🏅 Medal</option>
                        <option value="🎨">🎨 Palette</option>
                        <option value="💻">💻 Code</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="glow-btn mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Create Custom Badge
                  </button>
                </form>
              )}

            </div>

          </div>

        </div>
      )}

      {/* STUDENT INSPECTION MODAL FOR TEACHERS/ADMINS */}
      {inspectedStudent && (
        <Modal
          isOpen={!!inspectedStudent}
          onClose={() => setInspectedStudent(null)}
          title={`Gamification Inspection - ${inspectedStudent.name}`}
        >
          <div className="flex flex-col gap-6 text-zinc-300 max-h-[80vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Class / Roll</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">{inspectedStudent.class_grade} | {inspectedStudent.roll_no}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Total Points Balance</span>
                <span className="text-sm font-black text-indigo-400 font-mono mt-0.5 block">{inspectedStudent.totalPoints} XP (Rank #{inspectedStudent.rank})</span>
              </div>
            </div>

            {/* Points Breakdown */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest pl-0.5">Points Breakdown</span>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Attendance:</span>
                  <span className="font-bold font-mono text-emerald-400">+{inspectedStudent.pointsBreakdown.attendance} XP</span>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Assignments:</span>
                  <span className="font-bold font-mono text-cyan-400">+{inspectedStudent.pointsBreakdown.assignments} XP</span>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Socratic AI:</span>
                  <span className="font-bold font-mono text-indigo-400">+{inspectedStudent.pointsBreakdown.homeworkHelper} XP</span>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Participation:</span>
                  <span className="font-bold font-mono text-violet-400">+{inspectedStudent.pointsBreakdown.manual} XP</span>
                </div>
              </div>
            </div>

            {/* Badges Earned */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest pl-0.5">Earned Badges ({inspectedStudent.badges?.length || 0})</span>
              {inspectedStudent.badges?.length === 0 ? (
                <div className="text-center py-6 border border-white/5 rounded-xl text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  No badges earned yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inspectedStudent.badges?.map(badge => (
                    <div key={badge.id} className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center gap-3">
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-extrabold text-white truncate">{badge.name}</span>
                        <span className="text-[9px] font-semibold text-zinc-400 truncate">{badge.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points History */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest pl-0.5">Activity XP Ledger</span>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {inspectedStudent.pointsHistory?.length === 0 ? (
                  <div className="text-center py-6 border border-white/5 rounded-xl text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    No manual points transactions recorded.
                  </div>
                ) : (
                  inspectedStudent.pointsHistory?.map(log => (
                    <div key={log.id} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs">
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="font-semibold text-zinc-200 truncate">{log.description}</span>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{log.category} | {new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="font-bold text-violet-400 font-mono bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 whitespace-nowrap ml-2">+{log.points} XP</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
