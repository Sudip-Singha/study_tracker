import { listExams } from "@/services/exams.service";
import { ExamList } from "@/components/exams/exam-list";

export default async function ExamsPage() {
  const exams = await listExams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Exams</h1>
        <p className="text-sm text-muted-foreground">
          Every exam you&apos;re preparing for, with subjects and chapters nested inside.
        </p>
      </div>
      <ExamList exams={exams} />
    </div>
  );
}
