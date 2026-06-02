"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ParentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to log in");
      }

      // Verify that the logged in role is a parent
      if (data.user.role !== "parent") {
        throw new Error("Unauthorized: Please sign in as a parent in this portal section.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const useParentDemoSana = () => {
    setEmail("parent.sana@school.com");
    setPassword("parentpassword");
  };

  const useParentDemoRahul = () => {
    setEmail("parent.rahul@school.com");
    setPassword("parentpassword");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-black/60">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="glass-card w-full max-w-md p-8 md:p-10 rounded-3xl animate-fade-in relative z-10">
        
        {/* Back Link */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-violet-400 transition-colors mb-6 font-semibold"
        >
          <span>←</span>
          <span>Back to portal options</span>
        </Link>

        {/* Brand header */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 flex items-center justify-center mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Parent Portal Sign In</h2>
          <p className="text-xs text-zinc-400">Monitor academic diagnostics and message teachers</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Email input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider pl-1">Parent Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. parent.sana@school.com"
              className="glass-input px-4 py-3.5 text-sm font-medium w-full"
              required
            />
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input pl-4 pr-12 py-3.5 text-sm font-medium w-full"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="glow-btn mt-2 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Entering Parent Portal...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Fast Login Area */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center">Fast Demo Access</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={useParentDemoSana}
              className="py-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-300 transition-all flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-center leading-normal"
            >
              👩‍👧 Sana's Parent
            </button>
            <button
              type="button"
              onClick={useParentDemoRahul}
              className="py-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-300 transition-all flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-center leading-normal"
            >
              👨‍👦 Rahul's Parent
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
