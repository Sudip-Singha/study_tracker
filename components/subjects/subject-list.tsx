"use client";

import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SubjectCard } from "@/components/subjects/subject-card";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { createSubjectAction } from "@/app/(dashboard)/exams/[examId]/actions";
import type { Subject } from "@/types/domain";
import type { SubjectFormValues } from "@/lib/validations/subject";

export function SubjectList({ examId, subjects }: { examId: string; subjects: Subject[] }) {
  async function handleCreate(values: SubjectFormValues) {
    try {
      await createSubjectAction(examId, values);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create subject");
      throw err;
    }
  }

  const addButton = (
    <SubjectDialog
      examId={examId}
      onSave={handleCreate}
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> Add subject
        </Button>
      }
    />
  );

  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No subjects yet"
        description="Add subjects to this exam to start tracking chapters, topics, and progress."
        action={addButton}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">{addButton}</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  );
}
