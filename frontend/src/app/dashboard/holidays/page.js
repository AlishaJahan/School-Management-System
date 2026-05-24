"use client";

import { useState } from "react";

export default function AcademicHolidays() {
  const [filter, setFilter] = useState("all");

  const holidaysList = [
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

  const filteredHolidays = filter === "all"
    ? holidaysList
    : holidaysList.filter(item => item.type.toLowerCase() === filter.toLowerCase());

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
    // If it's a range like "May 25 - Jun 30", get month as "Summer"
    if (dateStr.includes("-")) {
      return { month: "SUMMER", day: "BREAK" };
    }
    const [month, day] = dateStr.replace(",", "").split(" ");
    return { month: month.toUpperCase(), day };
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Academic Holiday Calendar</h2>
        <p className="text-zinc-400 text-sm">Review upcoming national holidays, festival breaks, and seasonal vacations for 2026</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-indigo-500/20 bg-indigo-500/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Holidays</span>
            <h3 className="text-3xl font-extrabold text-white">{holidaysList.length} Days</h3>
          </div>
          <span className="text-xl">📅</span>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-purple-500/20 bg-purple-500/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Festival Holidays</span>
            <h3 className="text-3xl font-extrabold text-white">5 Days</h3>
          </div>
          <span className="text-xl">✨</span>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-cyan-500/20 bg-cyan-500/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vacation Breaks</span>
            <h3 className="text-3xl font-extrabold text-white">41 Days</h3>
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
              <div className="flex flex-col gap-1.5 z-10 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-base text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors truncate">
                    {holiday.name}
                  </h3>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-full ${getBadgeStyle(holiday.type)}`}>
                    {holiday.type}
                  </span>
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

    </div>
  );
}
