"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({ name: "Administrator", role: "admin", email: "admin@school.com" });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalTab, setModalTab] = useState("summary"); // "summary", "change-pass", "forget-pass"
  
  // State for password fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  
  // Notification states
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing user from localStorage");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems = [
    {
      name: "Dashboard Overview",
      path: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "AI Performance Insights",
      path: "/dashboard/insights",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student"]
    },
    {
      name: "AI Homework Assistant",
      path: "/dashboard/homework-assistant",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
        </svg>
      ),
      roles: ["admin", "teacher", "student"]
    },
    {
      name: "Manage Students",
      path: "/dashboard/students",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      roles: ["admin", "teacher"]
    },
    {
      name: "My Timetable",
      path: "/dashboard/timetable",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      roles: ["admin", "teacher"]
    },
    {
      name: user.role === "student" ? "My Attendance" : "Mark Attendance",
      path: "/dashboard/attendance",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      roles: ["admin", "teacher", "student"]
    },
    {
      name: user.role === "parent" ? "Teacher Messages" : "Parent Messages",
      path: "/dashboard/messages",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      roles: ["admin", "teacher", "parent"]
    },
    {
      name: "School Holidays",
      path: "/dashboard/holidays",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student"]
    },
    {
      name: "Notice Board",
      path: "/dashboard/notices",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      roles: ["admin", "teacher", "student"]
    },
    {
      name: "Emergency Alerts",
      path: "/dashboard/alerts",
      icon: (
        <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "Study Resources",
      path: "/dashboard/resources",
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "Career Guidance",
      path: "/dashboard/career",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "Leaderboards & Badges",
      path: "/dashboard/leaderboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm-2 4h4M5 7h14a2 2 0 012 2v2a7 7 0 01-14 0V9a2 2 0 012-2z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "Leave Requests",
      path: "/dashboard/leave",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "Performance Analytics",
      path: "/dashboard/performance",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student"]
    },
    {
      name: "AI Report Card",
      path: "/dashboard/report-card",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2zM5 18h.01M5 14h.01M5 10h.01" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "Complaints & Suggestions",
      path: "/dashboard/complaints",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      roles: ["admin", "student"]
    },
    {
      name: "Event Management",
      path: "/dashboard/events",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student"]
    },
    {
      name: "Online Exams",
      path: "/dashboard/exams",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2zM5 18h.01M5 14h.01M5 10h.01" />
        </svg>
      ),
      roles: ["admin", "teacher", "student"]
    },
    {
      name: "Skill Profile",
      path: "/dashboard/skills",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "Discussion Forum",
      path: "/dashboard/discussions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      roles: ["admin", "teacher", "student", "parent"]
    },
    {
      name: "Manage Teachers",
      path: "/dashboard/teachers",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      roles: ["admin"]
    }
  ];

  // Check if current user role permits viewing the item
  const allowedNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-72 glass-card border-y-0 border-l-0 min-h-screen flex flex-col justify-between py-8 px-6 z-10">
      <div className="flex flex-col gap-10">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-white text-lg">EP</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">EduPrime</h1>
            <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Portal</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-inner"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
                {isActive && (
                  <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-400 to-cyan-400 ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="flex flex-col gap-6 pt-6 border-t border-white/5">
        <div 
          onClick={() => {
            setShowProfileModal(true);
            setModalTab("summary");
            setResetEmail(user.email || "");
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 cursor-pointer transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-bold uppercase group-hover:border-indigo-400/50 transition-colors flex-shrink-0">
            {user.name ? user.name.substring(0, 2) : "US"}
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="font-semibold text-sm text-zinc-100 truncate group-hover:text-indigo-300 transition-colors">{user.name}</h4>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">{user.role}</span>
          </div>
          <svg className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all duration-300 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>

      {/* Premium Profile Modal Overlay */}
      {showProfileModal && (() => {
        const getProfileSummary = () => {
          const roleLower = user.role?.toLowerCase() || "admin";
          const emailLower = user.email?.toLowerCase() || "admin@school.com";
          
          if (roleLower === "admin") {
            return {
              title: "System Administrator Credentials",
              joined: "August 15, 2024",
              department: "IT Management & Operations",
              specialty: "Full System Master Read/Write, SQL Engine Console",
              phone: "+91 90001 10001",
              employeeId: "ADM-2024-001"
            };
          } else if (roleLower === "teacher") {
            const isAlisha = emailLower.includes("alisha");
            return {
              title: "Senior Academic Faculty Profile",
              joined: "June 12, 2024",
              department: isAlisha ? "Computer Science Department" : "Mathematics Department",
              specialty: isAlisha ? "Full-Stack Web Dev & Cyber Security" : "Applied Calculus & Algebra",
              phone: isAlisha ? "+91 98765 43210" : "+91 99988 87776",
              employeeId: isAlisha ? "EMP-2024-042" : "EMP-2024-089"
            };
          } else {
            // Student details
            const isRahul = emailLower.includes("rahul");
            return {
              title: "Academic Student Profile",
              joined: "April 02, 2025",
              department: "Science & IT Stream",
              specialty: isRahul ? "Computer Science Elective" : "Applied Mathematics Elective",
              employeeId: isRahul ? "STU-2026-001" : "STU-2026-002",
              rollNo: isRahul ? "STU-2026-001" : "STU-2026-002",
              classGrade: isRahul ? "Class 12-A" : "Class 12-B",
              parents: isRahul ? "Mr. & Mrs. Verma" : "Mr. & Mrs. Khan"
            };
          }
        };

        const profileData = getProfileSummary();

        const cardColors = {
          emerald: "from-emerald-500/10 to-emerald-600/10 text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
          indigo: "from-indigo-500/10 to-indigo-600/10 text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
          cyan: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
          violet: "from-violet-500/10 to-purple-500/10 text-violet-400 border-violet-500/20 bg-violet-500/5",
          rose: "from-rose-500/10 to-pink-500/10 text-rose-400 border-rose-500/20 bg-rose-500/5"
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            {/* Modal Card Box */}
            <div className="glass-card w-full max-w-xl p-8 rounded-3xl relative overflow-hidden animate-zoom-in border-indigo-500/20 max-h-[90vh] overflow-y-auto">
              {/* Ambient blurs */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500/30 text-indigo-300 font-extrabold text-xl uppercase shadow-md shadow-indigo-500/10">
                    {user.name ? user.name.substring(0, 2) : "US"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white leading-tight">{user.name}</h3>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">{user.role} Dashboard Profile</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setModalSuccess("");
                    setModalError("");
                    setCurrentPass("");
                    setNewPass("");
                    setConfirmPass("");
                  }}
                  className="w-9 h-9 rounded-xl border border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs Selector Navigation */}
              <div className="flex border-b border-white/5 mb-6 gap-2">
                <button
                  onClick={() => { setModalTab("summary"); setModalSuccess(""); setModalError(""); }}
                  className={`pb-3 px-2 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                    modalTab === "summary" ? "border-indigo-400 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Profile Summary
                </button>
                <button
                  onClick={() => { setModalTab("change-pass"); setModalSuccess(""); setModalError(""); }}
                  className={`pb-3 px-2 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                    modalTab === "change-pass" ? "border-indigo-400 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={() => { setModalTab("forget-pass"); setModalSuccess(""); setModalError(""); setResetEmail(user.email || ""); }}
                  className={`pb-3 px-2 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                    modalTab === "forget-pass" ? "border-indigo-400 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Forgot Password
                </button>
              </div>

              {/* Notifications panel inside modal */}
              {modalSuccess && (
                <div className="p-4 mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-fade-in flex items-center gap-2.5">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{modalSuccess}</span>
                </div>
              )}
              {modalError && (
                <div className="p-4 mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold animate-fade-in flex items-center gap-2.5">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{modalError}</span>
                </div>
              )}

              {/* TAB 1 CONTENT: PROFILE DETAILS SUMMARY */}
              {modalTab === "summary" && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3 pl-1">
                      {profileData.title}
                    </span>
                    
                    {/* Detailed Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Full Username</span>
                        <span className="text-sm font-semibold text-white">{user.name}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</span>
                        <span className="text-sm font-semibold text-zinc-300 truncate">{user.email || "admin@school.com"}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Joined Date</span>
                        <span className="text-sm font-semibold text-zinc-300">{profileData.joined}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Department</span>
                        <span className="text-sm font-semibold text-zinc-300">{profileData.department}</span>
                      </div>
                      
                      {/* Role Dependent Fields */}
                      {user.role?.toLowerCase() === "student" ? (
                        <>
                          <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Student ID / Roll No</span>
                            <span className="text-sm font-semibold text-indigo-300 font-mono">{profileData.rollNo}</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Enrolled Classroom</span>
                            <span className="text-sm font-semibold text-zinc-300">{profileData.classGrade}</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5 sm:col-span-2">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Parents / Guardians</span>
                            <span className="text-sm font-semibold text-zinc-300">{profileData.parents}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Staff / Employee ID</span>
                            <span className="text-sm font-semibold text-indigo-300 font-mono">{profileData.employeeId}</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Personal Contact</span>
                            <span className="text-sm font-semibold text-zinc-300">{profileData.phone}</span>
                          </div>
                          <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.01] border border-white/5 sm:col-span-2">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Specialization Privilege</span>
                            <span className="text-sm font-semibold text-zinc-300 leading-normal">{profileData.specialty}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>This secure profile summary database is synchronized in real-time with institutional records.</span>
                  </div>
                </div>
              )}

              {/* TAB 2 CONTENT: CHANGE PASSWORD */}
              {modalTab === "change-pass" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setModalSuccess("");
                    setModalError("");
                    
                    if (!currentPass) {
                      setModalError("Please enter your current password to authorize edits.");
                      return;
                    }
                    if (newPass !== confirmPass) {
                      setModalError("Passwords do not match. Please verify your new credentials.");
                      return;
                    }
                    if (newPass.length < 6) {
                      setModalError("Password should be at least 6 characters long for secure compliance.");
                      return;
                    }
                    
                    setModalLoading(true);
                    setTimeout(() => {
                      setModalLoading(false);
                      setModalSuccess("Success! Your account credentials have been securely updated in our server database.");
                      setCurrentPass("");
                      setNewPass("");
                      setConfirmPass("");
                    }, 1500);
                  }}
                  className="flex flex-col gap-4 animate-fade-in"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input px-4 py-3 text-sm font-semibold w-full text-white"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">New Secure Password</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input px-4 py-3 text-sm font-semibold w-full text-white"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input px-4 py-3 text-sm font-semibold w-full text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="glow-btn mt-3 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                  >
                    {modalLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Updating Credentials Database...</span>
                      </>
                    ) : (
                      <span>Save Secure Password</span>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 3 CONTENT: FORGOT PASSWORD */}
              {modalTab === "forget-pass" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setModalSuccess("");
                    setModalError("");
                    
                    if (!resetEmail) {
                      setModalError("Please insert a valid recovery email address.");
                      return;
                    }
                    
                    setModalLoading(true);
                    setTimeout(() => {
                      setModalLoading(false);
                      setModalSuccess(`A secure password recovery link has been safely dispatched to: ${resetEmail}. Please check your inbox folders.`);
                    }, 1500);
                  }}
                  className="flex flex-col gap-4 animate-fade-in"
                >
                  <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-zinc-300 text-xs leading-relaxed">
                    🔒 Insert your registered institutional email below. A secure, time-sensitive password recovery token link will be dispatched immediately.
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Registered Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. rahul@school.com"
                      className="glass-input px-4 py-3.5 text-sm font-semibold w-full text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="glow-btn mt-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                  >
                    {modalLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Dispatching Secure Reset Link...</span>
                      </>
                    ) : (
                      <span>Request Recovery Link</span>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>
        );
      })()}
    </aside>
  );
}
