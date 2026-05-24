"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function TeacherTimetable() {
  const [currentUser, setCurrentUser] = useState({ name: "Teacher", role: "teacher" });
  const [selectedTeacher, setSelectedTeacher] = useState("Alisha Jahan");
  const [teacherSubject, setTeacherSubject] = useState("Computer Science");
  const [success, setSuccess] = useState("");

  // Modal State for Editing Slot
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSlotKey, setEditSlotKey] = useState(""); // e.g. "Monday-p1"
  const [editDay, setEditDay] = useState("");
  const [editPeriodId, setEditPeriodId] = useState("");
  const [editPeriodName, setEditPeriodName] = useState("");

  const [formData, setFormData] = useState({
    grade: "",
    subject: "",
    room: "",
    color: "indigo",
    isFree: false
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  // 6 Lectures + 1 Lunch Break
  const periods = [
    { id: "p1", time: "09:00 AM - 10:00 AM", name: "1st Period" },
    { id: "p2", time: "10:00 AM - 11:00 AM", name: "2nd Period" },
    { id: "p3", time: "11:00 AM - 12:00 PM", name: "3rd Period" },
    { id: "break", time: "12:00 PM - 12:45 PM", name: "Lunch Break" },
    { id: "p4", time: "12:45 PM - 01:45 PM", name: "4th Period" },
    { id: "p5", time: "01:45 PM - 02:45 PM", name: "5th Period" },
    { id: "p6", time: "02:45 PM - 03:45 PM", name: "6th Period" }
  ];

  // Base Fallback Schedules
  const defaultCS = {
    "Monday-p1": { grade: "Class 10-A", subject: "Computer Science", room: "Lab 2", color: "indigo" },
    "Monday-p2": { grade: "Class 12-B", subject: "Web Development", room: "Lab 3", color: "violet" },
    "Monday-p3": { grade: "Class 11-A", subject: "Cyber Security", room: "Room 104", color: "cyan" },
    "Monday-p5": { grade: "Class 10-A", subject: "Python Coding", room: "Lab 2", color: "indigo" },
    "Monday-p6": { grade: "Class 12-B", subject: "Database Systems", room: "Lab 3", color: "violet" },
    "Tuesday-p1": { grade: "Class 11-A", subject: "Cyber Security", room: "Room 104", color: "cyan" },
    "Tuesday-p3": { grade: "Class 10-A", subject: "Computer Science", room: "Lab 2", color: "indigo" },
    "Tuesday-p4": { grade: "Class 12-B", subject: "Web Development", room: "Lab 3", color: "violet" },
    "Tuesday-p5": { grade: "Class 11-A", subject: "Python Coding", room: "Lab 2", color: "cyan" },
    "Tuesday-p6": { grade: "Class 10-A", subject: "Database Systems", room: "Lab 2", color: "indigo" },
    "Wednesday-p1": { grade: "Class 12-B", subject: "Web Development", room: "Lab 3", color: "violet" },
    "Wednesday-p2": { grade: "Class 10-A", subject: "Computer Science", room: "Lab 2", color: "indigo" },
    "Wednesday-p3": { grade: "Class 11-A", subject: "Cyber Security", room: "Room 104", color: "cyan" },
    "Wednesday-p4": { grade: "Class 10-A", subject: "Python Coding", room: "Lab 2", color: "indigo" },
    "Wednesday-p5": { grade: "Class 12-B", subject: "Database Systems", room: "Lab 3", color: "violet" },
    "Thursday-p2": { grade: "Class 12-B", subject: "Web Development", room: "Lab 3", color: "violet" },
    "Thursday-p3": { grade: "Class 11-A", subject: "Cyber Security", room: "Room 104", color: "cyan" },
    "Thursday-p4": { grade: "Class 10-A", subject: "Computer Science", room: "Lab 2", color: "indigo" },
    "Thursday-p5": { grade: "Class 11-A", subject: "Database Systems", room: "Lab 2", color: "cyan" },
    "Thursday-p6": { grade: "Class 12-B", subject: "Python Coding", room: "Lab 3", color: "violet" },
    "Friday-p1": { grade: "Class 10-A", subject: "Computer Science", room: "Lab 2", color: "indigo" },
    "Friday-p2": { grade: "Class 11-A", subject: "Cyber Security", room: "Room 104", color: "cyan" },
    "Friday-p3": { grade: "Class 12-B", subject: "Web Development", room: "Lab 3", color: "violet" },
    "Friday-p4": { grade: "Class 11-A", subject: "Database Systems", room: "Lab 2", color: "cyan" },
    "Friday-p6": { grade: "Class 10-A", subject: "Python Coding", room: "Lab 2", color: "indigo" }
  };

  const defaultMaths = {
    "Monday-p1": { grade: "Class 12-A", subject: "Calculus II", room: "Room 305", color: "emerald" },
    "Monday-p2": { grade: "Class 10-B", subject: "Core Algebra", room: "Room 204", color: "cyan" },
    "Monday-p4": { grade: "Class 11-B", subject: "Statistics", room: "Room 102", color: "indigo" },
    "Monday-p5": { grade: "Class 12-A", subject: "Linear Algebra", room: "Room 305", color: "emerald" },
    "Monday-p6": { grade: "Class 10-B", subject: "Geometry & Shapes", room: "Room 204", color: "cyan" },
    "Tuesday-p1": { grade: "Class 10-B", subject: "Core Algebra", room: "Room 204", color: "cyan" },
    "Tuesday-p2": { grade: "Class 11-B", subject: "Statistics", room: "Room 102", color: "indigo" },
    "Tuesday-p3": { grade: "Class 12-A", subject: "Calculus II", room: "Room 305", color: "emerald" },
    "Tuesday-p4": { grade: "Class 10-B", subject: "Geometry & Shapes", room: "Room 204", color: "cyan" },
    "Tuesday-p6": { grade: "Class 11-B", subject: "Linear Algebra", room: "Room 102", color: "indigo" },
    "Wednesday-p2": { grade: "Class 12-A", subject: "Calculus II", room: "Room 305", color: "emerald" },
    "Wednesday-p3": { grade: "Class 11-B", subject: "Statistics", room: "Room 102", color: "indigo" },
    "Wednesday-p4": { grade: "Class 10-B", subject: "Core Algebra", room: "Room 204", color: "cyan" },
    "Wednesday-p5": { grade: "Class 12-A", subject: "Linear Algebra", room: "Room 305", color: "emerald" },
    "Wednesday-p6": { grade: "Class 11-B", subject: "Geometry & Shapes", room: "Room 102", color: "indigo" },
    "Thursday-p1": { grade: "Class 11-B", subject: "Statistics", room: "Room 102", color: "indigo" },
    "Thursday-p2": { grade: "Class 10-B", subject: "Core Algebra", room: "Room 204", color: "cyan" },
    "Thursday-p3": { grade: "Class 12-A", subject: "Calculus II", room: "Room 305", color: "emerald" },
    "Thursday-p5": { grade: "Class 10-B", subject: "Linear Algebra", room: "Room 204", color: "cyan" },
    "Thursday-p6": { grade: "Class 12-A", subject: "Geometry & Shapes", room: "Room 305", color: "emerald" },
    "Friday-p1": { grade: "Class 12-A", subject: "Calculus II", room: "Room 305", color: "emerald" },
    "Friday-p3": { grade: "Class 10-B", subject: "Core Algebra", room: "Room 204", color: "cyan" },
    "Friday-p4": { grade: "Class 11-B", subject: "Statistics", room: "Room 102", color: "indigo" },
    "Friday-p5": { grade: "Class 12-A", subject: "Linear Algebra", room: "Room 305", color: "emerald" },
    "Friday-p6": { grade: "Class 10-B", subject: "Geometry & Shapes", room: "Room 204", color: "cyan" }
  };

  // State maps holding active modifications
  const [csSchedule, setCsSchedule] = useState({});
  const [mathsSchedule, setMathsSchedule] = useState({});

  // Drag and Drop active states
  const [draggedSlotKey, setDraggedSlotKey] = useState(null);
  const [dragOverSlotKey, setDragOverSlotKey] = useState(null);

  useEffect(() => {
    // 1. Get logged in user details
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        if (parsed.role === "teacher") {
          setSelectedTeacher(parsed.name);
          if (parsed.name.toLowerCase().includes("rohan")) {
            setTeacherSubject("Mathematics");
          } else {
            setTeacherSubject("Computer Science");
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Load custom persistent timetables from localStorage
    const savedCS = localStorage.getItem("custom_timetable_CS");
    if (savedCS) {
      setCsSchedule(JSON.parse(savedCS));
    } else {
      setCsSchedule(defaultCS);
    }

    const savedMaths = localStorage.getItem("custom_timetable_Maths");
    if (savedMaths) {
      setMathsSchedule(JSON.parse(savedMaths));
    } else {
      setMathsSchedule(defaultMaths);
    }
  }, []);

  // Update teacher subject when admin toggles the selected teacher
  useEffect(() => {
    if (selectedTeacher.toLowerCase().includes("rohan")) {
      setTeacherSubject("Mathematics");
    } else if (selectedTeacher.toLowerCase().includes("alisha")) {
      setTeacherSubject("Computer Science");
    } else {
      setTeacherSubject("Administration");
    }
  }, [selectedTeacher]);

  const getActiveSchedule = () => {
    return teacherSubject === "Mathematics" ? mathsSchedule : csSchedule;
  };

  const currentSchedule = getActiveSchedule();

  const handleCellClick = (day, periodId, slotData) => {
    // Only Admin has master credentials to edit timetables
    if (currentUser.role !== "admin") return;

    const periodName = periods.find(p => p.id === periodId)?.name || "Class Period";
    setEditSlotKey(`${day}-${periodId}`);
    setEditDay(day);
    setEditPeriodId(periodId);
    setEditPeriodName(periodName);

    setFormData({
      grade: slotData?.grade || "",
      subject: slotData?.subject || "",
      room: slotData?.room || "",
      color: slotData?.color || "indigo",
      isFree: !slotData
    });

    setEditModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSuccess("");

    const updatedSchedule = { ...currentSchedule };

    if (formData.isFree) {
      delete updatedSchedule[editSlotKey];
    } else {
      updatedSchedule[editSlotKey] = {
        grade: formData.grade,
        subject: formData.subject,
        room: formData.room,
        color: formData.color
      };
    }

    // Save state and persist in localStorage
    if (teacherSubject === "Mathematics") {
      setMathsSchedule(updatedSchedule);
      localStorage.setItem("custom_timetable_Maths", JSON.stringify(updatedSchedule));
    } else {
      setCsSchedule(updatedSchedule);
      localStorage.setItem("custom_timetable_CS", JSON.stringify(updatedSchedule));
    }

    setEditModalOpen(false);
    setSuccess(`Timetable slot for ${editDay} (${editPeriodName}) updated successfully!`);
    setTimeout(() => setSuccess(""), 4000);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, slotKey) => {
    if (currentUser.role !== "admin") return;
    setDraggedSlotKey(slotKey);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedSlotKey(null);
    setDragOverSlotKey(null);
  };

  const handleDragOver = (e, slotKey) => {
    if (currentUser.role !== "admin") return;
    e.preventDefault();
  };

  const handleDragEnter = (e, slotKey) => {
    if (currentUser.role !== "admin") return;
    setDragOverSlotKey(slotKey);
  };

  const handleDragLeave = (e, slotKey) => {
    if (currentUser.role !== "admin") return;
    if (dragOverSlotKey === slotKey) {
      setDragOverSlotKey(null);
    }
  };

  const handleDrop = (e, targetSlotKey) => {
    e.preventDefault();
    if (currentUser.role !== "admin") return;
    if (!draggedSlotKey || draggedSlotKey === targetSlotKey) {
      setDraggedSlotKey(null);
      setDragOverSlotKey(null);
      return;
    }

    const updatedSchedule = { ...currentSchedule };
    const sourceData = updatedSchedule[draggedSlotKey];
    const targetData = updatedSchedule[targetSlotKey];

    if (sourceData) {
      if (targetData) {
        // Swap slots
        updatedSchedule[targetSlotKey] = sourceData;
        updatedSchedule[draggedSlotKey] = targetData;
      } else {
        // Move slot and empty source
        updatedSchedule[targetSlotKey] = sourceData;
        delete updatedSchedule[draggedSlotKey];
      }

      // Save state and persist in localStorage
      if (teacherSubject === "Mathematics") {
        setMathsSchedule(updatedSchedule);
        localStorage.setItem("custom_timetable_Maths", JSON.stringify(updatedSchedule));
      } else {
        setCsSchedule(updatedSchedule);
        localStorage.setItem("custom_timetable_CS", JSON.stringify(updatedSchedule));
      }

      const sourceDay = draggedSlotKey.split("-")[0];
      const sourcePeriodId = draggedSlotKey.split("-")[1];
      const sourcePeriodName = periods.find(p => p.id === sourcePeriodId)?.name || "Period";
      
      const targetDay = targetSlotKey.split("-")[0];
      const targetPeriodId = targetSlotKey.split("-")[1];
      const targetPeriodName = periods.find(p => p.id === targetPeriodId)?.name || "Period";

      setSuccess(`Moved schedule from ${sourceDay} (${sourcePeriodName}) to ${targetDay} (${targetPeriodName}) successfully!`);
      setTimeout(() => setSuccess(""), 4000);
    }

    setDraggedSlotKey(null);
    setDragOverSlotKey(null);
  };

  const colorClasses = {
    indigo: "from-indigo-500/20 to-indigo-600/20 text-indigo-300 border-indigo-500/30 shadow-indigo-500/5",
    violet: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30 shadow-violet-500/5",
    cyan: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30 shadow-cyan-500/5",
    emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30 shadow-emerald-500/5"
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Academic Timetable</h2>
          <p className="text-zinc-400 text-sm">
            {currentUser.role === "admin" 
              ? "⚡ Administrator Privilege Mode: Click on any period slot to edit or custom configure teacher schedules." 
              : "Review weekly period routing, classroom assignments, and timing matrices"}
          </p>
        </div>

        {/* Admin Filter Controls */}
        {currentUser.role === "admin" && (
          <div className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-3 border border-white/5 bg-white/[0.01]">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Teacher:</span>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="bg-[#09090b] text-sm text-cyan-300 font-bold border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 transition-colors animate-pulse"
            >
              <option value="Alisha Jahan">Alisha Jahan (CS)</option>
              <option value="Rohan Sharma">Rohan Sharma (Maths)</option>
            </select>
          </div>
        )}
      </div>

      {/* Success Notifications */}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-semibold animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Info card display */}
      <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-indigo-500/20 bg-indigo-500/5 shadow-inner">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
            {teacherSubject.substring(0, 1)}
          </div>
          <div>
            <h4 className="font-extrabold text-lg text-white">Active Schedule: {selectedTeacher}</h4>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                📚 Base Department: {teacherSubject}
              </span>
              <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                ⚡ Status: 6 Lectures + Lunch Break
              </span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-xs text-zinc-400 font-semibold pr-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Class 10-A/B</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span>Class 12-A/B</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>Class 11-A/B</span>
          </div>
        </div>
      </div>

      {/* Premium Weekly Grid */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-2xl relative border-white/5">
        <div className="overflow-x-auto">
          <div className="min-w-[950px] grid grid-cols-8 divide-x divide-white/5 text-center">
            
            {/* Header Columns */}
            <div className="bg-white/[0.02] py-5 font-extrabold text-xs text-zinc-400 uppercase tracking-widest flex items-center justify-center">
              🏫 Weekly Days
            </div>
            {periods.map((period) => (
              <div 
                key={period.id} 
                className={`bg-white/[0.02] py-4 px-2 flex flex-col items-center justify-center gap-1 border-b border-white/5 ${
                  period.id === 'break' ? 'opacity-50' : ''
                }`}
              >
                <span className="font-extrabold text-[10px] text-indigo-400 uppercase tracking-wider">{period.name}</span>
                <span className="text-[10px] text-zinc-400 font-medium font-mono">{period.time}</span>
              </div>
            ))}

            {/* Timetable grid rows */}
            {days.map((day) => (
              <div key={day} className="contents divide-y divide-white/5">
                {/* Day name column */}
                <div className="py-8 bg-white/[0.01] font-bold text-sm text-zinc-300 flex items-center justify-center border-b border-white/5">
                  {day}
                </div>

                {/* Period slots */}
                {periods.map((period) => {
                  if (period.id === "break") {
                    return (
                      <div 
                        key={`${day}-${period.id}`} 
                        className="bg-zinc-950/25 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest text-zinc-500 border-b border-white/5 select-none"
                      >
                        🍱 Lunch Break
                      </div>
                    );
                  }

                  const slotKey = `${day}-${period.id}`;
                  const slotData = currentSchedule[slotKey];
                  const isDragOver = dragOverSlotKey === slotKey;
                  const isDragged = draggedSlotKey === slotKey;

                  return (
                    <div 
                      key={slotKey} 
                      onClick={() => handleCellClick(day, period.id, slotData)}
                      onDragOver={(e) => handleDragOver(e, slotKey)}
                      onDragEnter={(e) => handleDragEnter(e, slotKey)}
                      onDragLeave={(e) => handleDragLeave(e, slotKey)}
                      onDrop={(e) => handleDrop(e, slotKey)}
                      className={`p-3.5 flex items-center justify-center border-b border-white/5 min-h-[125px] transition-all duration-300 relative ${
                        currentUser.role === "admin" 
                          ? "cursor-pointer hover:bg-white/[0.01]" 
                          : ""
                      } ${
                        isDragOver 
                          ? "border-dashed border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 scale-[1.03] z-10" 
                          : ""
                      }`}
                      title={currentUser.role === "admin" ? "Click to configure or drag to rearrange this slot" : ""}
                    >
                      {slotData ? (
                        <div 
                          draggable={currentUser.role === "admin"}
                          onDragStart={(e) => handleDragStart(e, slotKey)}
                          onDragEnd={handleDragEnd}
                          className={`w-full h-full p-4 rounded-2xl bg-gradient-to-br ${colorClasses[slotData.color]} border shadow-md flex flex-col gap-1 items-center justify-center text-center animate-fade-in group transition-all duration-300 ${
                            currentUser.role === "admin" ? "cursor-grab active:cursor-grabbing" : ""
                          } ${
                            isDragged ? "opacity-30 scale-95" : "hover:scale-[1.03]"
                          }`}
                        >
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            {slotData.grade}
                          </span>
                          <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-0.5">
                            {slotData.subject}
                          </span>
                          <span className="text-[9px] font-semibold opacity-60 font-mono mt-1.5 flex items-center gap-1">
                            📍 {slotData.room}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-2xl border border-dashed border-white/5 bg-white/[0.005] flex items-center justify-center min-h-[90px] transition-all">
                          <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-wider select-none">
                            Free Period
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Admin Privilege Slot Configuration Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Configure Timetable Slot: ${editDay} (${editPeriodName})`}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          
          {/* Free / Empty Period Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.01]">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isFree: !formData.isFree })}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                formData.isFree
                  ? "bg-rose-500 border-rose-400 text-white"
                  : "border-white/10 hover:border-rose-500/50"
              }`}
            >
              {formData.isFree && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span 
              onClick={() => setFormData({ ...formData, isFree: !formData.isFree })}
              className="text-xs font-bold text-zinc-300 cursor-pointer"
            >
              Set this slot as a FREE / EMPTY PERIOD
            </span>
          </div>

          {!formData.isFree && (
            <>
              {/* Class/Grade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Target Class/Grade</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="e.g. Class 10-A"
                  className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                  required
                />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Assigned Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Web Development"
                  className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                  required
                />
              </div>

              {/* Room/Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Classroom / Laboratory</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g. Lab 3"
                  className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                  required
                />
              </div>

              {/* Theme Color */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Visual Theme Color</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white bg-[#09090b]"
                >
                  <option value="indigo">Indigo Blue</option>
                  <option value="violet">Violet Purple</option>
                  <option value="cyan">Teal Cyan</option>
                  <option value="emerald">Emerald Green</option>
                </select>
              </div>
            </>
          )}

          {/* Modal Footer actions */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="flex-1 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              Save Slot Schedule
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
