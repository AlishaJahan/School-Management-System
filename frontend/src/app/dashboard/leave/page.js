"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function LeaveManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Leave data
  const [leaveHistory, setLeaveHistory] = useState([]);
  
  // Apply Form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Admin Review states
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState(null); // Leave request being reviewed

  // Admin list filters
  const [activeAdminTab, setActiveAdminTab] = useState("pending"); // "pending" or "archived"
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        fetchLeaveHistory();
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchLeaveHistory = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/leaves/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaveHistory(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load leave history records");
      }
    } catch (err) {
      console.error(err);
      setError("Network error communicating with the school servers");
    } finally {
      setLoading(false);
    }
  };

  const isDateHolidayOrSunday = (dateStr) => {
    if (!dateStr) return { isBlocked: false };
    
    // Create date object and shift timezone offset to avoid timezone drift issues
    const dateObj = new Date(dateStr);
    
    // Check if Sunday (getDay() returns 0 for Sunday)
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) {
      return { isBlocked: true, reason: "Sunday (Weekend Off-Day)" };
    }
    
    const holidays = [
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-01-26", name: "Republic Day" },
      { date: "2026-02-15", name: "Maha Shivratri" },
      { date: "2026-03-04", name: "Holi Festival" },
      { date: "2026-03-20", name: "Eid-ul-Fitr" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-08-15", name: "Independence Day" },
      { date: "2026-08-28", name: "Raksha Bandhan" },
      { date: "2026-10-02", name: "Gandhi Jayanti" },
      { date: "2026-10-20", name: "Dussehra Break" },
      { date: "2026-11-24", name: "Guru Nanak Jayanti" },
      { date: "2026-12-25", name: "Christmas Day" }
    ];
    
    const matchedHoliday = holidays.find(h => h.date === dateStr);
    if (matchedHoliday) {
      return { isBlocked: true, reason: matchedHoliday.name };
    }
    
    // Check Diwali Holidays
    const diwaliStart = new Date("2026-11-07");
    const diwaliEnd = new Date("2026-11-10");
    if (dateObj >= diwaliStart && dateObj <= diwaliEnd) {
      return { isBlocked: true, reason: "Diwali Holidays Break" };
    }
    
    return { isBlocked: false };
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setError("Please fill out all leave application fields");
      return;
    }

    // Validate dates range order
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date");
      return;
    }

    // Validate Sunday / Holidays
    const startCheck = isDateHolidayOrSunday(startDate);
    if (startCheck.isBlocked) {
      setError(`Cannot apply for leave! The start date falls on a ${startCheck.reason}.`);
      return;
    }

    const endCheck = isDateHolidayOrSunday(endDate);
    if (endCheck.isBlocked) {
      setError(`Cannot apply for leave! The end date falls on a ${endCheck.reason}.`);
      return;
    }

    setFormLoading(true);
    setSuccess("");
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/leaves/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Leave request submitted successfully! Pending approval from Principal.");
        setStartDate("");
        setEndDate("");
        setReason("");
        
        // Refresh logs
        const refreshedRes = await fetch("http://localhost:5000/api/leaves/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshedRes.ok) {
          const refreshedData = await refreshedRes.json();
          setLeaveHistory(refreshedData);
        }
      } else {
        setError(data.message || "Failed to submit leave application");
      }
    } catch (err) {
      console.error(err);
      setError("Network error submitting leave application");
    } finally {
      setFormLoading(false);
    }
  };

  const handleReviewLeave = async (status) => {
    if (!selectedReviewRequest) return;

    setReviewLoading(true);
    setSuccess("");
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/leaves/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: selectedReviewRequest.id,
          status,
          remarks: reviewRemarks.trim() || null
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Leave request successfully ${status}!`);
        setSelectedReviewRequest(null);
        setReviewRemarks("");
        
        // Refresh logs
        const refreshedRes = await fetch("http://localhost:5000/api/leaves/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshedRes.ok) {
          const refreshedData = await refreshedRes.json();
          setLeaveHistory(refreshedData);
        }
      } else {
        setError(data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error(err);
      setError("Network error submitting leave review");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading && leaveHistory.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-zinc-400">Loading leave parameters...</span>
        </div>
      </div>
    );
  }

  // Filtered lists for Principal Console
  const pendingRequests = leaveHistory.filter(r => r.status === "pending" && 
    ((r.applicant_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
     (r.reason || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const archivedRequests = leaveHistory.filter(r => r.status !== "pending" &&
    ((r.applicant_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
     (r.reason || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isApplicant = currentUser?.role === "student" || currentUser?.role === "teacher" || currentUser?.role === "parent";
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-16">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-0.5">Faculty & Student Registry</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Digital Leave Management
          </h2>
          <p className="text-zinc-400 text-sm">
            {isApplicant 
              ? `Apply for academic or official leaves online and track status updates from the Principal.`
              : "Principal leave review panel. Manage approvals, leaves history, and log feedback remarks."
            }
          </p>
        </div>
        {isApplicant && currentUser && (
          <div className="glass-card px-4 py-2 rounded-xl border border-indigo-500/25 bg-indigo-500/5 text-indigo-300 font-extrabold text-xs uppercase tracking-wider">
            Role: {currentUser.role === "parent" ? "Parent Proxy" : currentUser.role}
          </div>
        )}
      </div>

      {/* Notifications */}
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

      {/* 1. STUDENT, TEACHER, AND PARENT VIEW */}
      {isApplicant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Application Form Column */}
          <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div>
              <h4 className="text-lg font-bold text-white">📝 Leave Application Form</h4>
              <p className="text-xs text-zinc-400">Specify date duration and provide detailed leave justification reasons.</p>
            </div>

            <form onSubmit={handleApplyLeave} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass-input px-4 py-3 text-xs font-semibold w-full text-zinc-300"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass-input px-4 py-3 text-xs font-semibold w-full text-zinc-300"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Reason / Remarks</label>
                <textarea
                  placeholder="Explain reason for leave application (medical, emergency, vacation)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="glass-input px-4 py-3 text-xs font-semibold w-full text-white min-h-[110px]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="glow-btn mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {formLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Submitting to Principal...</span>
                  </>
                ) : (
                  <span>Submit Leave Request</span>
                )}
              </button>
            </form>
          </div>

          {/* Leave History Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-4">
              <div>
                <h4 className="text-lg font-bold text-white">📋 Leave Request History Ledger</h4>
                <p className="text-xs text-zinc-400">Chronological history log of all leaves applied. Tracking review status and remarks.</p>
              </div>

              <div className="flex flex-col gap-4 mt-2 max-h-[500px] overflow-y-auto pr-1">
                {leaveHistory.length === 0 ? (
                  <div className="text-center py-16 border border-white/5 rounded-2xl text-zinc-600 text-xs font-bold uppercase tracking-wider">
                    No leave requests found in history.
                  </div>
                ) : (
                  leaveHistory.map((leave) => {
                    let statusColor = "border-amber-500/20 bg-amber-500/5 text-amber-300 shadow-amber-500/5";
                    if (leave.status === "approved") statusColor = "border-emerald-500/20 bg-emerald-500/5 text-emerald-300 shadow-emerald-500/5";
                    if (leave.status === "rejected") statusColor = "border-rose-500/20 bg-rose-500/5 text-rose-300 shadow-rose-500/5";

                    return (
                      <div
                        key={leave.id}
                        className={`p-5 rounded-2xl border transition-all duration-300 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                          leave.status === "pending" ? "border-white/5" : "border-white/5"
                        }`}
                      >
                        <div className="flex flex-col gap-1.5 overflow-hidden">
                          <span className="text-xs font-black text-white flex items-center gap-2">
                            📅 {new Date(leave.start_date).toLocaleDateString()} — {new Date(leave.end_date).toLocaleDateString()}
                          </span>
                          <p className="text-xs text-zinc-400 italic font-semibold leading-relaxed">
                            " {leave.reason} "
                          </p>
                          {leave.status !== "pending" && (
                            <div className="mt-1 flex flex-col gap-1 p-3 rounded-xl border border-white/5 bg-white/[0.01] text-[11px]">
                              <span className="font-bold text-zinc-300">Remarks from Principal ({leave.reviewer_name || 'Faculty'}):</span>
                              <p className="text-zinc-400">{leave.review_remarks || "Request reviewed and action recorded without remarks."}</p>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className={`px-4 py-2 border rounded-xl font-extrabold text-xs uppercase tracking-widest text-center whitespace-nowrap shadow-lg ${statusColor} ${leave.status === 'pending' ? 'animate-pulse' : ''}`}>
                          {leave.status}
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

      {/* 2. ADMIN/PRINCIPAL APPROVAL CONSOLE */}
      {isAdmin && (
        <div className="flex flex-col gap-6">
          
          {/* Stats Summaries Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl border-white/5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Leave Queries</span>
              <span className="text-2xl font-black text-white font-mono">{leaveHistory.length}</span>
            </div>
            <div className="glass-card p-6 rounded-2xl border-amber-500/20 bg-amber-500/5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pending Approvals Queue</span>
              <span className="text-2xl font-black text-amber-300 font-mono animate-pulse">
                {leaveHistory.filter(r => r.status === "pending").length}
              </span>
            </div>
            <div className="glass-card p-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Archived Leaves resolved</span>
              <span className="text-2xl font-black text-emerald-300 font-mono">
                {leaveHistory.filter(r => r.status !== "pending").length}
              </span>
            </div>
          </div>

          {/* Console Tab Selector */}
          <div className="flex border-b border-white/5 gap-4">
            <button
              onClick={() => { setActiveAdminTab("pending"); setSuccess(""); setError(""); }}
              className={`pb-3.5 px-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeAdminTab === "pending" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              📥 Pending Approval Queue
            </button>
            <button
              onClick={() => { setActiveAdminTab("archived"); setSuccess(""); setError(""); }}
              className={`pb-3.5 px-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeAdminTab === "archived" ? "border-indigo-500 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              📜 Archived & Resolved Logs
            </button>
          </div>

          {/* Search bar and approvals ledger */}
          <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-lg font-bold text-white">
                  {activeAdminTab === "pending" ? "📥 Pending Approvals Ledger" : "📜 Historical Leaves Archive"}
                </h4>
                <p className="text-xs text-zinc-400">Search leave records based on applicant name or reason description.</p>
              </div>
              <input
                type="text"
                placeholder="Search leaves..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input px-4 py-2.5 text-xs font-semibold w-full sm:w-64"
              />
            </div>

            {/* TAB CONTENT: PENDING QUEUE */}
            {activeAdminTab === "pending" && (
              <div className="overflow-x-auto">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-16 border border-white/5 rounded-2xl text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    No pending leave applications in queue.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-3 pl-2">Applicant</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Duration Dates</th>
                        <th className="pb-3">Leave Reason</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {pendingRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 pl-2 font-extrabold text-white">{req.applicant_name}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${
                              req.applicant_role === 'teacher' ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300' : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300'
                            }`}>
                              {req.applicant_role}
                            </span>
                          </td>
                          <td className="py-4 font-mono font-bold text-zinc-200">
                            {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                          </td>
                          <td className="py-4 max-w-xs truncate italic" title={req.reason}>"{req.reason}"</td>
                          <td className="py-4 text-right pr-2">
                            <button
                              onClick={() => setSelectedReviewRequest(req)}
                              className="px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 text-[10px] uppercase font-black tracking-wider transition-all"
                            >
                              Review Leave
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT: RESOLVED ARCHIVES */}
            {activeAdminTab === "archived" && (
              <div className="overflow-x-auto">
                {archivedRequests.length === 0 ? (
                  <div className="text-center py-16 border border-white/5 rounded-2xl text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    No resolved leave archives found.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-3 pl-2">Applicant</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Duration</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Review Remarks</th>
                        <th className="pb-3 text-right pr-2">Reviewed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {archivedRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 pl-2 font-extrabold text-white">{req.applicant_name}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${
                              req.applicant_role === 'teacher' ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300' : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300'
                            }`}>
                              {req.applicant_role}
                            </span>
                          </td>
                          <td className="py-4 font-mono">
                            {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 max-w-xs truncate italic" title={req.review_remarks}>
                            {req.review_remarks || "No remarks logged."}
                          </td>
                          <td className="py-4 text-right pr-2 font-bold text-indigo-300">{req.reviewer_name || "Principal"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* PRINCIPAL LEAVE REVIEW MODAL */}
      {selectedReviewRequest && (
        <Modal
          isOpen={!!selectedReviewRequest}
          onClose={() => { setSelectedReviewRequest(null); setReviewRemarks(""); }}
          title={`Review Leave Request - ${selectedReviewRequest.applicant_name}`}
        >
          <div className="flex flex-col gap-5 text-zinc-300">
            
            {/* Request Summary details */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-bold">Applicant / Role:</span>
                <span className="font-extrabold text-white">
                  {selectedReviewRequest.applicant_name} ({selectedReviewRequest.applicant_role})
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                <span className="text-zinc-500 font-bold">Duration Dates:</span>
                <span className="font-mono font-bold text-zinc-200">
                  {new Date(selectedReviewRequest.start_date).toLocaleDateString()} — {new Date(selectedReviewRequest.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-t border-white/5 pt-2 text-xs">
                <span className="text-zinc-500 font-bold">Reason Justification:</span>
                <p className="text-zinc-400 italic">" {selectedReviewRequest.reason} "</p>
              </div>
            </div>

            {/* Input feedback remarks */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Principal Feedback / Review Remarks</label>
              <input
                type="text"
                placeholder="e.g. Leave granted. catch up on lessons..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="glass-input px-4 py-3 text-xs font-semibold w-full text-white"
              />
            </div>

            {/* Review actions buttons */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <button
                onClick={() => handleReviewLeave("rejected")}
                disabled={reviewLoading}
                className="py-3 rounded-xl border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleReviewLeave("approved")}
                disabled={reviewLoading}
                className="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Approve Request
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
