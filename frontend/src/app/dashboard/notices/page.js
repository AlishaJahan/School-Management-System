"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function NoticeBoard() {
  const [currentUser, setCurrentUser] = useState({ name: "Student", role: "student" });
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [success, setSuccess] = useState("");

  const isStaff = currentUser?.role?.toLowerCase() === "admin" || currentUser?.role?.toLowerCase() === "teacher";

  // Modal State for adding notice
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    body: ""
  });

  const categories = ["All", "Important", "Events", "Academic", "General"];

  const defaultNotices = [
    {
      id: 1,
      title: "Final Term Exams Schedule Released",
      category: "Important",
      body: "Academic term exams are scheduled to commence from June 10, 2026. The detailed subject matrix has been published inside classroom desks. All students must ensure their fee accounts are cleared by June 5.",
      publisher: "System Administrator",
      date: "2026-05-24"
    },
    {
      id: 2,
      title: "Annual Science & Coding Exhibition",
      category: "Events",
      body: "EduPrime is hosting the Annual Science & Python Coding Hackathon on May 29. All junior and senior teams are welcome to present their dynamic application projects. Teachers are requested to submit team participant roll records to the CS lab coordinator by Wednesday.",
      publisher: "Alisha Jahan (CS Department)",
      date: "2026-05-22"
    },
    {
      id: 3,
      title: "Welcome to the New Academic Session 2026!",
      category: "General",
      body: "We are thrilled to welcome all new and returning students to the Academic Year 2026. Let's make this a year of creative learning, personal growth, and outstanding academic achievements! Standard timetable matrices and text books are available in the coordinator blocks.",
      publisher: "System Administrator",
      date: "2026-04-01"
    }
  ];

  useEffect(() => {
    // 1. Get logged in user details
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Load notices from localStorage or seed defaults
    const savedNotices = localStorage.getItem("school_notices");
    if (savedNotices) {
      try {
        setNotices(JSON.parse(savedNotices));
      } catch (e) {
        console.error(e);
        setNotices(defaultNotices);
      }
    } else {
      setNotices(defaultNotices);
      localStorage.setItem("school_notices", JSON.stringify(defaultNotices));
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    const newNotice = {
      id: Date.now(),
      title: formData.title.trim(),
      category: formData.category,
      body: formData.body.trim(),
      publisher: currentUser.name + (currentUser.role === "teacher" ? " (Faculty Staff)" : " (Administrator)"),
      date: new Date().toISOString().split("T")[0]
    };

    const updatedNotices = [newNotice, ...notices];
    setNotices(updatedNotices);
    localStorage.setItem("school_notices", JSON.stringify(updatedNotices));

    // Reset Form & state
    setFormData({ title: "", category: "General", body: "" });
    setModalOpen(false);
    setSuccess("New academic notice successfully published to all dashboards!");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleDeleteNotice = (id) => {
    if (!window.confirm("Are you sure you want to delete this notice? This action is permanent.")) return;

    const updatedNotices = notices.filter(n => n.id !== id);
    setNotices(updatedNotices);
    localStorage.setItem("school_notices", JSON.stringify(updatedNotices));
    setSuccess("Academic notice successfully removed from notice boards.");
    setTimeout(() => setSuccess(""), 4000);
  };

  // Filter and Search Notices
  const filteredNotices = notices.filter(notice => {
    const matchesCategory = activeTab === "All" || notice.category === activeTab;
    const matchesSearch = 
      notice.title.toLowerCase().includes(search.toLowerCase()) ||
      notice.body.toLowerCase().includes(search.toLowerCase()) ||
      notice.publisher.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryBadgeColors = {
    Important: "bg-rose-500/15 text-rose-300 border-rose-500/20",
    Events: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    Academic: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
    General: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
  };

  const categoryGlowLines = {
    Important: "from-rose-500/30 to-rose-600/5",
    Events: "from-violet-500/30 to-violet-600/5",
    Academic: "from-cyan-500/30 to-cyan-600/5",
    General: "from-emerald-500/30 to-emerald-600/5"
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Institutional Notice Board</h2>
          <p className="text-zinc-400 text-sm">
            {isStaff 
              ? "⚡ Administrator Privilege: Publish official circulars, event guidelines, and circular updates." 
              : "Review official circulars, exam grids, holidays, and academy notifications."}
          </p>
        </div>

        {/* Publish Action Button */}
        {isStaff && (
          <button
            onClick={() => setModalOpen(true)}
            className="glow-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Success Notification Alert */}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-semibold animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Control panel: Search & Filters Category Tabs */}
      <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search circulars by keyword, publisher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-11 pr-4 py-3 text-xs font-semibold w-full"
            />
          </div>

          {/* Role Status Tag */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 select-none">
            <span>Viewing Mode:</span>
            <span className="px-2.5 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 uppercase text-[10px] font-extrabold tracking-wider">
              {currentUser.role} Desk
            </span>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2.5 border-t border-white/5 pt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === cat
                  ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Grid */}
      {filteredNotices.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center flex flex-col gap-3 items-center justify-center border-dashed">
          <svg className="w-12 h-12 text-zinc-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4M2 17h20M12 17v4m-3 0h6" />
          </svg>
          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs select-none">No active notices found</span>
          <p className="text-zinc-600 text-xs">There are no academic notices published matching your active keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="glass-card p-6 rounded-3xl flex flex-col justify-between gap-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
            >
              {/* Category glow banner */}
              <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${categoryGlowLines[notice.category] || 'from-indigo-500/30 to-indigo-600/5'}`} />

              <div className="flex flex-col gap-3 relative z-10">
                {/* Top stats bar */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${categoryBadgeColors[notice.category] || 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>
                    {notice.category}
                  </span>
                  
                  {/* Delete Option for Staff */}
                  {isStaff && (
                    <button
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove Notice"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Header title */}
                <h4 className="font-extrabold text-lg text-white group-hover:text-indigo-400 transition-colors">
                  {notice.title}
                </h4>

                {/* Notice text */}
                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                  {notice.body}
                </p>
              </div>

              {/* Publisher Footer */}
              <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wider relative z-10">
                <span className="flex items-center gap-1.5 text-indigo-400/80">
                  👤 By: {notice.publisher}
                </span>
                <span className="font-mono text-zinc-500 font-semibold">
                  📅 {new Date(notice.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Modal Form (Admin/Teacher only) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publish Official Notice Board Circular"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Circular Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Science Exhibition Registration Open"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              required
            />
          </div>

          {/* Category selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Announcement Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white bg-[#09090b]"
            >
              <option value="Important">Important Announcement</option>
              <option value="Events">School Events & Sports</option>
              <option value="Academic">Academic circulars & Syllabus</option>
              <option value="General">General Notices</option>
            </select>
          </div>

          {/* Content Body */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Notice Body Content</label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              placeholder="Provide complete circular details, target audience, timings, guidelines..."
              rows="5"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium resize-none leading-relaxed"
              required
            />
          </div>

          {/* Modal buttons */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:opacity-95"
            >
              Publish Circular
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
