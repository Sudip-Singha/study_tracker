"use client";

import { FileJson, GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ExamCard } from "@/components/exams/exam-card";
import { ExamDialog } from "@/components/exams/exam-dialog";
import { ExamImportDialog } from "@/components/exams/exam-import-dialog";
import { createExamAction } from "@/app/(dashboard)/exams/actions";
import type { Exam } from "@/types/domain";
import type { ExamFormValues } from "@/lib/validations/exam";

export function ExamList({ exams }: { exams: Exam[] }) {
  async function handleCreate(values: ExamFormValues) {
    await createExamAction(values);
  }

  const newExamButton = (
    <ExamDialog
      onSave={handleCreate}
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> New exam
        </Button>
      }
    />
  );

  const importButton = (
    <ExamImportDialog
      trigger={
        <Button variant="outline">
          <FileJson className="h-4 w-4" /> Import JSON
        </Button>
      }
    />
  );

  if (exams.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No exams yet"
        description="Add the exams you're preparing for to start tracking subjects, chapters, and progress."
        action={
          <div className="flex gap-2">
            {importButton}
            {newExamButton}
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {importButton}
        {newExamButton}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  );
}
