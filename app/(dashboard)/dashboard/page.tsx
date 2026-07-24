import Link from "next/link";
import { format, subDays } from "date-fns";
import { CalendarClock, CheckSquare, Flame, GraduationCap, ListTodo } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listExams } from "@/services/exams.service";
import { listTasksDueToday } from "@/services/tasks.service";
import { countPendingTopics } from "@/services/topics.service";
import { getWeeklyStudySeconds, getStudyStreak, getMonthlyStudySeconds } from "@/services/sessions.service";
import { StatsCard } from "@/components/dashboard/stats-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [exams, todayTasks, pendingTopics, weeklySeconds, streak, monthlySeconds] = await Promise.all([
    listExams(),
    listTasksDueToday(),
    countPendingTopics(),
    getWeeklyStudySeconds(),
    user ? getStudyStreak(user.id) : Promise.resolve(0),
    getMonthlyStudySeconds(currentYear, currentMonth),
  ]);

  const activeExams = exams.filter((e) => e.status !== "archived");
  const overallProgress =
    activeExams.length === 0
      ? 0
      : activeExams.reduce((sum, e) => sum + e.completion_pct, 0) / activeExams.length;

  const upcomingExams = exams
    .filter((e) => e.target_date && new Date(e.target_date) >= new Date())
    .slice(0, 3);

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const key = date.toISOString().slice(0, 10);
    return { day: format(date, "EEE"), hours: (weeklySeconds.get(key) ?? 0) / 3600 };
  });
  const weeklyTotalHours = chartData.reduce((sum, d) => sum + d.hours, 0);

  // Serialize Maps to plain objects for client component props
  const studySecondsRecord = Object.fromEntries(monthlySeconds.entries());

  // Exam markers for the calendar — only exams with a target_date
  const examMarkers = exams
    .filter((e) => e.target_date)
    .map((e) => ({
      id: e.id,
      name: e.name,
      date: e.target_date!.slice(0, 10),
      priority: (e.priority ?? "medium") as "low" | "medium" | "high",
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Here's where things stand across every exam.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={GraduationCap} label="Overall progress" value={formatPercent(overallProgress)} />
        <StatsCard icon={CalendarClock} label="Study hours (7d)" value={`${weeklyTotalHours.toFixed(1)}h`} />
        <StatsCard icon={ListTodo} label="Pending topics" value={String(pendingTopics)} />
        <StatsCard
          icon={Flame}
          label="Study streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyChart data={chartData} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="Nothing due today"
                description="Tasks due today will show up here."
                className="border-none py-6"
              />
            ) : (
              <ul className="space-y-3">
                {todayTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{task.title}</span>
                    <PriorityBadge priority={task.priority} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <CalendarView
        studySeconds={studySecondsRecord}
        examMarkers={examMarkers}
        initialYear={currentYear}
        initialMonth={currentMonth}
      />

      <Card>
        <CardHeader>
          <CardTitle>Upcoming exams</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingExams.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No upcoming exams"
              description="Exams with a target date will show up here, soonest first."
              className="border-none py-6"
            />
          ) : (
            <ul className="space-y-4">
              {upcomingExams.map((exam) => (
                <li key={exam.id}>
                  <Link href={`/exams/${exam.id}`} className="flex items-center justify-between gap-4 hover:underline">
                    <div>
                      <p className="font-medium">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.target_date && format(new Date(exam.target_date), "d MMMM yyyy")}
                      </p>
                    </div>
                    <div className="w-32 space-y-1">
                      <Progress value={exam.completion_pct} />
                      <p className="text-right text-xs text-muted-foreground">
                        {formatPercent(exam.completion_pct)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
