"use client";

import { useState } from "react";

export default function StatsChart() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Registration data (Jan - Jun)
  const data = [
    { month: "Jan", students: 45, teachers: 12 },
    { month: "Feb", students: 60, teachers: 15 },
    { month: "Mar", students: 55, teachers: 14 },
    { month: "Apr", students: 85, teachers: 19 },
    { month: "May", students: 95, teachers: 22 },
    { month: "Jun", students: 120, teachers: 26 }
  ];

  // SVG Chart sizing
  const width = 600;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value in data to scale
  const maxVal = 140;

  // Compute point coordinates
  const studentPoints = data.map((item, idx) => {
    const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (item.students / maxVal) * chartHeight;
    return { x, y, val: item.students, label: item.month };
  });

  const teacherPoints = data.map((item, idx) => {
    const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (item.teachers / maxVal) * chartHeight;
    return { x, y, val: item.teachers };
  });

  // Helper to build cubic bezier curve path string
  const getCurvePath = (points) => {
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const studentPath = getCurvePath(studentPoints);
  const teacherPath = getCurvePath(teacherPoints);

  // Helper to build area path closed to bottom
  const getAreaPath = (points, pathString) => {
    return `${pathString} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  };

  const studentArea = getAreaPath(studentPoints, studentPath);
  const teacherArea = getAreaPath(teacherPoints, teacherPath);

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 w-full animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-zinc-100">Enrollment & Growth Trends</h4>
          <p className="text-xs text-zinc-400">Monthly registration comparison metrics</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
            <span className="text-zinc-300">Students</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
            <span className="text-zinc-300">Teachers</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            {/* Gradients */}
            <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="teacherGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const val = Math.round(maxVal - ratio * maxVal);
            return (
              <g key={idx} className="opacity-30">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x={paddingLeft - 8} y={y + 4} fill="#a1a1aa" fontSize="10" textAnchor="end">
                  {val}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {studentPoints.map((pt, idx) => (
            <text
              key={idx}
              x={pt.x}
              y={paddingTop + chartHeight + 18}
              fill="#a1a1aa"
              fontSize="10"
              textAnchor="middle"
              className="font-medium"
            >
              {pt.label}
            </text>
          ))}

          {/* Areas */}
          <path d={studentArea} fill="url(#studentGrad)" />
          <path d={teacherArea} fill="url(#teacherGrad)" />

          {/* Paths */}
          <path d={studentPath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]" />
          <path d={teacherPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_2px_6px_rgba(34,211,238,0.3)]" />

          {/* Interaction guides */}
          {studentPoints.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible vertical trigger bar */}
              <rect
                x={pt.x - 20}
                y={paddingTop}
                width="40"
                height={chartHeight}
                fill="transparent"
              />

              {/* Hover indicator lines */}
              {hoveredIndex === idx && (
                <line
                  x1={pt.x}
                  y1={paddingTop}
                  x2={pt.x}
                  y2={paddingTop + chartHeight}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1.5"
                />
              )}

              {/* Student Dots */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 6 : 4}
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-150"
              />

              {/* Teacher Dots */}
              <circle
                cx={pt.x}
                cy={teacherPoints[idx].y}
                r={hoveredIndex === idx ? 5 : 3.5}
                fill="#22d3ee"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />

              {/* Tooltip Card */}
              {hoveredIndex === idx && (
                <g transform={`translate(${pt.x > width / 2 ? pt.x - 110 : pt.x + 10}, ${pt.y - 40})`}>
                  <rect
                    width="100"
                    height="50"
                    rx="8"
                    fill="rgba(15, 15, 20, 0.95)"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />
                  <text x="8" y="18" fill="#ffffff" fontSize="10" fontWeight="bold">
                    {pt.label} Stats
                  </text>
                  <text x="8" y="32" fill="#a5b4fc" fontSize="9" fontWeight="medium">
                    Students: {pt.val}
                  </text>
                  <text x="8" y="43" fill="#22d3ee" fontSize="9" fontWeight="medium">
                    Teachers: {teacherPoints[idx].val}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
