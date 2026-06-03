"use client";

import { useEffect, useState } from "react";

export default function ComplaintsPortal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tickets list
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Filter & Search states (for Admin view)
  const [adminFilter, setAdminFilter] = useState("all"); // "all", "pending", "reviewing", "resolved", "dismissed"
  const [searchQuery, setSearchQuery] = useState("");

  // Student submission form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("academic");
  const [type, setType] = useState("complaint");
  const [description, setDescription] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Admin action form states
  const [activeReviewTicket, setActiveReviewTicket] = useState(null); // ticket currently being reviewed
  const [reviewStatus, setReviewStatus] = useState("reviewing");
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        fetchTickets(parsedUser);
      } catch (e) {
        console.error("Error parsing user context:", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTickets = async (userContext) => {
    setTicketsLoading(true);
    setError("");
    const user = userContext || currentUser;
    const token = localStorage.getItem("token");

    try {
      const endpoint = user.role === "admin" 
        ? "http://localhost:5000/api/complaints/admin" 
        : "http://localhost:5000/api/complaints/my";

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to retrieve tickets database.");
      }
    } catch (err) {
      console.error(err);
      setError("Network connection issue retrieving tickets.");
    } finally {
      setTicketsLoading(false);
      setLoading(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !description || !category) {
      setError("Please fill in all submission parameters.");
      return;
    }

    setSubmitLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, category, type, description })
      });

      if (res.ok) {
        const result = await res.json();
        setSuccess(`Success! Your ${type} has been anonymously posted under ID: ${result.ticket_id}.`);
        setTitle("");
        setDescription("");
        setCategory("academic");
        setType("complaint");
        // Reload list of tickets to include new one
        fetchTickets();
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to submit ticket.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed while transmitting ticket.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!activeReviewTicket) return;

    setReviewSubmitLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${activeReviewTicket.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          resolution_remarks: resolutionRemarks
        })
      });

      if (res.ok) {
        setSuccess(`Ticket ${activeReviewTicket.ticket_id} status updated successfully.`);
        setActiveReviewTicket(null);
        setResolutionRemarks("");
        // Reload tickets
        fetchTickets();
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to update ticket status.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed while resolving ticket status.");
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const openReviewConsole = (ticket) => {
    setActiveReviewTicket(ticket);
    setReviewStatus(ticket.status);
    setResolutionRemarks(ticket.resolution_remarks || "");
    // Scroll window smoothly to form
    const elem = document.getElementById("review-panel-box");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Filter and search computation for Admin Queue
  const filteredTickets = tickets.filter((t) => {
    const matchesFilter = adminFilter === "all" 
      || (adminFilter === "resolved_dismissed" && (t.status === "resolved" || t.status === "dismissed"))
      || t.status === adminFilter;

    const matchesSearch = searchQuery === ""
      || t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase())
      || t.title.toLowerCase().includes(searchQuery.toLowerCase())
      || t.description.toLowerCase().includes(searchQuery.toLowerCase())
      || t.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-400/10 border-amber-400/20 text-amber-400";
      case "reviewing":
        return "bg-blue-400/10 border-blue-400/20 text-blue-400";
      case "resolved":
        return "bg-emerald-400/10 border-emerald-400/20 text-emerald-400";
      case "dismissed":
        return "bg-rose-400/10 border-rose-400/20 text-rose-400";
      default:
        return "bg-zinc-400/10 border-zinc-400/20 text-zinc-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-zinc-400 font-semibold text-sm">Synchronizing grievance archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-zinc-900/50 to-zinc-950/30 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Feedback Center</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">
            {currentUser?.role === "admin" ? "Principal Grievance & Suggestion Console" : "Complaint & Suggestion Portal"}
          </h2>
          <p className="text-sm text-zinc-400">
            {currentUser?.role === "admin"
              ? "Review anonymous issues logged by students and post resolutions."
              : "Raise issues or request enhancements anonymously. Check ticket status timelines in real-time."}
          </p>
        </div>
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

      {/* STUDENT PORTAL VIEWS */}
      {currentUser?.role === "student" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* 1. Ticket Submission Box */}
          <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md relative overflow-hidden flex flex-col gap-6 h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold text-white">Log Grievance / Suggestion</h3>
              <p className="text-xs text-zinc-500 mt-1">Submit issues direct to the Principal. Your name is omitted from records.</p>
            </div>

            <form onSubmit={handleSubmitTicket} className="flex flex-col gap-4">
              {/* Type Toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1 font-semibold">Feedback Type</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-1.5 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setType("complaint")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      type === "complaint"
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Grievance / Complaint
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("suggestion")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      type === "suggestion"
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Suggestion
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                  required
                >
                  <option value="academic" className="bg-zinc-950 text-white">Academic</option>
                  <option value="facilities" className="bg-zinc-950 text-white">Facilities / Maintenance</option>
                  <option value="harassment" className="bg-zinc-950 text-white">Safety / Harassment</option>
                  <option value="extracurricular" className="bg-zinc-950 text-white">Extracurricular</option>
                  <option value="other" className="bg-zinc-950 text-white">Other</option>
                </select>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Topic / Summary</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken bench in room 201"
                  className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Explanation details</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue or suggestion in detail. Do not insert personally identifiable details if you want total anonymity."
                  className="glass-input px-4 py-3.5 text-sm font-semibold w-full text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none min-h-[120px]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="glow-btn py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                    <span>Transmitting File...</span>
                  </>
                ) : (
                  <span>Submit Secure Form</span>
                )}
              </button>
            </form>
          </div>

          {/* 2. Student Ticket Tracking Timeline */}
          <div className="lg:col-span-3 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">Status Tracking Timeline</h3>
              <p className="text-xs text-zinc-500 mt-1">Track resolution milestones of your submitted tickets.</p>
            </div>

            {ticketsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex items-center justify-center p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-zinc-500 text-xs">
                You have not submitted any complaints or suggestions.
              </div>
            ) : (
              <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                            {ticket.ticket_id}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 capitalize bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {ticket.category}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-2 leading-none">{ticket.title}</h4>
                      </div>

                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusBadgeClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="text-sm text-zinc-300 leading-relaxed font-semibold">
                      "{ticket.description}"
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono">
                      Logged: {new Date(ticket.created_at).toLocaleString()}
                    </div>

                    {/* Official principal response remarks */}
                    {ticket.resolution_remarks && (
                      <div className="mt-2 p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-zinc-300 text-xs">
                        <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                          <span>🛡️ Official Principal Resolution Remarks:</span>
                        </div>
                        <p className="leading-relaxed italic">"{ticket.resolution_remarks}"</p>
                        {ticket.resolved_at && (
                          <span className="block text-[9px] text-zinc-500 mt-2 font-mono">
                            Resolved: {new Date(ticket.resolved_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ADMIN / PRINCIPAL PORTAL VIEWS */}
      {currentUser?.role === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* 1. Admin Grievance Queue */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Filter Tabs & Search */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/5 backdrop-blur-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tracking key or keyword..."
                    className="glass-input pl-10 pr-4 py-2.5 text-xs font-semibold w-full text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="absolute left-3.5 top-3.5 text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Counter */}
                <span className="text-xs text-zinc-500 font-bold">
                  Queue count: {filteredTickets.length} items found
                </span>
              </div>

              {/* Status Filter Tab Group */}
              <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
                {["all", "pending", "reviewing", "resolved_dismissed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAdminFilter(tab)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all uppercase ${
                      adminFilter === tab
                        ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                        : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    {tab.replace("_", " & ")}
                  </button>
                ))}
              </div>
            </div>

            {/* List of anonymous complaint tickets */}
            {ticketsLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 border border-white/5 bg-white/[0.01] rounded-3xl text-zinc-400 text-center text-xs">
                No complaint or suggestion tickets matching filter.
              </div>
            ) : (
              <div className="flex flex-col gap-6 max-h-[650px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-mono">
                            {ticket.ticket_id}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            ticket.type === "suggestion" ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          }`}>
                            {ticket.type}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 capitalize bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {ticket.category}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-2 leading-tight">{ticket.title}</h4>
                      </div>

                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusBadgeClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="text-sm text-zinc-300 leading-relaxed font-semibold">
                      "{ticket.description}"
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                      <span>Logged: {new Date(ticket.created_at).toLocaleString()}</span>
                      <span className="text-zinc-600 font-semibold italic">👤 Submitter: Anonymous Student</span>
                    </div>

                    {/* Show resolution remarks inline if present */}
                    {ticket.resolution_remarks && (
                      <div className="p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-zinc-400 text-xs">
                        <strong className="block text-emerald-400 font-bold mb-0.5">Resolution Note:</strong>
                        <p className="italic">"{ticket.resolution_remarks}"</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                      <button
                        onClick={() => openReviewConsole(ticket)}
                        className="text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        Modify Status / Resolve
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Admin Review Panel Control */}
          <div id="review-panel-box" className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md relative overflow-hidden flex flex-col gap-6 h-fit scroll-mt-6">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold text-white">Resolution Center</h3>
              <p className="text-xs text-zinc-500 mt-1">Review ticket parameters and attach official comments.</p>
            </div>

            {activeReviewTicket ? (
              <form onSubmit={handleUpdateStatus} className="flex flex-col gap-5 animate-fade-in">
                {/* Display ticket info */}
                <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 text-xs flex flex-col gap-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-indigo-400">{activeReviewTicket.ticket_id}</span>
                    <span className="text-zinc-500 capitalize">{activeReviewTicket.category}</span>
                  </div>
                  <h4 className="font-extrabold text-white text-sm">{activeReviewTicket.title}</h4>
                  <p className="text-zinc-400 leading-relaxed italic">"{activeReviewTicket.description.substring(0, 100)}..."</p>
                </div>

                {/* Status Toggle Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Set Status</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="pending" className="bg-zinc-950 text-white">Pending Review</option>
                    <option value="reviewing" className="bg-zinc-950 text-white">Under Investigation / Reviewing</option>
                    <option value="resolved" className="bg-zinc-950 text-white">Resolved / Addressed</option>
                    <option value="dismissed" className="bg-zinc-950 text-white">Dismissed</option>
                  </select>
                </div>

                {/* Resolution Remarks */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Resolution / Response Remarks</label>
                  <textarea
                    value={resolutionRemarks}
                    onChange={(e) => setResolutionRemarks(e.target.value)}
                    placeholder="Attach institutional resolution details. Students can read this comment instantly on their timelines."
                    className="glass-input px-4 py-3.5 text-sm font-semibold w-full text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none min-h-[120px]"
                    required={reviewStatus === "resolved" || reviewStatus === "dismissed"}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={reviewSubmitLoading}
                    className="glow-btn py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex-1 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {reviewSubmitLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Status Update</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveReviewTicket(null)}
                    className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-center text-zinc-500 gap-2">
                <span className="text-3xl">📥</span>
                <p className="text-xs">Select a grievance or suggestion ticket from the active queue to initiate resolution reviews.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
