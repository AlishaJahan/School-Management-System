"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardCard from "../../components/DashboardCard";

export default function DashboardOverview() {
  const [currentUser, setCurrentUser] = useState({ name: "Administrator", role: "admin" });
  const [counts, setCounts] = useState({ students: 5, teachers: 4 });

  // Interactive To-Do List State
  const [todoInput, setTodoInput] = useState("");
  const [todos, setTodos] = useState([
    { id: 1, text: "Verify teacher attendance registry for today", completed: true },
    { id: 2, text: "Submit Class 12-B Database Systems grade files", completed: false },
    { id: 3, text: "Organize CS Lab 2 network setups for Class 10-A", completed: false },
    { id: 4, text: "Publish Summer Vacation official school notice", completed: false }
  ]);

  useEffect(() => {
    // 1. Get logged in user details
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Proactively try fetching stats from Express backend
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch Students list to get count
        const sRes = await fetch("http://localhost:5000/api/students", { headers });
        const students = await sRes.json();
        
        // Fetch Teachers list to get count (only allowed for admins, so handle role)
        let teachers = [];
        const userObj = savedUser ? JSON.parse(savedUser) : {};
        if (userObj.role === "admin") {
          const tRes = await fetch("http://localhost:5000/api/teachers", { headers });
          teachers = await tRes.json();
        } else {
          // If teacher logged in, fall back to seed count
          teachers = [{}, {}, {}, {}];
        }

        if (Array.isArray(students) && Array.isArray(teachers)) {
          setCounts({
            students: students.length,
            teachers: teachers.length
          });
        }
      } catch (err) {
        console.log("Database fetch failed. Using fallback seed counts:", err.message);
      }
    };

    fetchStats();
  }, []);

  // Handler for Interactive To-Do Checklist
  const handleToggleTodo = (id) => {
    setTodos(prev =>
      prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo)
    );
  };

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!todoInput.trim()) return;

    setTodos(prev => [
      ...prev,
      { id: Date.now(), text: todoInput.trim(), completed: false }
    ]);
    setTodoInput("");
  };

  const handleDeleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome back, {currentUser.name}
        </h2>
        <p className="text-zinc-400 text-sm">
          Here is a premium breakdown of your academic system status today.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Enrolled Students"
          value={counts.students}
          change="8.2%"
          color="indigo"
          icon={
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <DashboardCard
          title="Specialized Teachers"
          value={counts.teachers}
          change="3.4%"
          color="cyan"
          icon={
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <DashboardCard
          title="Attendance Rate"
          value="96.2%"
          change="1.1%"
          color="emerald"
          icon={
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <DashboardCard
          title="Active Classes"
          value="14"
          change="16.7%"
          color="violet"
          icon={
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* NEW replacement section: Quick Shortcuts & Actions panel */}
      <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
        <div>
          <h4 className="text-lg font-bold text-zinc-100">Quick Administrative Shortcuts</h4>
          <p className="text-xs text-zinc-400">Directly jump to active school registries and schedules</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-1.5">
          <Link
            href="/dashboard/attendance"
            className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all"
          >
            📋 Mark Attendance
          </Link>
          <Link
            href="/dashboard/students"
            className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all"
          >
            🎓 Manage Students
          </Link>
          <Link
            href="/dashboard/timetable"
            className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all"
          >
            📅 View Timetable
          </Link>
          <Link
            href="/dashboard/holidays"
            className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group transition-all"
          >
            ☀️ Holiday Calendar
          </Link>
        </div>
      </div>

      {/* Grid: Announcement Notice Board on left, Interactive Planner on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Notice Board / Circulars */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
          <div>
            <h4 className="text-lg font-bold text-zinc-100">📢 Official Notice Board</h4>
            <p className="text-xs text-zinc-400">Academic updates, exams, and circular announcements</p>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Notice 1 */}
            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-16 h-16 rounded-full bg-cyan-500/5 blur-xl group-hover:scale-150 transition-all" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 uppercase tracking-widest">
                  Important
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold font-mono">May 24, 2026</span>
              </div>
              <h5 className="font-bold text-sm text-zinc-100 group-hover:text-cyan-300 transition-colors">
                Final Term Exams Schedule Released
              </h5>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Academic term exams are scheduled to commence from June 10, 2026. The detailed subject matrix has been published inside classroom desks.
              </p>
            </div>

            {/* Notice 2 */}
            <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-16 h-16 rounded-full bg-purple-500/5 blur-xl group-hover:scale-150 transition-all" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 uppercase tracking-widest">
                  Events
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold font-mono">May 22, 2026</span>
              </div>
              <h5 className="font-bold text-sm text-zinc-100 group-hover:text-purple-300 transition-colors">
                Annual Science & Coding Exhibition
              </h5>
              <p className="text-zinc-400 text-xs leading-relaxed">
                EduPrime is hosting the Annual Science & Python Coding Hackathon on May 29. Teachers are requested to submit team participant roll records.
              </p>
            </div>

          </div>
        </div>

        {/* Interactive To-Do Planner */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border-white/5">
          <div>
            <h4 className="text-lg font-bold text-zinc-100">📋 Institutional To-Do Planner</h4>
            <p className="text-xs text-zinc-400">Track and manage your administrative tasks interactively</p>
          </div>

          {/* Form to Add Task */}
          <form onSubmit={handleAddTodo} className="flex gap-2.5">
            <input
              type="text"
              placeholder="e.g. Prepare Math exam papers..."
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              className="glass-input px-4 py-3 text-xs font-semibold w-full"
              required
            />
            <button
              type="submit"
              className="glow-btn px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex-shrink-0"
            >
              Add Task
            </button>
          </form>

          {/* Checklist Area */}
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {todos.length === 0 ? (
              <span className="text-zinc-600 text-center text-xs py-10 font-bold uppercase tracking-widest select-none">
                No active tasks found
              </span>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-3.5 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-3 group transition-all ${
                    todo.completed ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Circle checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(todo.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? "bg-indigo-500 border-indigo-400 text-white"
                          : "border-white/10 hover:border-indigo-500/50"
                      }`}
                    >
                      {todo.completed && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span
                      onClick={() => handleToggleTodo(todo.id)}
                      className={`text-xs font-semibold text-zinc-300 truncate cursor-pointer hover:text-white transition-colors ${
                        todo.completed ? "line-through text-zinc-500" : ""
                      }`}
                    >
                      {todo.text}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
