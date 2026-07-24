"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamMarker {
  id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  priority: "low" | "medium" | "high";
}

interface CalendarViewProps {
  /** Map of "YYYY-MM-DD" -> seconds studied that day (for current month) */
  studySeconds: Record<string, number>;
  examMarkers: ExamMarker[];
  /** Initial year/month to display (defaults to current month) */
  initialYear?: number;
  initialMonth?: number; // 1-indexed
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Returns a 0-3 intensity level for a given number of study seconds */
function heatLevel(seconds: number): 0 | 1 | 2 | 3 {
  if (seconds <= 0) return 0;
  if (seconds < 3600) return 1;      // < 1 h
  if (seconds < 7200) return 2;      // 1-2 h
  return 3;                          // > 2 h
}

const heatClasses: Record<0 | 1 | 2 | 3, string> = {
  0: "",
  1: "bg-primary/15",
  2: "bg-primary/35",
  3: "bg-primary/60",
};

const priorityDotClasses: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

function fmtHours(seconds: number) {
  const h = seconds / 3600;
  return h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(seconds / 60)}m`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarView({
  studySeconds,
  examMarkers,
  initialYear,
  initialMonth,
}: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth() + 1); // 1-indexed
  const [tooltip, setTooltip] = useState<{ key: string; x: number; y: number } | null>(null);

  // Build the grid of day cells
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // All cells: null = empty padding slot, number = day of month
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const todayKey = toKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Study Calendar</CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="w-36 text-center text-sm font-semibold">
              {MONTHS[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-background aspect-square" />;
            }

            const key = toKey(year, month, day);
            const secs = studySeconds[key] ?? 0;
            const heat = heatLevel(secs);
            const isToday = key === todayKey;
            const examsOnDay = examMarkers.filter((e) => e.date === key);

            return (
              <div
                key={key}
                className={cn(
                  "relative bg-background aspect-square flex flex-col items-center justify-center gap-0.5 group cursor-default transition-colors",
                  heat > 0 && heatClasses[heat],
                  isToday && "ring-2 ring-inset ring-primary",
                )}
                onMouseEnter={(e) => {
                  if (secs > 0 || examsOnDay.length > 0) {
                    setTooltip({ key, x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Day number */}
                <span
                  className={cn(
                    "text-xs font-medium leading-none",
                    isToday ? "text-primary font-bold" : "text-foreground",
                    heat === 3 && "text-primary-foreground/90",
                  )}
                >
                  {day}
                </span>

                {/* Study hours label */}
                {secs > 0 && (
                  <span
                    className={cn(
                      "text-[9px] leading-none",
                      heat === 3 ? "text-primary-foreground/80" : "text-primary",
                    )}
                  >
                    {fmtHours(secs)}
                  </span>
                )}

                {/* Exam dots */}
                {examsOnDay.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {examsOnDay.slice(0, 3).map((ex) => (
                      <span
                        key={ex.id}
                        className={cn(
                          "inline-block h-1.5 w-1.5 rounded-full",
                          priorityDotClasses[ex.priority] ?? "bg-primary",
                        )}
                      />
                    ))}
                    {examsOnDay.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{examsOnDay.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Tooltip (via fixed positioning via JS) */}
                {tooltip?.key === key && (secs > 0 || examsOnDay.length > 0) && (
                  <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 w-max max-w-[180px] rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-xs pointer-events-none">
                    <p className="font-semibold text-foreground mb-1">
                      {MONTHS[month - 1]} {day}
                    </p>
                    {secs > 0 && (
                      <p className="text-muted-foreground">📚 {fmtHours(secs)} studied</p>
                    )}
                    {examsOnDay.map((ex) => (
                      <p key={ex.id} className="text-muted-foreground mt-0.5">
                        🎯 {ex.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Less</span>
            {([0, 1, 2, 3] as const).map((l) => (
              <span
                key={l}
                className={cn(
                  "inline-block h-3 w-3 rounded-sm border border-border",
                  l > 0 ? heatClasses[l] : "bg-background",
                )}
              />
            ))}
            <span>More</span>
          </div>
          <div className="flex items-center gap-3">
            {(["high", "medium", "low"] as const).map((p) => (
              <span key={p} className="flex items-center gap-1 capitalize">
                <span className={cn("inline-block h-2 w-2 rounded-full", priorityDotClasses[p])} />
                {p}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
