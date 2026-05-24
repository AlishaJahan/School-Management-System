"use client";

import Link from "next/link";

export default function LoginGateway() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Portal Selection Gateway Container */}
      <div className="w-full max-w-2xl text-center flex flex-col gap-10 animate-fade-in relative z-10">
        
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-2 hover:scale-105 transition-all">
            <span className="font-extrabold text-white text-2xl">EP</span>
          </Link>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Welcome to EduPrime Portal</h2>
          <p className="text-zinc-400 text-sm max-w-md">
            Please choose your portal dashboard entry gateway to continue
          </p>
        </div>

        {/* Portal Entry Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          
          {/* Student Entry */}
          <Link 
            href="/login/student"
            className="glass-card glass-card-hover p-8 rounded-3xl flex flex-col gap-6 group hover:border-indigo-500/30 relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/15 blur-xl group-hover:scale-150 transition-transform duration-500" />
            
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                Student Portal
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Sign in to view academic schedules, grades directory, class announcements and active profile details.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-400 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Sign in as a Student</span>
              <span>→</span>
            </div>
          </Link>

          {/* Teacher/Admin Entry */}
          <Link 
            href="/login/teacher"
            className="glass-card glass-card-hover p-8 rounded-3xl flex flex-col gap-6 group hover:border-cyan-500/30 relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-500/15 blur-xl group-hover:scale-150 transition-transform duration-500" />
            
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                Teacher & Admin Portal
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Sign in to manage student records, register class directories, review teachers list and subject specializations.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-cyan-400 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Sign in as a Teacher / Admin</span>
              <span>→</span>
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}
