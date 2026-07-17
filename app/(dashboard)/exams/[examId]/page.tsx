import { notFound } from "next/navigation";
import { Calendar, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { getExam } from "@/services/exams.service";
import { listSubjectsForExam } from "@/services/subjects.service";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  let exam;
  try {
    exam = await getExam(examId);
  } catch {
    notFound();
  }
  const subjects = await listSubjectsForExam(examId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{exam.name}</h1>
          <PriorityBadge priority={exam.priority} />
        </div>
        {exam.target_date && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Target date: {format(new Date(exam.target_date), "d MMMM yyyy")}
          </p>
        )}
        <div className="max-w-sm space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span>{formatPercent(exam.completion_pct)}</span>
          </div>
          <Progress value={exam.completion_pct} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Subjects</h2>
        {subjects.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No subjects yet"
            description="Subject, chapter, and topic CRUD ships in build-spec milestone M3 (continued) — the Exams pattern in this codebase is the template to replicate for each level."
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {subjects.map((subject) => (
              <li key={subject.id} className="flex items-center justify-between p-4">
                <span className="font-medium">{subject.name}</span>
                <span className="text-sm text-muted-foreground">{formatPercent(subject.completion_pct)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
