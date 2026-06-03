"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function SkillProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Target student context
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [students, setStudents] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Form states for Teacher skill update
  const [codingScore, setCodingScore] = useState(0);
  const [sportsScore, setSportsScore] = useState(0);
  const [artsScore, setArtsScore] = useState(0);
  const [commScore, setCommScore] = useState(0);
  const [skillsSaving, setSkillsSaving] = useState(false);

  // Form states for adding Achievements
  const [achModalOpen, setAchModalOpen] = useState(false);
  const [achTitle, setAchTitle] = useState("");
  const [achCategory, setAchCategory] = useState("coding");
  const [achDate, setAchDate] = useState("");
  const [achDesc, setAchDesc] = useState("");
  const [achUrl, setAchUrl] = useState("");
  const [achSaving, setAchSaving] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        
        if (parsed.role === "student" || parsed.role === "parent") {
          fetchSelfProfile();
        } else {
          fetchStudentCatalog();
        }
      } catch (e) {
        console.error("Error parsing current user:", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch own profile (Students) or child profile (Parents)
  const fetchSelfProfile = async () => {
    setProfileLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/skills", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        syncSliderForm(data.skills);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load skill profile.");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection error reaching portal servers.");
    } finally {
      setProfileLoading(false);
      setLoading(false);
    }
  };

  // Fetch list of students for Teachers/Admins dropdown
  const fetchStudentCatalog = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific student's profile (Teachers/Admins)
  const fetchSelectedStudentProfile = async (studentId) => {
    if (!studentId) {
      setProfileData(null);
      return;
    }
    setProfileLoading(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/skills/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        syncSliderForm(data.skills);
      } else {
        setError("Failed to fetch student skill profile.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching student profile details.");
    } finally {
      setProfileLoading(false);
    }
  };

  const syncSliderForm = (skills) => {
    if (skills) {
      setCodingScore(skills.coding || 0);
      setSportsScore(skills.sports || 0);
      setArtsScore(skills.arts || 0);
      setCommScore(skills.communication || 0);
    }
  };

  // Handle skill levels update (Teachers/Admins only)
  const handleUpdateSkills = async (e) => {
    e.preventDefault();
    if (!profileData) return;
    setSkillsSaving(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/skills/student/${profileData.student.student_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          coding: codingScore,
          sports: sportsScore,
          arts: artsScore,
          communication: commScore
        })
      });
      if (res.ok) {
        setSuccess(`Skill ratings updated successfully for ${profileData.student.name}!`);
        // Refresh profile data
        fetchSelectedStudentProfile(profileData.student.student_id);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to update skill ratings.");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection issues updating skill scores.");
    } finally {
      setSkillsSaving(false);
    }
  };

  // Add Achievement
  const handleAddAchievement = async (e) => {
    e.preventDefault();
    if (!achTitle.trim() || !achDate) {
      setError("Achievement title and date earned are required.");
      return;
    }
    setAchSaving(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    const targetStudentId = currentUser.role === "student" || currentUser.role === "parent" 
      ? profileData?.student?.student_id 
      : profileData?.student?.student_id;

    try {
      const res = await fetch("http://localhost:5000/api/skills/achievements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: targetStudentId,
          title: achTitle,
          category: achCategory,
          description: achDesc,
          date_earned: achDate,
          proof_url: achUrl
        })
      });

      if (res.ok) {
        setSuccess("Achievement successfully appended to student portfolio!");
        setAchModalOpen(false);
        setAchTitle("");
        setAchCategory("coding");
        setAchDate("");
        setAchDesc("");
        setAchUrl("");
        
        // Reload details
        if (currentUser.role === "student" || currentUser.role === "parent") {
          fetchSelfProfile();
        } else {
          fetchSelectedStudentProfile(targetStudentId);
        }
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to add achievement.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issue submitting achievement portfolio item.");
    } finally {
      setAchSaving(false);
    }
  };

  // Delete Achievement
  const handleDeleteAchievement = async (achievementId) => {
    if (!window.confirm("Are you sure you want to remove this achievement from the portfolio?")) return;
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/skills/achievements/${achievementId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess("Achievement removed successfully from portfolio.");
        // Reload details
        if (currentUser.role === "student" || currentUser.role === "parent") {
          fetchSelfProfile();
        } else {
          fetchSelectedStudentProfile(profileData.student.student_id);
        }
      } else {
        setError("Failed to delete achievement.");
      }
    } catch (err) {
      console.error(err);
      setError("Network issues deleting achievement.");
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "coding": return "💻";
      case "sports": return "⚽";
      case "arts": return "🎨";
      case "communication": return "💬";
      case "academic": return "📚";
      default: return "🌟";
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case "coding": return "text-indigo-400 border-indigo-500/20 bg-indigo-500/10";
      case "sports": return "text-rose-400 border-rose-500/20 bg-rose-500/10";
      case "arts": return "text-amber-400 border-amber-500/20 bg-amber-500/10";
      case "communication": return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
      case "academic": return "text-cyan-400 border-cyan-500/20 bg-cyan-500/10";
      default: return "text-zinc-400 border-zinc-500/20 bg-zinc-500/10";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-zinc-400 font-semibold text-sm">Compiling skill profiles registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-zinc-900/50 to-zinc-950/30 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Skill Assessment Board</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">Student Skill Profile & Portfolio</h2>
          <p className="text-sm text-zinc-400">
            {currentUser?.role === "student"
              ? "Track your skill levels in Coding, Sports, Arts, and Communication. Manage your portfolio of achievements."
              : currentUser?.role === "parent"
              ? "Review your child's skill levels in Coding, Sports, Arts, and Communication, and inspect their achievements."
              : "Review and evaluate student skill ratings. Award endorsements and manage portfolios."}
          </p>
        </div>

        {/* Action button for Student/Parent */}
        {(currentUser?.role === "student" || currentUser?.role === "parent") && profileData && (
          <button
            onClick={() => setAchModalOpen(true)}
            className="glow-btn px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
          >
            ➕ Add Achievement
          </button>
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

      {/* TEACHER & ADMIN: Student Selector Header */}
      {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
        <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white leading-none">Student Registry Search</h3>
              <p className="text-xs text-zinc-500 mt-1">Select a student from your classes to examine or modify their profile details.</p>
            </div>

            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                fetchSelectedStudentProfile(e.target.value);
              }}
              className="glass-input px-4 py-2.5 text-xs font-bold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none min-w-[220px]"
            >
              <option value="" className="bg-zinc-950 text-zinc-500">Select Student</option>
              {students.map((stu) => (
                <option key={stu.student_id} value={stu.student_id} className="text-white">
                  {stu.name} ({stu.roll_no} - {stu.class_grade})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {profileLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : profileData ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full animate-fade-in">
          
          {/* LEFT 2 COLS: Skill indicators & Sliders (if Teacher) */}
          <div className="lg:col-span-2 flex flex-col gap-6 w-full">
            
            {/* Skills Radar Representation */}
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Core Competencies</span>
                <h3 className="text-xl font-bold text-white mt-1 leading-none">Endorsed Skills</h3>
              </div>

              {/* Progress bars stacking */}
              <div className="flex flex-col gap-5 mt-2">
                {/* Coding */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-indigo-400 flex items-center gap-1.5">💻 Coding & Programming</span>
                    <span className="text-zinc-300 font-mono">{profileData.skills.coding}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                    <div
                      className="bg-indigo-500 h-2.5 rounded-full shadow-lg shadow-indigo-500/30 transition-all duration-500"
                      style={{ width: `${profileData.skills.coding}%` }}
                    />
                  </div>
                </div>

                {/* Sports */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-rose-400 flex items-center gap-1.5">⚽ Sports & Athletics</span>
                    <span className="text-zinc-300 font-mono">{profileData.skills.sports}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                    <div
                      className="bg-rose-500 h-2.5 rounded-full shadow-lg shadow-rose-500/30 transition-all duration-500"
                      style={{ width: `${profileData.skills.sports}%` }}
                    />
                  </div>
                </div>

                {/* Arts */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-amber-400 flex items-center gap-1.5">🎨 Fine Arts & Design</span>
                    <span className="text-zinc-300 font-mono">{profileData.skills.arts}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full shadow-lg shadow-amber-500/30 transition-all duration-500"
                      style={{ width: `${profileData.skills.arts}%` }}
                    />
                  </div>
                </div>

                {/* Communication */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-400 flex items-center gap-1.5">💬 Communication & Public Speaking</span>
                    <span className="text-zinc-300 font-mono">{profileData.skills.communication}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-500"
                      style={{ width: `${profileData.skills.communication}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* TEACHER EVALUATOR EDIT CONTROL FORM */}
            {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md flex flex-col gap-6 animate-fade-in">
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Faculty Evaluation</span>
                  <h3 className="text-xl font-bold text-white mt-1 leading-none">Modify Skill Sliders</h3>
                </div>

                <form onSubmit={handleUpdateSkills} className="flex flex-col gap-5">
                  {/* Sliders */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-zinc-400">
                        <label>Coding Rating</label>
                        <span className="text-indigo-400 font-bold font-mono">{codingScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={codingScore}
                        onChange={(e) => setCodingScore(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-zinc-400">
                        <label>Sports Rating</label>
                        <span className="text-rose-400 font-bold font-mono">{sportsScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sportsScore}
                        onChange={(e) => setSportsScore(parseInt(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-zinc-400">
                        <label>Arts Rating</label>
                        <span className="text-amber-400 font-bold font-mono">{artsScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={artsScore}
                        onChange={(e) => setArtsScore(parseInt(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-zinc-400">
                        <label>Communication Rating</label>
                        <span className="text-emerald-400 font-bold font-mono">{commScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={commScore}
                        onChange={(e) => setCommScore(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-950 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={skillsSaving}
                    className="glow-btn py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {skillsSaving ? "Saving..." : "Update Skill Ratings"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT 3 COLS: Student Portfolio / Achievements Logs */}
          <div className="lg:col-span-3 flex flex-col gap-6 w-full">
            
            {/* Header info */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-white leading-none">Portfolio Showcase</h3>
                <p className="text-xs text-zinc-500 mt-1">Verified student portfolios containing extracurricular awards, code projects, and certificates.</p>
              </div>

              {/* Add achievement button for teachers/admins */}
              {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
                <button
                  onClick={() => setAchModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded-xl transition-all cursor-pointer"
                >
                  ➕ Add Achievement
                </button>
              )}
            </div>

            {/* Achievements Grid Cabinet */}
            {profileData.achievements.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center text-zinc-500 flex flex-col items-center gap-2 text-xs">
                <span>🏆</span>
                <p>No achievements registered in this student's portfolio cabinet yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {profileData.achievements.map((ach) => (
                  <div key={ach.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-3 relative group overflow-hidden">
                    {/* Delete button (Student owns, or Teacher/Admin) */}
                    {((currentUser?.role === "student" && profileData.student.student_id === profileData.student.student_id) || 
                      currentUser?.role === "teacher" || 
                      currentUser?.role === "admin") && (
                      <button
                        onClick={() => handleDeleteAchievement(ach.id)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 transition-all font-black text-xs cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete Portfolio Entry"
                      >
                        ✕
                      </button>
                    )}

                    {/* Badge and Title */}
                    <div className="flex items-start gap-3">
                      <span className="h-8 w-8 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0 bg-zinc-950 border-white/10">
                        {getCategoryIcon(ach.category)}
                      </span>

                      <div className="overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white leading-normal pr-4">{ach.title}</h4>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(ach.category)}`}>
                            {ach.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 block font-mono mt-1">
                          Date Earned: {new Date(ach.date_earned).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {ach.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed pl-11 font-medium mt-1 pr-6">
                        {ach.description}
                      </p>
                    )}

                    {/* Proof link */}
                    {ach.proof_url && (
                      <div className="pl-11 mt-1">
                        <a
                          href={ach.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest inline-flex items-center gap-1.5"
                        >
                          🌐 View Verification Proof →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl text-center text-zinc-500 gap-2 text-xs">
          <span>🎯</span>
          <p>Please select a student from the dropdown menu to inspect their skill levels and verified achievement records.</p>
        </div>
      )}

      {/* Modal form to add achievement */}
      <Modal
        isOpen={achModalOpen}
        onClose={() => setAchModalOpen(false)}
        title="Add Extracurricular Achievement"
      >
        <form onSubmit={handleAddAchievement} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Achievement Title</label>
            <input
              type="text"
              value={achTitle}
              onChange={(e) => setAchTitle(e.target.value)}
              placeholder="e.g. CodeWars Grandmaster, Football Golden Boot"
              className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Category</label>
              <select
                value={achCategory}
                onChange={(e) => setAchCategory(e.target.value)}
                className="glass-input px-3 py-3 text-xs font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl"
                required
              >
                <option value="coding" className="bg-zinc-950 text-white">Coding & Tech</option>
                <option value="sports" className="bg-zinc-950 text-white">Sports & Athletics</option>
                <option value="arts" className="bg-zinc-950 text-white">Fine Arts & Design</option>
                <option value="communication" className="bg-zinc-950 text-white">Public Speaking</option>
                <option value="academic" className="bg-zinc-950 text-white">Academic Awards</option>
                <option value="other" className="bg-zinc-950 text-white">Other Competencies</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date Earned</label>
              <input
                type="date"
                value={achDate}
                onChange={(e) => setAchDate(e.target.value)}
                className="glass-input px-3 py-2.5 text-xs font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Verification Link / Proof URL (Optional)</label>
            <input
              type="url"
              value={achUrl}
              onChange={(e) => setAchUrl(e.target.value)}
              placeholder="e.g. https://github.com/project-link"
              className="glass-input px-4 py-3 text-xs font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description</label>
            <textarea
              value={achDesc}
              onChange={(e) => setAchDesc(e.target.value)}
              placeholder="Describe the context of the award, what parameters were evaluated, and how you excelled..."
              rows="3"
              className="glass-input px-4 py-3 text-xs font-medium text-white bg-zinc-950/60 border border-white/10 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={achSaving}
            className="glow-btn py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
          >
            {achSaving ? "Saving Entry..." : "Publish to Portfolio"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
