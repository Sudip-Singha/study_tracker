import { listTimeBlocks } from "@/services/timetable.service";
import { WeeklyGrid } from "@/components/timetable/weekly-grid";
import { TimeBlockDialog } from "@/components/timetable/time-block-dialog";
import { CalendarClock } from "lucide-react";

export const metadata = {
  title: "Timetable | Study Tracker",
};

export default async function TimetablePage() {
  const blocks = await listTimeBlocks();

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Weekly Timetable
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan your standard weekly schedule to stay on track.
          </p>
        </div>
        <TimeBlockDialog />
      </div>

      <div className="flex-1 min-h-0">
        <WeeklyGrid blocks={blocks} />
      </div>
    </div>
  );
}
