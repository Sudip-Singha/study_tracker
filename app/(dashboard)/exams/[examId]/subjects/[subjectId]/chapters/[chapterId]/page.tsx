import { notFound } from "next/navigation";
import { getExam } from "@/services/exams.service";
import { listSubjectsForExam } from "@/services/subjects.service";
import { listChaptersForSubject } from "@/services/chapters.service";
import { listTopicsForChapter } from "@/services/topics.service";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TopicList } from "@/components/topics/topic-list";
import { formatPercent } from "@/lib/utils";

const DIFFICULTY_VARIANT: Record<string, "secondary" | "accent" | "destructive"> = {
  easy: "secondary",
  medium: "accent",
  hard: "destructive",
};

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ examId: string; subjectId: string; chapterId: string }>;
}) {
  const { examId, subjectId, chapterId } = await params;

  let exam;
  let subjects;
  let chapters;
  let topics;
  try {
    [exam, subjects, chapters, topics] = await Promise.all([
      getExam(examId),
      listSubjectsForExam(examId),
      listChaptersForSubject(subjectId),
      listTopicsForChapter(chapterId),
    ]);
  } catch {
    notFound();
  }
  if (!exam || !subjects || !chapters || !topics) notFound();

  const subject = subjects.find((s) => s.id === subjectId);
  if (!subject) notFound();
  const chapter = chapters.find((c) => c.id === chapterId);
  if (!chapter) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Exams", href: "/exams" },
            { label: exam.name, href: `/exams/${examId}` },
            { label: subject.name, href: `/exams/${examId}/subjects/${subjectId}` },
            { label: chapter.name },
          ]}
        />
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{chapter.name}</h1>
          <Badge variant={DIFFICULTY_VARIANT[chapter.difficulty]}>{chapter.difficulty}</Badge>
        </div>
        {chapter.notes && (
          <p className="text-sm text-muted-foreground">{chapter.notes}</p>
        )}
        <div className="max-w-sm space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Chapter progress</span>
            <span>{formatPercent(chapter.completion_pct)}</span>
          </div>
          <Progress value={chapter.completion_pct} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold">Topics</h2>
        <TopicList
          examId={examId}
          subjectId={subjectId}
          chapterId={chapterId}
          topics={topics}
        />
      </div>
    </div>
  );
}
