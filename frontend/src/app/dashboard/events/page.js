"use client";

import { useEffect, useState } from "react";

export default function EventsManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Events list
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Student certificates
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null); // active certificate modal

  // Teacher/Admin Event Creator Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Teacher/Admin Attendance Sheet states
  const [selectedEventId, setSelectedEventId] = useState("");
  const [attendanceSheet, setAttendanceSheet] = useState(null); // event + registrations
  const [sheetLoading, setSheetLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        fetchEvents(parsedUser);
        if (parsedUser.role === "student") {
          fetchCertificates();
        }
      } catch (e) {
        console.error("Error loading user context:", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchEvents = async (userContext) => {
    setEventsLoading(true);
    setError("");
    const user = userContext || currentUser;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/events", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUpcomingEvents(data.upcoming || []);
        setPastEvents(data.past || []);
      } else {
        setError("Failed to load school events catalog.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching events.");
    } finally {
      setEventsLoading(false);
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    setCertificatesLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/events/my-certificates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCertificatesLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccess("Success! You have registered for this event.");
        fetchEvents();
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to register.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issue registering for event.");
    }
  };

  const handleUnregister = async (eventId) => {
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/unregister`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccess("Registration cancelled successfully.");
        fetchEvents();
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to cancel registration.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issue cancelling registration.");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !description || !eventDate || !location) {
      setError("All event parameters are required.");
      return;
    }

    setCreateLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, event_date: eventDate, location })
      });

      if (res.ok) {
        setSuccess(`Event "${title}" has been successfully scheduled and published!`);
        setTitle("");
        setDescription("");
        setEventDate("");
        setLocation("");
        fetchEvents();
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to publish event.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issue publishing event.");
    } finally {
      setCreateLoading(false);
    }
  };

  const loadAttendanceSheet = async (eventId) => {
    if (!eventId) {
      setAttendanceSheet(null);
      return;
    }
    setSheetLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAttendanceSheet(data);
      } else {
        setError("Failed to fetch event registrations sheet.");
      }
    } catch (err) {
      console.error(err);
      setError("Network issue loading registrations.");
    } finally {
      setSheetLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    if (!selectedEventId) return;
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/events/${selectedEventId}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, status })
      });

      if (res.ok) {
        // Refresh attendance sheet
        loadAttendanceSheet(selectedEventId);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to update attendance.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error updating attendance status.");
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-zinc-400 font-semibold text-sm">Synchronizing institutional events calendars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full print:p-0 print:m-0">
      {/* Header Banner - hidden on print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-zinc-900/50 to-zinc-950/30 backdrop-blur-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Events & Credentials</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">EduPrime Event Center</h2>
          <p className="text-sm text-zinc-400">
            {currentUser?.role === "student"
              ? "Sign up for upcoming seminars and track your attendance. Attended events generate official digital certificates."
              : "Publish educational events, track registrations, and manage student attendance logs."}
          </p>
        </div>
      </div>

      {/* Notifications - hidden on print */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in print:hidden">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in print:hidden">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* STUDENT PORTAL VIEWS */}
      {currentUser?.role === "student" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 print:hidden">
          
          {/* 1. Upcoming Events Catalog */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="glass-card p-6 rounded-2xl border border-white/5 bg-zinc-900/5 flex flex-col gap-4">
              <h3 className="text-xl font-bold text-white leading-none">Upcoming Events</h3>
              <p className="text-xs text-zinc-500 mt-1">Register for active school events to secure your slot.</p>
            </div>

            {eventsLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="p-8 border border-white/5 bg-white/[0.01] rounded-3xl text-zinc-500 text-center text-xs">
                No upcoming events scheduled currently.
              </div>
            ) : (
              <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {upcomingEvents.map((ev) => (
                  <div key={ev.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white leading-snug">{ev.title}</h4>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span>📅 Date: {new Date(ev.event_date).toLocaleDateString()}</span>
                          <span>📍 Location: {ev.location}</span>
                        </div>
                      </div>

                      {ev.is_registered === 1 ? (
                        <button
                          onClick={() => handleUnregister(ev.id)}
                          className="px-4 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl transition-all cursor-pointer w-fit"
                        >
                          Cancel Registration
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(ev.id)}
                          className="px-4 py-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded-xl transition-all cursor-pointer w-fit"
                        >
                          Register Slot
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-zinc-300 leading-relaxed font-semibold">
                      {ev.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Certificates & Attendance History Cabinet */}
          <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-white leading-none">Attendance & Certificate Cabinet</h3>
              <p className="text-xs text-zinc-500 mt-1">Claim certificates for events you attended (marked Present).</p>
            </div>

            {certificatesLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-zinc-500 text-xs flex flex-col gap-2">
                <span className="text-2xl">📜</span>
                <p>No certificates earned yet. Attend scheduled events to generate credentials.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {certificates.map((cert, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{cert.title}</h4>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">
                        Attended: {new Date(cert.event_date).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedCertificate(cert)}
                      className="glow-btn py-2 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/5"
                    >
                      <span>Claim Certificate</span>
                      <span>📜</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TEACHER & ADMIN PORTAL VIEWS */}
      {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 print:hidden">
          
          {/* 1. Left Column: Publish Event Form */}
          <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md relative overflow-hidden flex flex-col gap-6 h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold text-white">Publish School Event</h3>
              <p className="text-xs text-zinc-500 mt-1">Schedule new academic seminars, sports meets, or exhibitions.</p>
            </div>

            <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Inter-School Hackathon"
                  className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Location / Venue</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Auditorium Hall"
                    className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pl-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed description regarding event contents, prizes, guidelines, etc."
                  className="glass-input px-4 py-3.5 text-sm font-semibold w-full text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none min-h-[120px]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="glow-btn py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                {createLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                    <span>Publishing Event...</span>
                  </>
                ) : (
                  <span>Publish Event & Open Registration</span>
                )}
              </button>
            </form>
          </div>

          {/* 2. Right Column: Event Attendance Checkboard */}
          <div className="lg:col-span-3 glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/5 backdrop-blur-md flex flex-col gap-6">
            <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white leading-none">Attendance Registry</h3>
                <p className="text-xs text-zinc-500 mt-1">Select an event to view registrations and check student presence.</p>
              </div>

              {/* Event Selector */}
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  loadAttendanceSheet(e.target.value);
                }}
                className="glass-input px-4 py-2 text-xs font-bold text-white bg-zinc-950/60 border border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none min-w-[200px]"
              >
                <option value="" className="bg-zinc-950 text-zinc-500">Select Event</option>
                <optgroup label="Upcoming Events" className="bg-zinc-950 font-bold text-cyan-400">
                  {upcomingEvents.map(e => (
                    <option key={e.id} value={e.id} className="text-white font-semibold">
                      {e.title} ({new Date(e.event_date).toLocaleDateString()})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Past Events" className="bg-zinc-950 font-bold text-zinc-500">
                  {pastEvents.map(e => (
                    <option key={e.id} value={e.id} className="text-white font-semibold">
                      {e.title} ({new Date(e.event_date).toLocaleDateString()})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {sheetLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </div>
            ) : attendanceSheet ? (
              <div className="flex flex-col gap-5">
                <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-xs text-zinc-300">
                  <h4 className="font-bold text-indigo-300 mb-0.5">{attendanceSheet.event.title}</h4>
                  <p>📍 {attendanceSheet.event.location} | 📅 {new Date(attendanceSheet.event.event_date).toLocaleDateString()}</p>
                </div>

                {attendanceSheet.registrations.length === 0 ? (
                  <div className="p-6 text-zinc-500 border border-white/5 bg-white/[0.01] rounded-xl text-center text-xs">
                    No student registrations recorded for this event.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                    {attendanceSheet.registrations.map((reg) => (
                      <div key={reg.student_id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                          <h4 className="text-sm font-bold text-white">{reg.student_name}</h4>
                          <span className="text-[10px] text-zinc-500 block mt-0.5 font-mono">
                            Roll: {reg.roll_no} | Class: {reg.class_grade}
                          </span>
                        </div>

                        {/* Present / Absent / Registered Toggles */}
                        <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-xl border border-white/5">
                          {["registered", "present", "absent"].map((statusOption) => {
                            const isCurrent = reg.attendance_status === statusOption;
                            let activeClass = "text-zinc-500 hover:text-zinc-300";
                            
                            if (isCurrent) {
                              if (statusOption === "registered") activeClass = "bg-white/5 text-zinc-300 border border-white/10";
                              if (statusOption === "present") activeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                              if (statusOption === "absent") activeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                            }

                            return (
                              <button
                                key={statusOption}
                                onClick={() => handleMarkAttendance(reg.student_id, statusOption)}
                                className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition-all capitalize cursor-pointer ${activeClass}`}
                              >
                                {statusOption === "registered" ? "Pending" : statusOption}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-center text-zinc-500 gap-2 text-xs">
                <span>📋</span>
                <p>Choose a school event from the dropdown filter to view registrations and check attendance sheets.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* DYNAMIC DIGITAL CERTIFICATE VIEW / OVERLAY MODAL */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0">
          
          {/* Certificate Container */}
          <div className="w-full max-w-3xl glass-card border-4 border-amber-500/40 p-10 md:p-14 rounded-3xl relative overflow-hidden animate-zoom-in bg-zinc-950 flex flex-col items-center text-center shadow-2xl shadow-amber-500/5 print:border-amber-600 print:bg-white print:shadow-none print:w-full print:h-full print:rounded-none">
            
            {/* Ambient glows - hidden on print */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />

            {/* Close Button - hidden on print */}
            <button
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-xl border border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all print:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Certificate Body Content */}
            <div className="flex flex-col items-center w-full">
              
              {/* Crest Badge */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg border-2 border-amber-400 mb-6 print:border-amber-600">
                <span className="font-extrabold text-zinc-950 text-xl">EP</span>
              </div>

              <span className="text-xs font-black uppercase text-amber-500 tracking-widest pl-1 select-none print:text-amber-600">
                EduPrime International School
              </span>
              
              <h1 className="text-3xl md:text-4xl font-serif text-white font-extrabold mt-4 tracking-wide print:text-zinc-900">
                Certificate of Participation
              </h1>
              
              <div className="h-0.5 w-32 bg-amber-500/40 my-6 print:bg-amber-600" />
              
              <p className="text-zinc-400 text-sm italic print:text-zinc-600">
                This official credential certifies that
              </p>
              
              <h2 className="text-2xl md:text-3xl font-black text-zinc-100 font-serif mt-3 tracking-wide capitalize print:text-zinc-850">
                {selectedCertificate.student_name}
              </h2>
              
              <p className="text-zinc-400 text-sm max-w-lg mt-4 leading-relaxed pl-1 print:text-zinc-650">
                has successfully registered for and actively participated in the institutional event
                <strong className="block text-white font-extrabold mt-1 text-base print:text-zinc-900">
                  "{selectedCertificate.title}"
                </strong>
                which took place on <span className="font-semibold text-zinc-300 print:text-zinc-800">{new Date(selectedCertificate.event_date).toLocaleDateString()}</span> at the venue <span className="font-semibold text-zinc-300 print:text-zinc-850">{selectedCertificate.location}</span>.
              </p>

              {/* Signature and Verification Details */}
              <div className="grid grid-cols-2 gap-8 w-full max-w-lg mt-10 md:mt-12 items-end border-t border-white/5 pt-6 print:border-zinc-200">
                
                {/* Verification Code */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verify ID Key</span>
                  <span className="text-[10px] font-bold font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 mt-1 block select-all print:bg-zinc-100 print:text-zinc-800 print:border-zinc-200">
                    {selectedCertificate.verification_code}
                  </span>
                </div>

                {/* Signature */}
                <div className="flex flex-col items-center">
                  {/* Mock handwritten sig */}
                  <span className="font-serif italic text-amber-500 text-lg tracking-wide select-none print:text-amber-700">
                    Alisha Jahan
                  </span>
                  <div className="h-[1px] w-24 bg-zinc-600 mt-1 print:bg-zinc-400" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1 block">
                    System Principal
                  </span>
                </div>
              </div>
            </div>

            {/* Print & Download Action panel - hidden on print */}
            <div className="flex gap-3 mt-10 md:mt-12 w-full max-w-xs justify-center print:hidden">
              <button
                onClick={triggerPrint}
                className="glow-btn flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-955 font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer text-zinc-950"
              >
                <span>Print Certificate</span>
                <span>🖨️</span>
              </button>

              <button
                onClick={() => setSelectedCertificate(null)}
                className="py-3 px-5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-xs font-semibold"
              >
                Close Cabinet
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
