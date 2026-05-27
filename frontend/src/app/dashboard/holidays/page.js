"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function AcademicHolidays() {
  const [currentUser, setCurrentUser] = useState({ name: "Student", role: "student" });
  const [filter, setFilter] = useState("all");
  const [holidays, setHolidays] = useState([]);
  const [success, setSuccess] = useState("");

  // Modal State for adding holiday
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    displayDate: "",
    day: "",
    type: "National",
    duration: "1 Day",
    description: ""
  });

  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  const defaultHolidays = [
    {
      name: "New Year's Day",
      date: "2026-01-01",
      displayDate: "Jan 1, 2026",
      day: "Thursday",
      type: "National",
      duration: "1 Day",
      description: "Observance of the first day of the modern Gregorian calendar year."
    },
    {
      name: "Republic Day",
      date: "2026-01-26",
      displayDate: "Jan 26, 2026",
      day: "Monday",
      type: "National",
      duration: "1 Day",
      description: "Commemorating the adoption of the Constitution of India in 1950."
    },
    {
      name: "Maha Shivratri",
      date: "2026-02-15",
      displayDate: "Feb 15, 2026",
      day: "Sunday",
      type: "Festival",
      duration: "1 Day",
      description: "Major Hindu festival celebrated annually in honour of Lord Shiva."
    },
    {
      name: "Holi Festival",
      date: "2026-03-04",
      displayDate: "Mar 4, 2026",
      day: "Wednesday",
      type: "Festival",
      duration: "1 Day",
      description: "The ancient Hindu festival of colours, celebrating the eternal love of Radha Krishna."
    },
    {
      name: "Eid-ul-Fitr",
      date: "2026-03-20",
      displayDate: "Mar 20, 2026",
      day: "Friday",
      type: "Festival",
      duration: "1 Day",
      description: "Islamic holy festival marking the completion of the sacred month of Ramadan."
    },
    {
      name: "Good Friday",
      date: "2026-04-03",
      displayDate: "Apr 3, 2026",
      day: "Friday",
      type: "Gazetted",
      duration: "1 Day",
      description: "Christian holiday commemorating the crucifixion of Jesus Christ."
    },
    {
      name: "Summer Vacation",
      date: "2026-05-25",
      displayDate: "May 25 - Jun 30",
      day: "Multiple",
      type: "Seasonal",
      duration: "37 Days",
      description: "Annual mid-term summer vacation break for all grade levels."
    },
    {
      name: "Independence Day",
      date: "2026-08-15",
      displayDate: "Aug 15, 2026",
      day: "Saturday",
      type: "National",
      duration: "1 Day",
      description: "Celebrating national independence from United Kingdom rule in 1947."
    },
    {
      name: "Raksha Bandhan",
      date: "2026-08-28",
      displayDate: "Aug 28, 2026",
      day: "Friday",
      type: "Festival",
      duration: "1 Day",
      description: "Celebration of sibling bonds where sisters tie safety threads (rakhi) on brothers."
    },
    {
      name: "Gandhi Jayanti",
      date: "2026-10-02",
      displayDate: "Oct 2, 2026",
      day: "Friday",
      type: "National",
      duration: "1 Day",
      description: "Birth anniversary tribute to Mahatma Gandhi, Father of the Indian Nation."
    },
    {
      name: "Dussehra Break",
      date: "2026-10-20",
      displayDate: "Oct 20, 2026",
      day: "Tuesday",
      type: "Festival",
      duration: "1 Day",
      description: "Celebrating the victory of good over evil (Lord Rama's victory over Ravana)."
    },
    {
      name: "Diwali Holidays",
      date: "2026-11-07",
      displayDate: "Nov 7 - Nov 10",
      day: "Multiple",
      type: "Seasonal",
      duration: "4 Days",
      description: "Festival of Lights deepavali breaks, home decorations, and sweets exchanges."
    },
    {
      name: "Guru Nanak Jayanti",
      date: "2026-11-24",
      displayDate: "Nov 24, 2026",
      day: "Tuesday",
      type: "Gazetted",
      duration: "1 Day",
      description: "Birth anniversary celebration of the first Sikh Guru, Guru Nanak Dev Ji."
    },
    {
      name: "Christmas Day",
      date: "2026-12-25",
      displayDate: "Dec 25, 2026",
      day: "Friday",
      type: "National",
      duration: "1 Day",
      description: "Holiday commemorating the nativity birth anniversary of Jesus Christ."
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

    // 2. Load holidays from localStorage or seed defaults
    // - [x] Dynamic School Holidays Management
    // - [x] Modify `frontend/src/app/dashboard/holidays/page.js` to load from `localStorage`
    // - [x] Display Add Holiday button & Delete actions for Admin
    // - [x] Create Holiday Modal Form
    const savedHolidays = localStorage.getItem("school_holidays");
    if (savedHolidays) {
      try {
        setHolidays(JSON.parse(savedHolidays));
      } catch (e) {
        console.error(e);
        setHolidays(defaultHolidays);
      }
    } else {
      setHolidays(defaultHolidays);
      localStorage.setItem("school_holidays", JSON.stringify(defaultHolidays));
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date.trim() || !formData.day.trim()) return;

    // Build displayDate nicely
    let finalDisplayDate = formData.displayDate.trim();
    if (!finalDisplayDate) {
      const parsedDate = new Date(formData.date);
      finalDisplayDate = parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }

    const newHoliday = {
      name: formData.name.trim(),
      date: formData.date.trim(),
      displayDate: finalDisplayDate,
      day: formData.day.trim(),
      type: formData.type,
      duration: formData.duration.trim() || "1 Day",
      description: formData.description.trim() || "Academic holiday break."
    };

    const updatedHolidays = [...holidays, newHoliday].sort((a, b) => new Date(a.date) - new Date(b.date));
    setHolidays(updatedHolidays);
    localStorage.setItem("school_holidays", JSON.stringify(updatedHolidays));

    // Reset Form
    setFormData({
      name: "",
      date: "",
      displayDate: "",
      day: "",
      type: "National",
      duration: "1 Day",
      description: ""
    });
    setModalOpen(false);
    setSuccess("New academic holiday added successfully!");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleDeleteHoliday = (nameToDelete) => {
    if (!window.confirm("Are you sure you want to delete this holiday record?")) return;

    const updatedHolidays = holidays.filter(h => h.name !== nameToDelete);
    setHolidays(updatedHolidays);
    localStorage.setItem("school_holidays", JSON.stringify(updatedHolidays));
    setSuccess("Academic holiday successfully deleted.");
    setTimeout(() => setSuccess(""), 4000);
  };

  const filteredHolidays = filter === "all"
    ? holidays
    : holidays.filter(item => item.type.toLowerCase() === filter.toLowerCase());

  const getBadgeStyle = (type) => {
    switch (type.toLowerCase()) {
      case "national":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "festival":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "seasonal":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const splitDate = (dateStr) => {
    if (dateStr.includes("-")) {
      return { month: "SUMMER", day: "BREAK" };
    }
    const parts = dateStr.replace(",", "").split(" ");
    const month = parts[0] || "JAN";
    const day = parts[1] || "01";
    return { month: month.toUpperCase(), day };
  };

  // Counting dynamic stats
  const festivalCount = holidays.filter(h => h.type.toLowerCase() === "festival").length;
  const seasonalDays = holidays.reduce((acc, h) => {
    if (h.type.toLowerCase() === "seasonal") {
      const daysNum = parseInt(h.duration);
      return acc + (isNaN(daysNum) ? 1 : daysNum);
    }
    return acc;
  }, 0);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Academic Holiday Calendar</h2>
          <p className="text-zinc-400 text-sm">
            {isAdmin 
              ? "⚡ Administrator Privilege: Click to dynamically add or delete holiday events for the entire portal."
              : "Review upcoming national holidays, festival breaks, and seasonal vacations for 2026"}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="glow-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Add Holiday</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-indigo-500/20 bg-indigo-500/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Holidays</span>
            <h3 className="text-3xl font-extrabold text-white">{holidays.length} Events</h3>
          </div>
          <span className="text-xl">📅</span>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-purple-500/20 bg-purple-500/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Festival Holidays</span>
            <h3 className="text-3xl font-extrabold text-white">{festivalCount} Days</h3>
          </div>
          <span className="text-xl">✨</span>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-cyan-500/20 bg-cyan-500/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vacation Breaks</span>
            <h3 className="text-3xl font-extrabold text-white">{seasonalDays} Days</h3>
          </div>
          <span className="text-xl">☀️</span>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Academic Year</span>
            <h3 className="text-3xl font-extrabold text-white">2026</h3>
          </div>
          <span className="text-xl">🏫</span>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-2">Filter Holiday Categories:</span>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["all", "national", "festival", "seasonal", "gazetted"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                filter === cat
                  ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]"
                  : "border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Holidays Grid Display */}
      {filteredHolidays.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center flex flex-col gap-3 items-center justify-center border-dashed">
          <svg className="w-12 h-12 text-zinc-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4M2 17h20M12 17v4m-3 0h6" />
          </svg>
          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs select-none">No active holidays found</span>
          <p className="text-zinc-600 text-xs">There are no holidays registered matching your selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHolidays.map((holiday) => {
            const dateDetail = splitDate(holiday.displayDate);
            
            return (
              <div
                key={holiday.name}
                className="glass-card p-6 rounded-3xl flex items-center gap-6 group border-white/5 hover:border-indigo-500/20 relative overflow-hidden transition-all duration-300"
              >
                {/* Calendar Sheets Icon Badge */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/20 flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner select-none">
                  <span className="text-[8px] font-black text-indigo-400 tracking-wider uppercase mb-0.5">{dateDetail.month}</span>
                  <span className="text-xl font-black text-white leading-none tracking-tighter">{dateDetail.day}</span>
                </div>

                {/* Holiday Details */}
                <div className="flex flex-col gap-1.5 z-10 overflow-hidden flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden flex-wrap">
                      <h3 className="font-extrabold text-base text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors truncate">
                        {holiday.name}
                      </h3>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-full ${getBadgeStyle(holiday.type)}`}>
                        {holiday.type}
                      </span>
                    </div>

                    {/* Delete Option for Admin */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteHoliday(holiday.name)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Holiday"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    🕒 Duration: {holiday.duration} ({holiday.day})
                  </span>
                  
                  <p className="text-zinc-400 text-xs leading-relaxed mt-1 line-clamp-2">
                    {holiday.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Holiday Modal Form (Admin only) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Academic Calendar Holiday"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          
          {/* Holiday Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Holiday Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Independence Day, Eid Break"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              required
            />
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Calendar Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white"
              required
            />
          </div>

          {/* Optional Display Date (in case they want custom like range) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Display Date (Optional)</label>
            <input
              type="text"
              name="displayDate"
              value={formData.displayDate}
              onChange={handleInputChange}
              placeholder="e.g. Aug 15, 2026 (Leave blank to generate automatically)"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
            />
          </div>

          {/* Day & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Day of the Week</label>
              <input
                type="text"
                name="day"
                value={formData.day}
                onChange={handleInputChange}
                placeholder="e.g. Monday, Multiple"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g. 1 Day, 5 Days"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              />
            </div>
          </div>

          {/* Category selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Holiday Category</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white bg-[#09090b]"
            >
              <option value="National">National Holiday</option>
              <option value="Festival">Festival Break</option>
              <option value="Seasonal">Seasonal Vacation</option>
              <option value="Gazetted">Gazetted Leave</option>
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Description / Notes</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g. Celebrating sibling bonds where sisters tie safety threads (rakhi)..."
              rows="3"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium resize-none leading-relaxed"
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
              Add Holiday
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
