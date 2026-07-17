import { notFound } from "next/navigation";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { getExam } from "@/services/exams.service";
import { listSubjectsForExam } from "@/services/subjects.service";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Progress } from "@/components/ui/progress";
import { SubjectList } from "@/components/subjects/subject-list";
import { formatPercent } from "@/lib/utils";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  let exam;
  let subjects;
  try {
    exam = await getExam(examId);
    subjects = await listSubjectsForExam(examId);
  } catch {
    notFound();
  }
  if (!exam || !subjects) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{exam.name}</h1>
          <PriorityBadge priority={exam.priority} />
        </div>
        {exam.description && (
          <p className="text-sm text-muted-foreground">{exam.description}</p>
        )}
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
        <h2 className="mb-4 font-display text-lg font-semibold">Subjects</h2>
        <SubjectList examId={examId} subjects={subjects} />
      </div>
    </div>
  );
}
