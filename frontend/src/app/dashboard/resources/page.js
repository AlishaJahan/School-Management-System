"use client";

import { useEffect, useState, useRef } from "react";
import Modal from "../../../components/Modal";

export default function StudyResources() {
  const [currentUser, setCurrentUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search/Filters State
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedType, setSelectedType] = useState("all");

  // Create Form/Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "Computer Science",
    resource_type: "pdf",
    file_url: "",
    class_grade: "Class 12-B"
  });

  // Simulated File Upload State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  // Video Preview Modal State
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState("");
  const [activeVideoTitle, setActiveVideoTitle] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        fetchResources();
      } catch (e) {
        console.error("Error loading user context", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/resources", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load study resources database.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error communicating with the resources server.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Simulated File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setUploadProgress(0);
      setUploading(true);
      
      // Simulate uploading progress bar
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setUploading(false);
          // Auto-generate mock file URL
          const mockUrl = `http://localhost:5000/mock-uploads/${encodeURIComponent(file.name)}`;
          setFormData(prev => ({ ...prev, file_url: mockUrl }));
          setSuccess("File uploaded and linked successfully!");
          setTimeout(() => setSuccess(""), 3000);
        }
      }, 150);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setUploadProgress(0);
      setUploading(true);
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setUploading(false);
          const mockUrl = `http://localhost:5000/mock-uploads/${encodeURIComponent(file.name)}`;
          setFormData(prev => ({ ...prev, file_url: mockUrl }));
          setSuccess("File dropped and linked successfully!");
          setTimeout(() => setSuccess(""), 3000);
        }
      }, 150);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.file_url.trim()) {
      setError("Title and file path/URL are required fields.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          subject: formData.subject,
          resource_type: formData.resource_type,
          file_url: formData.file_url.trim(),
          class_grade: formData.class_grade
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Study resource successfully published to all students!");
        setFormData({
          title: "",
          description: "",
          subject: "Computer Science",
          resource_type: "pdf",
          file_url: "",
          class_grade: "Class 12-B"
        });
        setFileName("");
        setUploadProgress(0);
        setModalOpen(false);
        fetchResources();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(data.message || "Failed to publish resource.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error publishing study resource.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study resource? Students will no longer be able to download/view it.")) return;

    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/resources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccess("Study resource deleted successfully.");
        setResources(prev => prev.filter(r => r.id !== id));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to delete study resource.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error deleting study resource.");
    }
  };

  // Convert watch/share YouTube URL to embed format if needed
  const getEmbedVideoUrl = (url) => {
    if (url.includes("youtube.com/embed/")) {
      return url;
    }
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleOpenVideo = (resource) => {
    const embedUrl = getEmbedVideoUrl(resource.file_url);
    setActiveVideoUrl(embedUrl);
    setActiveVideoTitle(resource.title);
    setVideoModalOpen(true);
  };

  // Extract unique subjects from resources list to dynamically populate tabs
  const subjects = ["All", ...new Set(resources.map(r => r.subject))];

  // Filtering Resources
  const filteredResources = resources.filter(res => {
    const matchesSearch = 
      res.title.toLowerCase().includes(search.toLowerCase()) ||
      (res.description || "").toLowerCase().includes(search.toLowerCase()) ||
      res.teacher_name.toLowerCase().includes(search.toLowerCase());

    const matchesSubject = 
      selectedSubject === "All" || res.subject.toLowerCase() === selectedSubject.toLowerCase();

    const matchesType = 
      selectedType === "all" || res.resource_type.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesSubject && matchesType;
  });

  const isStaff = currentUser?.role?.toLowerCase() === "admin" || currentUser?.role?.toLowerCase() === "teacher";

  const typeConfig = {
    pdf: {
      badge: "bg-teal-500/15 text-teal-300 border-teal-500/20",
      label: "📄 PDF Guide",
      buttonColor: "bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border-teal-500/30"
    },
    notes: {
      badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
      label: "📝 Notes",
      buttonColor: "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30"
    },
    video: {
      badge: "bg-rose-500/15 text-rose-300 border-rose-500/20",
      label: "🎥 Video Lesson",
      buttonColor: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30"
    },
    other: {
      badge: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20",
      label: "📁 Attachment",
      buttonColor: "bg-zinc-500/20 hover:bg-zinc-500/30 text-zinc-300 border-zinc-500/30"
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest pl-0.5">Study Material Registry</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Resource Sharing Hub</h2>
          <p className="text-zinc-400 text-sm">
            {isStaff 
              ? "⚡ Faculty Privilege: Publish, categorize, and update notes, lecture PDFs, and video links."
              : "Access reference textbooks, revision guides, and video lessons by subject."}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setModalOpen(true)}
            className="glow-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Resource</span>
          </button>
        )}
      </div>

      {/* Warning/Success Banners */}
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

      {/* Control panel: Search and Filters */}
      <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search input */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search resource title, notes description, or publisher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-11 pr-4 py-3 text-xs font-semibold w-full"
            />
          </div>

          {/* Type Filters Dropdown/Tabs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 select-none">
            <span>Type:</span>
            <div className="flex border border-white/5 rounded-xl overflow-hidden bg-black/40">
              {["all", "pdf", "notes", "video"].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                    selectedType === t 
                      ? "bg-cyan-500/10 text-cyan-300 border-x border-cyan-500/20"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Filter Row */}
        <div className="flex flex-wrap gap-2.5 border-t border-white/5 pt-4">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedSubject === sub
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredResources.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center flex flex-col gap-3 items-center justify-center border-dashed">
          <svg className="w-12 h-12 text-zinc-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs select-none">No resources found</span>
          <p className="text-zinc-600 text-xs">There are no study materials matching your selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-zoom-in">
          {filteredResources.map((res) => {
            const config = typeConfig[res.resource_type] || typeConfig.other;
            const isOwner = currentUser && res.teacher_id && currentUser.role === "teacher" && res.teacher_name === currentUser.name;
            const canDelete = currentUser?.role === "admin" || isOwner;

            return (
              <div
                key={res.id}
                className="glass-card p-6 rounded-3xl flex flex-col justify-between gap-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-white/5"
              >
                {/* Glow banner */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500/25 to-indigo-500/5 group-hover:from-cyan-400 group-hover:to-indigo-400 transition-colors" />

                <div className="flex flex-col gap-3.5 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${config.badge}`}>
                      {config.label}
                    </span>
                    
                    {/* Delete option */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteResource(res.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Study Resource"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Header Title */}
                  <h4 className="font-extrabold text-base text-white group-hover:text-cyan-400 transition-colors leading-snug">
                    {res.title}
                  </h4>

                  {/* Description */}
                  <p className="text-zinc-400 text-xs leading-relaxed font-semibold">
                    {res.description || "No lecture syllabus description provided."}
                  </p>
                </div>

                <div className="flex flex-col gap-4 relative z-10">
                  {/* Subject and Target tags */}
                  <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <span className="px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-400">
                      📚 {res.subject}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-400">
                      🏫 Grade: {res.class_grade}
                    </span>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span className="text-cyan-400/80 truncate max-w-[120px]">
                      👤 Faculty: {res.teacher_name}
                    </span>
                    
                    {res.resource_type === "video" ? (
                      <button
                        onClick={() => handleOpenVideo(res)}
                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${config.buttonColor}`}
                      >
                        🎥 Watch Video
                      </button>
                    ) : (
                      <a
                        href={res.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap text-center ${config.buttonColor}`}
                      >
                        📥 Download
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Upload Resource Modal Form (Teachers/Admins) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Upload & Share Study Material"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Resource Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Limits Continuity Lecture Notes - Calculus"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Academic Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white bg-[#09090b]"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="English Literature">English Literature</option>
                <option value="Other">Other Elective</option>
              </select>
            </div>

            {/* Target Class Grade */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Target Class Grade</label>
              <select
                name="class_grade"
                value={formData.class_grade}
                onChange={handleInputChange}
                className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white bg-[#09090b]"
              >
                <option value="Class 10-A">Class 10-A</option>
                <option value="Class 12-A">Class 12-A</option>
                <option value="Class 12-B">Class 12-B</option>
                <option value="All Classes">All Classes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resource Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Material Type</label>
              <select
                name="resource_type"
                value={formData.resource_type}
                onChange={handleInputChange}
                className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white bg-[#09090b]"
              >
                <option value="pdf">📄 PDF Document</option>
                <option value="notes">📝 Written Notes</option>
                <option value="video">🎥 YouTube Video Lesson</option>
                <option value="other">📁 Other File Attachment</option>
              </select>
            </div>

            {/* Manual URL link input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Link / URL Path</label>
              <input
                type="text"
                name="file_url"
                value={formData.file_url}
                onChange={handleInputChange}
                placeholder="Auto-filled on file upload OR enter URL manually"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                required
              />
            </div>
          </div>

          {/* Drag & Drop Simulated Dropzone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Upload Study File (Simulated)</label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className="border border-dashed border-white/10 hover:border-cyan-500/35 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#09090b]/30 flex flex-col items-center justify-center gap-2 group"
            >
              <span className="text-3xl text-zinc-600 group-hover:text-cyan-400 transition-colors">📁</span>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide">
                {fileName ? `Selected: ${fileName}` : "Drag & Drop File Here or click to Browse"}
              </p>
              <span className="text-[10px] text-zinc-500">Supports PDFs, DOCs, TXT notes, images, or slides</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Progress Simulator Bar */}
          {uploading && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
              <div className="flex justify-between text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-0.5 border border-white/5">
                <div
                  className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)] rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Description / Syllabus Scope</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Outline what chapter topics this reference resource covers, pre-requisite reading tasks..."
              rows="3"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setFileName("");
                setUploadProgress(0);
              }}
              className="flex-1 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all text-center animate-fade-in"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Study Material</span>
              )}
            </button>
          </div>

        </form>
      </Modal>

      {/* Video Popup Embed Modal */}
      <Modal
        isOpen={videoModalOpen}
        onClose={() => {
          setVideoModalOpen(false);
          setActiveVideoUrl("");
          setActiveVideoTitle("");
        }}
        title={activeVideoTitle}
      >
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
            {activeVideoUrl ? (
              <iframe
                src={activeVideoUrl}
                title={activeVideoTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                Video player loaded without direct source path.
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setVideoModalOpen(false);
              setActiveVideoUrl("");
              setActiveVideoTitle("");
            }}
            className="w-full py-3.5 rounded-xl border border-white/10 text-zinc-300 font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all text-center mt-2"
          >
            Acknowledge & Close
          </button>
        </div>
      </Modal>

    </div>
  );
}
