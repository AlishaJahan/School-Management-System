"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function EmergencyAlerts() {
  const [currentUser, setCurrentUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtering/Search States
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Broadcaster Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "high",
    channels: ["in-app", "email", "sms"]
  });

  // Success Receipt Modal State
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [dispatchStats, setDispatchStats] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        fetchAlerts();
      } catch (e) {
        console.error("Error loading user context", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/alerts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load emergency alerts database.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error communicating with the notification server.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleChannelToggle = (channel) => {
    const activeChannels = [...formData.channels];
    if (activeChannels.includes(channel)) {
      setFormData({
        ...formData,
        channels: activeChannels.filter(c => c !== channel)
      });
    } else {
      setFormData({
        ...formData,
        channels: [...activeChannels, channel]
      });
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setError("Alert title and message justification are required.");
      return;
    }
    if (formData.channels.length === 0) {
      setError("At least one communication dispatch channel must be checked.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          severity: formData.severity,
          channels: formData.channels
        })
      });

      const responseData = await res.json();

      if (res.ok) {
        setFormData({
          title: "",
          message: "",
          severity: "high",
          channels: ["in-app", "email", "sms"]
        });
        setModalOpen(false);
        setDispatchStats(responseData.stats);
        setStatsModalOpen(true);
        setSuccess("Emergency alert successfully dispatched to all active users!");
        fetchAlerts();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(responseData.message || "Failed to dispatch emergency alert.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error dispatching emergency alert.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetractAlert = async (id) => {
    if (!window.confirm("WARNING: Are you sure you want to retract/delete this emergency alert? This action removes the warning from all student/teacher dashboards immediately.")) return;

    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccess("Emergency alert retracted and deleted successfully.");
        setAlerts(prev => prev.filter(a => a.id !== id));
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to retract emergency alert.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error retracting emergency alert.");
    }
  };

  // Filter Logic
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(search.toLowerCase()) ||
      alert.message.toLowerCase().includes(search.toLowerCase()) ||
      (alert.publisher || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = 
      severityFilter === "all" || alert.severity.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  // Stylings based on severity
  const severityConfig = {
    critical: {
      badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      card: "border-rose-500/40 bg-rose-950/10 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse-border",
      text: "text-rose-400",
      icon: "🚨",
      glow: "from-rose-500/35 to-rose-600/5"
    },
    high: {
      badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      card: "border-amber-500/20 bg-white/[0.01]",
      text: "text-amber-400",
      icon: "⚠️",
      glow: "from-amber-500/20 to-amber-600/5"
    },
    medium: {
      badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      card: "border-white/5 bg-white/[0.01]",
      text: "text-yellow-400",
      icon: "🔔",
      glow: "from-yellow-500/10 to-yellow-600/5"
    },
    low: {
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      card: "border-white/5 bg-white/[0.01]",
      text: "text-cyan-400",
      icon: "ℹ️",
      glow: "from-cyan-500/10 to-cyan-600/5"
    }
  };

  const activeCriticalAlerts = alerts.filter(a => a.severity === "critical");

  if (loading && alerts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-zinc-400">Loading emergency database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-0.5">Emergency Broadcast Module</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Institutional Alert System</h2>
          <p className="text-zinc-400 text-sm">
            {isAdmin 
              ? "⚡ Administrator Portal: Dispatch urgent SMS, email, and in-app system warning broadcasts."
              : "Review urgent announcements, weather alarms, safety details, and school closures."}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="glow-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="text-sm">🚨</span>
            <span>Broadcast Alert</span>
          </button>
        )}
      </div>

      {/* Warning/Success banners */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold animate-fade-in flex items-center gap-2.5">
          <span>⚠️ {error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-fade-in flex items-center gap-2.5">
          <span>✓ {success}</span>
        </div>
      )}

      {/* Critical Status Banner */}
      {activeCriticalAlerts.length > 0 && (
        <div className="p-5 rounded-3xl border border-rose-500/30 bg-rose-500/5 text-rose-400 animate-pulse flex items-center gap-4 shadow-lg shadow-rose-500/10">
          <span className="text-3xl animate-bounce">🚨</span>
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wide text-white">Active Critical Alert Protocol</h4>
            <p className="text-xs text-rose-300 leading-normal">
              There is currently {activeCriticalAlerts.length} critical emergency warning broadcasted to all cohorts. Please verify instruction directives.
            </p>
          </div>
        </div>
      )}

      {/* Control panel: Search and Severity tabs */}
      <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search alerts by title, message description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-11 pr-4 py-3 text-xs font-semibold w-full"
            />
          </div>

          {/* Severity Tabs Filter */}
          <div className="flex flex-wrap gap-1.5 border-white/5">
            {["all", "critical", "high", "medium", "low"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                  severityFilter === sev
                    ? "bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-inner"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Alerts Catalog Grid */}
      {filteredAlerts.length === 0 ? (
        <div className="glass-card p-16 rounded-3xl text-center flex flex-col gap-3 items-center justify-center border-dashed">
          <span className="text-4xl text-zinc-700 animate-pulse">🌿</span>
          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs select-none">No active alerts logged</span>
          <p className="text-zinc-600 text-xs">All emergency protocols are green. No warnings found matching active filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredAlerts.map((alert) => {
            const config = severityConfig[alert.severity.toLowerCase()] || severityConfig.medium;
            return (
              <div
                key={alert.id}
                className={`glass-card p-6 rounded-3xl flex flex-col justify-between gap-5 relative overflow-hidden group hover:scale-[1.002] transition-all border ${config.card}`}
              >
                {/* Severity glow line */}
                <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${config.glow}`} />

                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{config.icon}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${config.badge}`}>
                        {alert.severity} Priority
                      </span>
                    </div>

                    {/* Delete Option for Administrator */}
                    {isAdmin && (
                      <button
                        onClick={() => handleRetractAlert(alert.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all opacity-0 group-hover:opacity-100"
                        title="Retract/Delete Warning"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Header Title */}
                  <h4 className={`font-extrabold text-lg group-hover:text-rose-400 transition-colors ${config.text}`}>
                    {alert.title}
                  </h4>

                  {/* Body Content Message */}
                  <p className="text-zinc-300 text-xs leading-relaxed font-semibold">
                    {alert.message}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-white/5 pt-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wider relative z-10">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 text-rose-400/80">
                      👤 Sender: {alert.publisher || "System Admin"}
                    </span>
                    <span className="text-zinc-500">
                      📢 Broadcasted via: <strong className="text-zinc-400">{alert.channels ? alert.channels.split(",").join(", ") : "in-app"}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-zinc-500 font-semibold">
                    🕒 Published: {new Date(alert.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Broadcast Alert Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Broadcast Emergency Warning Alert"
      >
        <form onSubmit={handleBroadcastSubmit} className="flex flex-col gap-4">
          
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Alert Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Extreme Torrential Rains - early school closure"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              required
            />
          </div>

          {/* Severity level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Severity Protocol</label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleInputChange}
              className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white bg-[#09090b]"
            >
              <option value="low">Low Priority (General Info)</option>
              <option value="medium">Medium Priority (Circular guidelines)</option>
              <option value="high">High Priority (Urgent notice)</option>
              <option value="critical">Critical (Immediate danger, emergency action)</option>
            </select>
          </div>

          {/* Dispatch Channels */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Communication Channels</label>
            <div className="grid grid-cols-3 gap-3">
              {["in-app", "email", "sms"].map((ch) => {
                const isActive = formData.channels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleChannelToggle(ch)}
                    className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      isActive 
                        ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                        : "border-white/5 bg-[#09090b]/40 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {ch === "in-app" ? "📱 In-App" : ch === "email" ? "✉️ Email" : "💬 SMS"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alert Message Content */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Alert Instruction Details</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Provide complete warnings, timing details, safety guidelines, and emergency assembly points..."
              rows="4"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium resize-none leading-relaxed"
              required
            />
          </div>

          {/* Modal Action buttons */}
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
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all hover:opacity-95 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Broadcasting...</span>
                </>
              ) : (
                <span>Publish Broadcast</span>
              )}
            </button>
          </div>

        </form>
      </Modal>

      {/* Success Stats Receipt Modal */}
      <Modal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        title="Broadcast Dispatch Report Summary"
      >
        {dispatchStats && (
          <div className="flex flex-col gap-6 text-zinc-300">
            <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2.5">
              <span>🎉 Outbound dispatch completed successfully! Notification data is logged and cached in the student/teacher directories.</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-2xl flex flex-col gap-1 border-white/5 text-center">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Identities Resolved</span>
                <span className="text-xl font-bold text-white font-mono">{dispatchStats.totalTargets}</span>
              </div>
              <div className="glass-card p-4 rounded-2xl flex flex-col gap-1 border-white/5 text-center">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Emails Sim Out</span>
                <span className="text-xl font-bold text-cyan-400 font-mono">{dispatchStats.emailSent}</span>
              </div>
              <div className="glass-card p-4 rounded-2xl flex flex-col gap-1 border-white/5 text-center">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">SMS Sim Out</span>
                <span className="text-xl font-bold text-yellow-400 font-mono">{dispatchStats.smsSent}</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 leading-normal text-center">
              * Simulated messages were printed to the terminal console stream via mock outbound dispatch gateways.
            </p>

            <button
              onClick={() => setStatsModalOpen(false)}
              className="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all text-center"
            >
              Acknowledge & Close
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
}
