"use client";

import { useEffect, useState } from "react";

export default function CareerGuidance() {
  const [currentUser, setCurrentUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Selection/Inspect state for admin/teachers
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Search Directories State
  const [collegeSearch, setCollegeSearch] = useState("");
  const [scholarshipSearch, setScholarshipSearch] = useState("");
  const [activeTab, setActiveTab] = useState("matches"); // "matches", "colleges", "scholarships"

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        fetchGuidanceReport(null);

        // Fetch students list if teacher or admin
        const role = parsedUser.role?.toLowerCase();
        if (role === "admin" || role === "teacher") {
          fetchStudentsList();
        }
      } catch (e) {
        console.error("Error setting user context", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchGuidanceReport = async (studentId) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      let url = "http://localhost:5000/api/career/guidance";
      if (studentId) {
        url += `?studentId=${studentId}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (data.student) {
          setSelectedStudentId(data.student.id);
        }
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load career guidance report.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error communicating with the career services server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsList = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentsList(data);
      }
    } catch (err) {
      console.error("Error fetching students directory", err);
    }
  };

  const handleStudentSelect = (e) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
    fetchGuidanceReport(sId);
  };

  const isStaff = currentUser?.role?.toLowerCase() === "admin" || currentUser?.role?.toLowerCase() === "teacher";

  // Filter lists
  const filteredColleges = report?.colleges?.filter(c => 
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.location.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.courses.toLowerCase().includes(collegeSearch.toLowerCase())
  ) || [];

  const filteredScholarships = report?.scholarships?.filter(s => 
    s.name.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
    s.provider.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
    s.eligibility.toLowerCase().includes(scholarshipSearch.toLowerCase())
  ) || [];

  if (loading && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-zinc-400">Compiling performance analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-0.5">AI Career Guidance Council</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Career & Academic Planner</h2>
          <p className="text-zinc-400 text-sm">
            {isStaff 
              ? "⚡ Faculty Console: Select students to review their dynamic career recommendations report."
              : "Explore matched career paths based on your academic grades and logged skill parameters."}
          </p>
        </div>

        {/* Student Selector for Admin/Teacher */}
        {isStaff && studentsList.length > 0 && (
          <div className="flex flex-col gap-1 w-full sm:w-64">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider pl-0.5">Inspect Student File</label>
            <select
              value={selectedStudentId}
              onChange={handleStudentSelect}
              className="glass-input px-4 py-2.5 text-xs font-bold text-indigo-300 bg-[#09090b] border-indigo-500/20"
            >
              {studentsList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.student_name} ({s.roll_no})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold animate-fade-in">
          <span>⚠️ {error}</span>
        </div>
      )}

      {report && (
        <>
          {/* Brief header showing current student being inspected */}
          <div className="p-5 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wide text-white">Active Guidance Report</h4>
                <p className="text-xs text-indigo-400 leading-normal">
                  Inspecting file for student: <strong className="text-white">{report.student.name}</strong> (Roll: {report.student.rollNo} | {report.student.classGrade})
                </p>
              </div>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl border border-indigo-500/20 bg-black/40 text-[10px] font-black uppercase tracking-wider text-indigo-300">
              Data Synchronized
            </div>
          </div>

          {/* Performance Brief Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic subject averages */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/5">
              <div>
                <h4 className="text-base font-bold text-white">📊 Subject-wise Academic Strengths</h4>
                <p className="text-xs text-zinc-400">Grade average percentages calculated from examination history.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {Object.keys(report.performanceBrief.averages).map(sub => {
                  const val = report.performanceBrief.averages[sub];
                  return (
                    <div key={sub} className="flex flex-col gap-1 p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider capitalize">{sub.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-lg font-black text-cyan-400 font-mono">{val}%</span>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2 border border-white/5">
                        <div className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)] rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student skills registry */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/5">
              <div>
                <h4 className="text-base font-bold text-white">🏆 Dynamic Skill Attributes</h4>
                <p className="text-xs text-zinc-400">Behavioral and vocational skill metrics logged by teachers and badges.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {Object.keys(report.performanceBrief.skills).map(sk => {
                  const val = report.performanceBrief.skills[sk];
                  return (
                    <div key={sk} className="flex flex-col gap-1 p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider capitalize">{sk}</span>
                      <span className="text-lg font-black text-violet-400 font-mono">{val} / 100</span>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2 border border-white/5">
                        <div className="h-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)] rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Directory Tabs */}
          <div className="flex border-b border-white/5 gap-2 mt-2">
            <button
              onClick={() => setActiveTab("matches")}
              className={`pb-3 px-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "matches" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🎯 Career Match Recommendations
            </button>
            <button
              onClick={() => setActiveTab("colleges")}
              className={`pb-3 px-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "colleges" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🏫 Colleges & Universities ({report.colleges.length})
            </button>
            <button
              onClick={() => setActiveTab("scholarships")}
              className={`pb-3 px-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === "scholarships" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🪙 Scholarships & Grants ({report.scholarships.length})
            </button>
          </div>

          {/* TAB 1: CAREER MATCHES */}
          {activeTab === "matches" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-zoom-in">
              {report.careerMatches.map((career) => {
                let badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                let barColor = "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                if (career.score >= 80) {
                  badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  barColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
                } else if (career.score >= 65) {
                  badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                  barColor = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]";
                }

                return (
                  <div
                    key={career.title}
                    className="glass-card p-6 rounded-3xl flex flex-col justify-between gap-6 border-white/5 hover:translate-y-[-2px] transition-all relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/[0.02] blur-xl pointer-events-none" />
                    
                    <div className="flex flex-col gap-3 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                          {career.score}% Match Score
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                          {career.outlook}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-base text-white group-hover:text-indigo-400 transition-colors leading-snug">
                        {career.title}
                      </h4>
                      
                      <p className="text-zinc-400 text-xs leading-relaxed font-semibold">
                        {career.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 relative z-10 border-t border-white/5 pt-4">
                      {/* Metric bars */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span>Core subjects: <strong className="text-zinc-300 font-semibold">{career.subjects}</strong></span>
                        <span className="text-white font-mono">{career.salary}</span>
                      </div>

                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${career.score}%` }} />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: COLLEGES */}
          {activeTab === "colleges" && (
            <div className="flex flex-col gap-6 animate-zoom-in">
              <div className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4 border-white/5">
                <div className="relative w-full max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search institutions by course, ranking, or location..."
                    value={collegeSearch}
                    onChange={(e) => setCollegeSearch(e.target.value)}
                    className="glass-input pl-9 pr-4 py-2.5 text-xs font-semibold w-full"
                  />
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Showing {filteredColleges.length} Institutions
                </div>
              </div>

              {filteredColleges.length === 0 ? (
                <div className="text-center py-16 border border-white/5 rounded-2xl text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  No colleges found matching search terms.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredColleges.map((college) => (
                    <div
                      key={college.id}
                      className="glass-card p-6 rounded-3xl border-white/5 flex flex-col justify-between gap-5 relative overflow-hidden group hover:scale-[1.002] transition-all"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-base text-white group-hover:text-cyan-400 transition-colors leading-snug">
                            {college.name}
                          </h4>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 whitespace-nowrap">
                            {college.ranking}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">📍 Location: {college.location}</span>
                        
                        <div className="flex flex-col gap-1 p-3 rounded-xl border border-white/5 bg-white/[0.01] text-xs">
                          <span className="font-bold text-zinc-300">Course Profiles:</span>
                          <p className="text-zinc-400 font-semibold">{college.courses}</p>
                        </div>

                        <div className="flex flex-col gap-1 text-[11px] leading-relaxed">
                          <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px]">Admission Requirements:</span>
                          <p className="text-zinc-500 font-medium italic">"{college.requirements}"</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-zinc-600">Institutional Portal</span>
                        <a
                          href={college.website}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 border border-cyan-500/30 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 rounded-lg text-[9px] font-black transition-all"
                        >
                          Visit College Website ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCHOLARSHIPS */}
          {activeTab === "scholarships" && (
            <div className="flex flex-col gap-6 animate-zoom-in">
              <div className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4 border-white/5">
                <div className="relative w-full max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search grants by provider, eligibility criteria..."
                    value={scholarshipSearch}
                    onChange={(e) => setScholarshipSearch(e.target.value)}
                    className="glass-input pl-9 pr-4 py-2.5 text-xs font-semibold w-full"
                  />
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Showing {filteredScholarships.length} Scholarships
                </div>
              </div>

              {filteredScholarships.length === 0 ? (
                <div className="text-center py-16 border border-white/5 rounded-2xl text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  No scholarships found matching search terms.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredScholarships.map((schol) => {
                    const daysLeft = Math.ceil((new Date(schol.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysLeft > 0 && daysLeft < 180; // mock countdown check

                    return (
                      <div
                        key={schol.id}
                        className="glass-card p-6 rounded-3xl border-white/5 flex flex-col justify-between gap-5 relative overflow-hidden group hover:scale-[1.002] transition-all"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-extrabold text-base text-white group-hover:text-violet-400 transition-colors leading-snug">
                              {schol.name}
                            </h4>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 whitespace-nowrap">
                              {schol.amount}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            <span>🏢 Provider: {schol.provider}</span>
                            <span className={isUrgent ? "text-amber-400 animate-pulse" : "text-zinc-500"}>
                              🕒 Deadline: {new Date(schol.deadline).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1 p-3 rounded-xl border border-white/5 bg-white/[0.01] text-xs">
                            <span className="font-bold text-zinc-300">Eligibility Terms:</span>
                            <p className="text-zinc-400 font-semibold leading-relaxed">"{schol.eligibility}"</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-zinc-600">Funding Application</span>
                          <a
                            href={schol.website}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 border border-violet-500/30 bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 rounded-lg text-[9px] font-black transition-all"
                          >
                            Apply Scholarship ↗
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
