export default function DashboardCard({ title, value, change, icon, color = "indigo" }) {
  const colorMap = {
    indigo: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30 glow-indigo-500",
    cyan: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30 glow-cyan-500",
    violet: "from-violet-500/20 to-fuchsia-500/20 text-violet-400 border-violet-500/30 glow-violet-500",
    emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30 glow-emerald-500"
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-card glass-card-hover p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group">
      {/* Decorative background blur gradient inside card */}
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-tr ${selectedColor} blur-2xl opacity-20 group-hover:scale-125 transition-transform duration-500`} />

      <div className="flex flex-col gap-2 z-10">
        <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{title}</span>
        <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        {change && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              ↑
            </span>
            <span className="text-xs text-emerald-400 font-semibold">{change} increase</span>
            <span className="text-xs text-zinc-500">this month</span>
          </div>
        )}
      </div>

      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedColor} flex items-center justify-center border shadow-inner z-10`}>
        {icon}
      </div>
    </div>
  );
}
