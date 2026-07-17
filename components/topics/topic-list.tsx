"use client";

import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { TopicRow } from "@/components/topics/topic-row";
import { TopicDialog } from "@/components/topics/topic-dialog";
import { createTopicAction } from "@/app/(dashboard)/exams/[examId]/subjects/[subjectId]/chapters/[chapterId]/actions";
import type { Topic } from "@/types/domain";
import type { TopicFormValues } from "@/lib/validations/topic";

export function TopicList({
  examId,
  subjectId,
  chapterId,
  topics,
}: {
  examId: string;
  subjectId: string;
  chapterId: string;
  topics: Topic[];
}) {
  async function handleCreate(values: TopicFormValues) {
    try {
      await createTopicAction(examId, subjectId, chapterId, values);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create topic");
      throw err;
    }
  }

  const addButton = (
    <TopicDialog
      chapterId={chapterId}
      onSave={handleCreate}
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> Add topic
        </Button>
      }
    />
  );

  if (topics.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No topics yet"
        description="Add individual topics to this chapter. Click the circle icon to cycle through statuses."
        action={addButton}
      />
    );
  }

  const completed = topics.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completed} / {topics.length} completed
        </p>
        {addButton}
      </div>
      <div className="space-y-2">
        {topics.map((topic) => (
          <TopicRow
            key={topic.id}
            topic={topic}
            examId={examId}
            subjectId={subjectId}
            chapterId={chapterId}
          />
        ))}
      </div>
    </div>
  );
}
