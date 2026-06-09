"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface TimelineDot {
  teacherId: string;
  teacherName: string;
  permitType: "PERMISSION_TO_TEACH" | "PERMISSION_TO_WORK" | "WORK_PERMIT";
  endDateLabel: string; // formatted for display
  daysUntil: number;   // negative = already expired
}

interface Props {
  dots: TimelineDot[];
}

// Layout constants
const MARGIN = { left: 128, right: 32, top: 24, bottom: 44 };
const INNER_W = 1060;
const TOTAL_W = INNER_W + MARGIN.left + MARGIN.right;

const LANES = [
  { key: "PERMISSION_TO_TEACH" as const, label: "Permission to Teach" },
  { key: "PERMISSION_TO_WORK" as const, label: "Permission to Work" },
  { key: "WORK_PERMIT" as const,        label: "Work Permit" },
];
const LANE_Y: Record<string, number> = {
  PERMISSION_TO_TEACH: 48,
  PERMISSION_TO_WORK:  112,
  WORK_PERMIT:         176,
};
const LANE_H = 52;
const INNER_H = 220;
const SVG_H = INNER_H + MARGIN.top + MARGIN.bottom;

// Time range: 1 month ago → 18 months ahead
const DAYS_BEFORE = 30;
const DAYS_AFTER  = 548; // ~18 months
const TOTAL_DAYS  = DAYS_BEFORE + DAYS_AFTER;

function xOf(daysUntil: number): number {
  const clamped = Math.max(-DAYS_BEFORE, Math.min(DAYS_AFTER, daysUntil));
  return ((clamped + DAYS_BEFORE) / TOTAL_DAYS) * INNER_W;
}

function dotFill(days: number): string {
  if (days < 0)    return "#dc2626"; // expired   — red
  if (days <= 30)  return "#ea580c"; // < 1 month — orange-red
  if (days <= 90)  return "#d97706"; // 1–3 months — amber
  if (days <= 180) return "#f5c518"; // 3–6 months — GIS gold
  return "#93c5fd";                  // 6 months+  — soft blue
}

function monthTicks() {
  const ticks: { label: string; days: number }[] = [];
  const today = new Date();
  for (let m = -1; m <= 19; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() + m, 1);
    const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
    if (days >= -DAYS_BEFORE && days <= DAYS_AFTER) {
      ticks.push({
        label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        days,
      });
    }
  }
  return ticks;
}

const LEGEND = [
  { label: "Expired",      color: "#dc2626" },
  { label: "< 1 month",    color: "#ea580c" },
  { label: "1–3 months",   color: "#d97706" },
  { label: "3–6 months",   color: "#f5c518" },
  { label: "6 months+",    color: "#93c5fd" },
];

export function PermitTimeline({ dots }: Props) {
  const router = useRouter();
  const ticks = monthTicks();
  const todayX = xOf(0);

  type Hovered = TimelineDot & { sx: number; sy: number };
  const [tip, setTip] = useState<Hovered | null>(null);

  // Tooltip: flip to left when near right edge
  function tipX(sx: number) {
    return sx + MARGIN.left + 14 + 168 > TOTAL_W
      ? sx + MARGIN.left - 178
      : sx + MARGIN.left + 14;
  }

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className="inline-block h-3 w-3 rounded-full border border-white shadow-sm"
              style={{ background: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="overflow-x-auto rounded border bg-white">
        <svg
          width={TOTAL_W}
          height={SVG_H}
          className="block select-none"
        >
          {/* Lane backgrounds */}
          {LANES.map((lane, i) => (
            <rect
              key={lane.key}
              x={MARGIN.left}
              y={MARGIN.top + LANE_Y[lane.key]! - LANE_H / 2}
              width={INNER_W}
              height={LANE_H}
              fill={i % 2 === 0 ? "#f8faff" : "#f1f5ff"}
            />
          ))}

          {/* Month gridlines + labels */}
          {ticks.map(({ label, days }) => {
            const x = MARGIN.left + xOf(days);
            return (
              <g key={label}>
                <line
                  x1={x} y1={MARGIN.top}
                  x2={x} y2={MARGIN.top + INNER_H}
                  stroke="#e2e8f0" strokeWidth={1}
                />
                <text
                  x={x} y={MARGIN.top + INNER_H + 18}
                  textAnchor="middle" fontSize={10} fill="#94a3b8"
                  fontFamily="inherit"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Lane labels */}
          {LANES.map((lane) => (
            <text
              key={lane.key}
              x={MARGIN.left - 10}
              y={MARGIN.top + LANE_Y[lane.key]! + 4}
              textAnchor="end"
              fontSize={11}
              fill="#1a3878"
              fontWeight="500"
              fontFamily="inherit"
            >
              {lane.label}
            </text>
          ))}

          {/* Today line */}
          <line
            x1={MARGIN.left + todayX} y1={MARGIN.top}
            x2={MARGIN.left + todayX} y2={MARGIN.top + INNER_H}
            stroke="#1a3878" strokeWidth={2} strokeDasharray="5 3"
          />
          <text
            x={MARGIN.left + todayX + 5} y={MARGIN.top + 13}
            fontSize={10} fill="#1a3878" fontWeight="700" fontFamily="inherit"
          >
            TODAY
          </text>

          {/* Permit dots */}
          {dots.map((dot, i) => {
            const sx = xOf(dot.daysUntil);
            const sy = LANE_Y[dot.permitType]!;
            return (
              <circle
                key={i}
                cx={MARGIN.left + sx}
                cy={MARGIN.top + sy}
                r={6}
                fill={dotFill(dot.daysUntil)}
                fillOpacity={0.88}
                stroke="white"
                strokeWidth={1.5}
                className="cursor-pointer transition-transform hover:scale-125"
                style={{ transformOrigin: `${MARGIN.left + sx}px ${MARGIN.top + sy}px` }}
                onClick={() => router.push(`/teachers/${dot.teacherId}`)}
                onMouseEnter={() => setTip({ ...dot, sx, sy: MARGIN.top + sy })}
                onMouseLeave={() => setTip(null)}
              />
            );
          })}

          {/* Tooltip */}
          {tip && (() => {
            const tx = tipX(tip.sx);
            const ty = tip.sy - 44;
            return (
              <g pointerEvents="none">
                <rect
                  x={tx} y={ty}
                  width={164} height={58}
                  rx={5} ry={5}
                  fill="white"
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))"
                />
                <text x={tx + 10} y={ty + 17} fontSize={11} fontWeight="700" fill="#1a3878" fontFamily="inherit">
                  {tip.teacherName.length > 22 ? tip.teacherName.slice(0, 21) + "…" : tip.teacherName}
                </text>
                <text x={tx + 10} y={ty + 32} fontSize={10} fill="#64748b" fontFamily="inherit">
                  {tip.permitType.replace(/_/g, " ")}
                </text>
                <text x={tx + 10} y={ty + 47} fontSize={10} fill={dotFill(tip.daysUntil)} fontWeight="600" fontFamily="inherit">
                  {tip.daysUntil < 0
                    ? `Expired ${Math.abs(tip.daysUntil)}d ago · ${tip.endDateLabel}`
                    : `${tip.daysUntil}d remaining · ${tip.endDateLabel}`}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
