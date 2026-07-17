"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Bookmark,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TopicDialog } from "@/components/topics/topic-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import {
  updateTopicAction,
  deleteTopicAction,
} from "@/app/(dashboard)/exams/[examId]/subjects/[subjectId]/chapters/[chapterId]/actions";
import type { Topic } from "@/types/domain";
import type { TopicFormValues } from "@/lib/validations/topic";
import type { TopicStatus } from "@/types/database.types";

const DIFFICULTY_VARIANT: Record<string, "secondary" | "accent" | "destructive"> = {
  easy: "secondary",
  medium: "accent",
  hard: "destructive",
};

const NEXT_STATUS: Record<TopicStatus, TopicStatus> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
  skipped: "not_started",
};

export function TopicRow({
  topic,
  examId,
  subjectId,
  chapterId,
}: {
  topic: Topic;
  examId: string;
  subjectId: string;
  chapterId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function cycleStatus() {
    startTransition(async () => {
      try {
        await updateTopicAction(examId, subjectId, chapterId, topic.id, {
          status: NEXT_STATUS[topic.status],
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update status");
      }
    });
  }

  async function handleUpdate(values: TopicFormValues) {
    await updateTopicAction(examId, subjectId, chapterId, topic.id, values);
  }

  async function handleDelete() {
    try {
      await deleteTopicAction(examId, subjectId, chapterId, topic.id);
      toast.success("Topic deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete topic");
    }
  }

  const isCompleted = topic.status === "completed";

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30">
      {/* Status toggle button */}
      <button
        onClick={cycleStatus}
        disabled={isPending}
        className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        title={`Mark as ${NEXT_STATUS[topic.status].replace("_", " ")}`}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`font-medium leading-tight ${isCompleted ? "text-muted-foreground line-through" : ""}`}
          >
            {topic.name}
          </span>
          <StatusBadge status={topic.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={topic.priority} />
          <Badge variant={DIFFICULTY_VARIANT[topic.difficulty]}>{topic.difficulty}</Badge>
          {topic.estimated_time != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {topic.estimated_time}h
            </span>
          )}
          {topic.is_bookmarked && <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />}
          {topic.is_favorite && <Star className="h-3.5 w-3.5 text-yellow-500" />}
          {topic.revision_required && <RefreshCw className="h-3.5 w-3.5 text-orange-500" />}
        </div>
        {topic.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{topic.notes}</p>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <TopicDialog
            chapterId={chapterId}
            topic={topic}
            onSave={handleUpdate}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <ConfirmDialog
            title="Delete topic?"
            description={`This will permanently delete "${topic.name}".`}
            onConfirm={handleDelete}
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
