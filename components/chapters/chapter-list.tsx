"use client";

import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ChapterCard } from "@/components/chapters/chapter-card";
import { ChapterDialog } from "@/components/chapters/chapter-dialog";
import { createChapterAction } from "@/app/(dashboard)/exams/[examId]/subjects/[subjectId]/actions";
import type { Chapter } from "@/types/domain";
import type { ChapterFormValues } from "@/lib/validations/chapter";

export function ChapterList({
  examId,
  subjectId,
  chapters,
}: {
  examId: string;
  subjectId: string;
  chapters: Chapter[];
}) {
  async function handleCreate(values: ChapterFormValues) {
    try {
      await createChapterAction(examId, subjectId, values);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create chapter");
      throw err;
    }
  }

  const addButton = (
    <ChapterDialog
      subjectId={subjectId}
      onSave={handleCreate}
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> Add chapter
        </Button>
      }
    />
  );

  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No chapters yet"
        description="Break this subject into chapters to track each part's progress individually."
        action={addButton}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">{addButton}</div>
      <div className="space-y-3">
        {chapters.map((chapter) => (
          <ChapterCard key={chapter.id} chapter={chapter} examId={examId} subjectId={subjectId} />
        ))}
      </div>
    </div>
  );
}
