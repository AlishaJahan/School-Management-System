import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#09090b]">
      {/* Decorative Blur Background Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="font-extrabold text-white text-lg">EP</span>
          </div>
          <div>
            <h1 className="font-extrabold text-xl leading-none text-white tracking-tight">EduPrime</h1>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">Management</span>
          </div>
        </div>

        <Link
          href="/login"
          className="glow-btn px-6 py-2.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10 text-sm"
        >
          Access Portal
        </Link>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center py-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          The Future of School Management
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white max-w-4xl mb-6 animate-fade-in">
          Supercharge Student & Teacher{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(99,102,241,0.2)]">
            Administration
          </span>
        </h1>

        <p className="text-zinc-400 max-w-2xl text-base md:text-lg leading-relaxed mb-10 animate-fade-in">
          EduPrime is a highly premium, lightning-fast platform designed to bridge administrative gaps, manage teacher courses, track student details, and generate instant institutional insights.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 animate-fade-in">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <span>Launch Dashboard</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 animate-fade-in">
          <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center gap-4 group hover:border-indigo-500/30">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Student Enrollment</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Track grades, roll numbers, status and attendance matrices inside beautiful tables with dynamic search.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center gap-4 group hover:border-cyan-500/30">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Teacher Subject Routing</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Register teachers, assign class specializations, manage schedules, and review academic hiring dates.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center gap-4 group hover:border-purple-500/30">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Growth Insights</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Visualize monthly registrations and class metrics instantly with custom native vector area charts.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-white/5 text-xs text-zinc-500 mt-20 relative z-10">
        &copy; {new Date().getFullYear()} EduPrime Inc. All Rights Reserved. Built with Next.js, Express & MySQL.
      </footer>
    </div>
  );
}
