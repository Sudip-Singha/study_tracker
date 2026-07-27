"use client";

import { useMemo } from "react";
import { format, parse } from "date-fns";
import { TimeBlockDialog } from "./time-block-dialog";
import { cn } from "@/lib/utils";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

// Helper to convert "HH:MM:SS" to minutes since midnight for positioning
function timeToMinutes(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function WeeklyGrid({ blocks }: { blocks: any[] }) {
  // Group blocks by day
  const blocksByDay = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    
    blocks.forEach(block => {
      grouped[block.day_of_week].push(block);
    });
    
    return grouped;
  }, [blocks]);

  // Generate hour labels (6:00 to 23:00)
  const hours = Array.from({ length: 18 }).map((_, i) => i + 6);

  return (
    <div className="flex flex-col h-[800px] border rounded-lg overflow-hidden bg-card">
      <div className="flex border-b">
        <div className="w-16 shrink-0 border-r" /> {/* Time column header */}
        {DAYS.map((day, i) => (
          <div key={day} className="flex-1 text-center py-2 text-sm font-medium border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      
      <div className="flex flex-1 overflow-y-auto relative">
        {/* Time labels column */}
        <div className="w-16 shrink-0 border-r relative z-10 bg-card">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] border-b text-xs text-muted-foreground p-1 text-right">
              {hour}:00
            </div>
          ))}
        </div>

        {/* Grid lines and blocks */}
        <div className="flex-1 flex relative">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 z-0 pointer-events-none flex flex-col">
            {hours.map(hour => (
              <div key={`line-${hour}`} className="h-[60px] border-b border-border/50" />
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((_, dayIndex) => (
            <div key={dayIndex} className="flex-1 border-r last:border-r-0 relative z-10">
              {blocksByDay[dayIndex].map((block) => {
                const startMins = timeToMinutes(block.start_time);
                const endMins = timeToMinutes(block.end_time);
                // Offset by 6 hours (360 minutes) since grid starts at 6:00
                const top = Math.max(0, startMins - 360); 
                const height = endMins - startMins;

                return (
                  <TimeBlockDialog
                    key={block.id}
                    initialData={block}
                    trigger={
                      <button
                        className={cn(
                          "absolute left-1 right-1 rounded-md p-2 text-left text-xs font-medium border shadow-sm transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary",
                          block.color || "bg-blue-100 text-blue-900 border-blue-200"
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                        }}
                      >
                        <div className="font-semibold truncate">{block.activity}</div>
                        <div className="opacity-90 mt-1 truncate">
                          {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                        </div>
                      </button>
                    }
                  />
                );
              })}
              
              {/* Clickable background to add new block */}
              <div className="absolute inset-0 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
