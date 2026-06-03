"use client";

import { useEffect, useState } from "react";

export default function AIReportCardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Lists and selection states
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reportCard, setReportCard] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        initializePage(parsed);
      } catch (e) {
        console.error("Error loading user profile", e);
        setError("Failed to resolve user session.");
        setLoading(false);
      }
    } else {
      setError("Authorization required. Please log in.");
      setLoading(false);
    }
  }, []);

  const initializePage = async (userObj) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const roleLower = userObj.role?.toLowerCase();

      if (roleLower === "admin" || roleLower === "teacher") {
        // Fetch student list for selection
        const res = await fetch("http://localhost:5000/api/students", { headers });
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
          if (data.length > 0) {
            setSelectedStudentId(data[0].student_id);
            await fetchReportCard(data[0].student_id, token);
          }
        } else {
          setError("Failed to fetch students roster database.");
        }
      } else if (roleLower === "parent") {
        // Fetch report card using child alias
        await fetchReportCard("child", token);
      } else {
        // Fetch student own report card
        await fetchReportCard("me", token);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportCard = async (studentId, overrideToken) => {
    setReportLoading(true);
    setError("");
    const token = overrideToken || localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch(`http://localhost:5000/api/insights/report-card/${studentId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReportCard(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load the report card file.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failure while pulling report card data.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleStudentSelect = (e) => {
    const val = e.target.value;
    setSelectedStudentId(val);
    if (val) {
      fetchReportCard(val);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-cyan-500/10 border-b-cyan-400 animate-spin [animation-duration:1.5s]" />
        </div>
        <p className="text-sm font-extrabold text-indigo-300 uppercase tracking-widest animate-pulse">
          Loading Academic Records...
        </p>
      </div>
    );
  }

  const isTeacherOrAdmin = currentUser?.role?.toLowerCase() === "admin" || currentUser?.role?.toLowerCase() === "teacher";

  return (
    <div className="flex flex-col gap-8 w-full print:p-0">
      
      {/* Top Banner / Header (hidden in print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-zinc-900/50 to-zinc-950/30 backdrop-blur-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">AI Evaluation Center</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">
            Report Card Generator
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Dynamic academic remarks solver and official certificate compiler.
          </p>
        </div>

        {/* Student Selector Panel */}
        {isTeacherOrAdmin && students.length > 0 && (
          <div className="flex flex-col gap-1.5 min-w-[240px] z-10">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider pl-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={handleStudentSelect}
              className="glass-input px-4 py-2.5 text-sm font-semibold text-white bg-zinc-900/90 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id} className="bg-zinc-950 text-white">
                  {s.name} ({s.class_grade})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in print:hidden">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Report Card Panel */}
      {reportLoading ? (
        <div className="flex items-center justify-center min-h-[30vh] print:hidden">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
        </div>
      ) : reportCard ? (
        <div className="flex flex-col gap-6 print:gap-4 print-container">
          
          {/* Action overlay (hidden in print) */}
          <div className="flex justify-end print:hidden">
            <button
              onClick={handlePrint}
              className="glow-btn px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF Report Card
            </button>
          </div>

          {/* Clean Glassmorphic Official Document Layout */}
          <div className="glass-card p-8 md:p-12 rounded-[2rem] border border-white/5 bg-zinc-900/10 backdrop-blur-md relative overflow-hidden print:bg-white print:text-black print:border-zinc-300 print:shadow-none print:p-4 print:rounded-none">
            {/* Background design elements (hidden in print) */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-indigo-500/5 to-cyan-500/5 rounded-full blur-[100px] pointer-events-none print:hidden" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none print:hidden" />

            {/* Official Report Card Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-white/10 pb-8 gap-6 print:border-zinc-300 print:pb-4">
              <div className="flex items-center gap-4 text-center sm:text-left print:text-left">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 print:from-zinc-800 print:to-zinc-800 print:shadow-none">
                  <span className="font-black text-white text-2xl">EP</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white uppercase tracking-wider print:text-black">EduPrime Academy</h1>
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block print:text-zinc-600">Official Report Card</span>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-center sm:items-end gap-1 font-semibold text-xs text-zinc-400 print:text-zinc-600">
                <span>Academic Term: Spring Semester 2026</span>
                <span>Date Generated: {new Date().toLocaleDateString()}</span>
                <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold tracking-wider print:border-zinc-400 print:bg-zinc-100 print:text-zinc-700">
                  Certified Original
                </span>
              </div>
            </div>

            {/* Student Info Details Rack */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-b border-white/5 print:border-zinc-200 print:py-4 print:gap-2">
              <div className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.01] print:border-transparent print:bg-transparent print:p-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Student Name</span>
                <span className="text-sm font-extrabold text-white print:text-black">{reportCard.studentName}</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.01] print:border-transparent print:bg-transparent print:p-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Roll Number</span>
                <span className="text-sm font-bold text-zinc-300 font-mono print:text-black">{reportCard.rollNo}</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.01] print:border-transparent print:bg-transparent print:p-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Class Grade</span>
                <span className="text-sm font-bold text-zinc-300 print:text-black">{reportCard.classGrade}</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.01] print:border-transparent print:bg-transparent print:p-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Registered Email</span>
                <span className="text-sm font-semibold text-zinc-400 truncate print:text-black">{reportCard.email}</span>
              </div>
            </div>

            {/* AI Generated Remarks Panel */}
            <div className="flex flex-col gap-4 py-8 border-b border-white/5 print:border-zinc-200 print:py-4">
              <div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest print:text-zinc-800">
                  🤖 Automated AI Performance Remarks
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1 print:text-zinc-500">
                  Natural language insights generated dynamically based on attendance and test performance parameters.
                </p>
              </div>

              <div className="p-6 rounded-3xl border border-indigo-500/10 bg-indigo-500/5 flex flex-col gap-3.5 print:bg-zinc-50 print:border-zinc-300 print:p-4 print:rounded-xl">
                {reportCard.remarks.map((remark, idx) => {
                  // Determine remark category
                  const isNegative = remark.includes("Needs improvement") || remark.includes("Needs academic focus") || remark.includes("critical");
                  const isExcellent = remark.includes("excellent") || remark.includes("outstanding");

                  let marker = "●";
                  let markerColor = "text-indigo-400 print:text-zinc-600";
                  if (isNegative) {
                    marker = "⚠️";
                    markerColor = "text-rose-400";
                  } else if (isExcellent) {
                    marker = "★";
                    markerColor = "text-amber-400";
                  }

                  return (
                    <div key={idx} className="flex items-start gap-3.5 text-sm text-zinc-300 font-semibold leading-relaxed print:text-zinc-800">
                      <span className={`${markerColor} font-bold text-base mt-0.5 flex-shrink-0`}>{marker}</span>
                      <p>{remark}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Academic scorecard Table */}
            <div className="flex flex-col gap-4 py-8 border-b border-white/5 print:border-zinc-200 print:py-4">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest print:text-zinc-800">
                📚 Subject Academic Performance Scorecard
              </h3>

              <div className="overflow-x-auto border border-white/5 rounded-2xl print:border-zinc-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase font-bold text-zinc-500 tracking-wider print:bg-zinc-100 print:border-zinc-200 print:text-zinc-700">
                      <th className="py-3 px-5">Subject Area</th>
                      <th className="py-3 px-5">Score Percentage</th>
                      <th className="py-3 px-5">Performance Tier</th>
                      <th className="py-3 px-5">Progress Vector</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(reportCard.subjectAverages).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-zinc-500 text-xs font-bold uppercase">
                          No grades registered for this student
                        </td>
                      </tr>
                    ) : (
                      Object.keys(reportCard.subjectAverages).map((sub) => {
                        const score = reportCard.subjectAverages[sub].average;
                        let tier = "Stable";
                        let tierColor = "bg-amber-500/10 text-amber-400 border-amber-500/20 print:text-zinc-700 print:bg-zinc-100 print:border-zinc-300";
                        if (score >= 85) {
                          tier = "Outstanding";
                          tierColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 print:text-emerald-700 print:bg-emerald-50 print:border-emerald-200";
                        } else if (score < 60) {
                          tier = "Critical Focus";
                          tierColor = "bg-rose-500/10 text-rose-400 border-rose-500/20 print:text-rose-700 print:bg-rose-50 print:border-rose-200";
                        }

                        return (
                          <tr key={sub} className="border-b border-white/5 hover:bg-white/[0.005] transition-all print:border-zinc-200">
                            <td className="py-4 px-5 font-bold text-zinc-200 text-sm print:text-zinc-900">{sub}</td>
                            <td className="py-4 px-5 font-bold font-mono text-cyan-400 text-sm print:text-zinc-900">{score}%</td>
                            <td className="py-4 px-5">
                              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${tierColor}`}>
                                {tier}
                              </span>
                            </td>
                            <td className="py-4 px-5 w-44">
                              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 print:bg-zinc-100 print:border-zinc-300">
                                <div 
                                  className={`h-full rounded-full ${
                                    score >= 85 ? "bg-emerald-500" : score < 60 ? "bg-rose-500" : "bg-amber-500"
                                  }`} 
                                  style={{ width: `${score}%` }} 
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attendance & Badges twin column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-white/5 print:border-zinc-200 print:py-4 print:gap-4">
              
              {/* Attendance metrics */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest print:text-zinc-800">
                  📅 Attendance compliance matrix
                </h4>
                
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4 print:border-zinc-300 print:bg-transparent print:p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-semibold print:text-zinc-600">Verification Rate</span>
                    <span className={`text-base font-black font-mono ${
                      reportCard.metrics.attendanceRate < 75 ? "text-rose-400" : "text-emerald-400 print:text-black"
                    }`}>
                      {reportCard.metrics.attendanceRate}%
                    </span>
                  </div>
                  
                  {/* Attendance simple slider bar */}
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 print:bg-zinc-100 print:border-zinc-300">
                    <div 
                      className={`h-full rounded-full ${
                        reportCard.metrics.attendanceRate < 75 ? "bg-rose-500" : "bg-emerald-500"
                      }`} 
                      style={{ width: `${reportCard.metrics.attendanceRate}%` }} 
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider print:text-zinc-600">
                    <span>Present: {reportCard.metrics.presentDays} Days</span>
                    <span>Absent: {reportCard.metrics.totalDays - reportCard.metrics.presentDays} Days</span>
                    <span>Total Logs: {reportCard.metrics.totalDays} Days</span>
                  </div>
                </div>
              </div>

              {/* Achievements & Badges */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest print:text-zinc-800">
                  🏆 Awarded badges & achievements
                </h4>

                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-wrap gap-4 min-h-[100px] items-center justify-center print:border-zinc-300 print:bg-transparent print:p-2">
                  {reportCard.badges.length === 0 ? (
                    <span className="text-zinc-600 text-xs font-bold uppercase">No official badges awarded this term</span>
                  ) : (
                    reportCard.badges.map((badge, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] shadow-sm hover:scale-105 transition-transform print:border-zinc-300 print:bg-zinc-50 print:scale-100"
                        title={badge.description}
                      >
                        <span className="text-xl">{badge.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase tracking-wider print:text-black">{badge.name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-10 pt-16 text-center text-xs print:pt-10">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-40 border-b border-white/20 pb-1 font-mono italic text-zinc-400 print:border-zinc-400 print:text-zinc-700">
                  Class Advisor
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Class Instructor Sign</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-40 border-b border-white/20 pb-1 font-mono italic text-zinc-400 print:border-zinc-400 print:text-zinc-700">
                  Principal
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Academic Director Sign</span>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="p-8 border border-white/5 bg-white/[0.01] rounded-3xl text-zinc-400 text-center print:hidden">
          No report card files retrieved.
        </div>
      )}

      {/* Global CSS Style tag to override print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Force light background, hide side navigation sidebar */
          html, body, main {
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          aside, nav, header, button, select, .no-print, [role="navigation"] {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-container {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .glass-card {
            background: white !important;
            border: 1px solid #e4e4e7 !important;
            color: black !important;
            box-shadow: none !important;
            border-radius: 8px !important;
          }
        }
      `}} />
    </div>
  );
}
