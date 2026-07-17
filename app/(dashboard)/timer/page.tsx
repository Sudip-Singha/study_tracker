import { StudyTimer } from "@/components/timer/study-timer";

export default function TimerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Study Timer</h1>
        <p className="text-sm text-muted-foreground">Start, pause, resume, or stop — every stopped session is logged.</p>
      </div>
      <StudyTimer />
    </div>
  );
}
