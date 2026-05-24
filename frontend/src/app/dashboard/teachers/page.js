"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function TeachersManagement() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAdmin, setIsAdmin] = useState(true);

  // Modal & form states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    subject: "",
    phone: "",
    joining_date: new Date().toISOString().split("T")[0],
    status: "active"
  });

  const fetchTeachers = async (searchTerm = "") => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const url = searchTerm
        ? `http://localhost:5000/api/teachers?search=${encodeURIComponent(searchTerm)}`
        : "http://localhost:5000/api/teachers";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setIsAdmin(false);
          throw new Error("Access Denied: Admin authorization required to manage teachers.");
        }
        throw new Error(data.message || "Failed to fetch teacher list");
      }
      setTeachers(data);
    } catch (err) {
      setError(err.message || "Failed to connect to backend server.");
      // Fallback mock list if database connection is not established or access is denied but we show list
      if (err.message.includes("Access Denied")) {
        setIsAdmin(false);
      } else {
        setTeachers([
          { teacher_id: 1, name: "Alisha Jahan", email: "alisha@school.com", subject: "Computer Science", phone: "+91 9876543210", status: "active", joining_date: "2025-01-15" },
          { teacher_id: 2, name: "Rohan Sharma", email: "rohan@school.com", subject: "Mathematics", phone: "+91 9998887776", status: "active", joining_date: "2024-06-10" }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check local role
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.role !== "admin") {
          setIsAdmin(false);
          setError("Access Denied: Administrator role is required to manage teacher profiles.");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchTeachers();
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearch(term);
    fetchTeachers(term);
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormData({
      name: "",
      email: "",
      password: "",
      subject: "",
      phone: "",
      joining_date: new Date().toISOString().split("T")[0],
      status: "active"
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (teacher) => {
    setModalMode("edit");
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: "", // Leave blank on edit
      subject: teacher.subject,
      phone: teacher.phone,
      joining_date: teacher.joining_date ? teacher.joining_date.split("T")[0] : "",
      status: teacher.status
    });
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      let res;
      let data;

      if (modalMode === "add") {
        res = await fetch("http://localhost:5000/api/teachers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`http://localhost:5000/api/teachers/${selectedTeacher.teacher_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      }

      data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process record");

      setSuccess(modalMode === "add" ? "Teacher profile registered successfully!" : "Teacher record updated successfully!");
      setModalOpen(false);
      fetchTeachers(search);

      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Operation failed.");
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher record?")) return;

    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/teachers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete teacher record");

      setSuccess("Teacher record successfully removed.");
      fetchTeachers(search);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete teacher.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-6v2m0-5h.01M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Security Access Denied</h2>
        <p className="text-zinc-400 text-sm max-w-md mt-2">
          Administrator level privilege keys are required to access this system segment. Please switch active profile views.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Title Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Teacher Registry Directory</h2>
          <p className="text-zinc-400 text-sm">Review subject specializations, hiring records, and phone directories</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="glow-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Register Teacher</span>
        </button>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-semibold animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {error && !error.includes("Access Denied") && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm font-semibold animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Control bar */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search teachers by name, email, specialized subject..."
            value={search}
            onChange={handleSearchChange}
            className="glass-input pl-11 pr-4 py-3.5 text-sm font-medium w-full"
          />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold pr-2">
            <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Querying...</span>
          </div>
        )}
      </div>

      {/* Teachers Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-zinc-400 uppercase tracking-widest">
                <th className="px-6 py-5">Teacher Information</th>
                <th className="px-6 py-5">Specialized Subject</th>
                <th className="px-6 py-5">Phone Number</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Joining Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-zinc-500 font-semibold text-sm">
                    No teacher records matching filters found.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.teacher_id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-300 font-bold uppercase">
                          {teacher.name.substring(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block group-hover:text-cyan-400 transition-colors">
                            {teacher.name}
                          </span>
                          <span className="text-xs text-zinc-400 block">{teacher.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-medium text-sm text-cyan-300 font-semibold">
                      {teacher.subject}
                    </td>
                    <td className="px-6 py-5 text-zinc-300 text-sm font-medium font-mono">
                      {teacher.phone || "N/A"}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          teacher.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === "active" ? "bg-emerald-400" : "bg-rose-400"}`} />
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-zinc-400 text-xs font-semibold">
                      {teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEditModal(teacher)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/5 bg-white/5 text-zinc-300 hover:text-white hover:bg-cyan-500 hover:border-cyan-400 transition-all"
                          title="Edit Teacher Profile"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.teacher_id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center border border-rose-500/10 bg-rose-500/5 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-400 transition-all"
                          title="Delete Teacher Profile"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Update Teacher Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "add" ? "Register New Teacher Profile" : "Modify Teacher Details"}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Alisha Jahan"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g. alisha@school.com"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              required
            />
          </div>

          {modalMode === "add" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Initial Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave blank for standard 'teacher123'"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Specialized Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g. Computer Science"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. +91 9876543210"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                required
              />
            </div>
          </div>

          {modalMode === "add" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hiring Date</label>
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleInputChange}
                className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white appearance-none"
                required
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white appearance-none"
              >
                <option value="active" className="bg-[#09090b]">Active Status</option>
                <option value="inactive" className="bg-[#09090b]">Inactive Status</option>
              </select>
            </div>
          )}

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
              {modalMode === "add" ? "Submit Registration" : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
