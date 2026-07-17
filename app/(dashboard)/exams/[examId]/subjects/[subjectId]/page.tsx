import { notFound } from "next/navigation";
import { getExam } from "@/services/exams.service";
import { listSubjectsForExam } from "@/services/subjects.service";
import { listChaptersForSubject } from "@/services/chapters.service";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Progress } from "@/components/ui/progress";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ChapterList } from "@/components/chapters/chapter-list";
import { formatPercent } from "@/lib/utils";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ examId: string; subjectId: string }>;
}) {
  const { examId, subjectId } = await params;

  let exam;
  let subjects;
  let chapters;
  try {
    [exam, subjects, chapters] = await Promise.all([
      getExam(examId),
      listSubjectsForExam(examId),
      listChaptersForSubject(subjectId),
    ]);
  } catch {
    notFound();
  }
  if (!exam || !subjects || !chapters) notFound();

  const subject = subjects.find((s) => s.id === subjectId);
  if (!subject) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Exams", href: "/exams" },
            { label: exam.name, href: `/exams/${examId}` },
            { label: subject.name },
          ]}
        />
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{subject.name}</h1>
          <PriorityBadge priority={subject.priority} />
        </div>
        <div className="max-w-sm space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subject progress</span>
            <span>{formatPercent(subject.completion_pct)}</span>
          </div>
          <Progress value={subject.completion_pct} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold">Chapters</h2>
        <ChapterList examId={examId} subjectId={subjectId} chapters={chapters} />
      </div>
    </div>
  );
}
