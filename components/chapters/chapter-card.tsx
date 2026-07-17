"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ChapterDialog } from "@/components/chapters/chapter-dialog";
import { formatPercent } from "@/lib/utils";
import { updateChapterAction, deleteChapterAction } from "@/app/(dashboard)/exams/[examId]/subjects/[subjectId]/actions";
import type { Chapter } from "@/types/domain";
import type { ChapterFormValues } from "@/lib/validations/chapter";

const DIFFICULTY_VARIANT: Record<string, "secondary" | "accent" | "destructive"> = {
  easy: "secondary",
  medium: "accent",
  hard: "destructive",
};

export function ChapterCard({
  chapter,
  examId,
  subjectId,
}: {
  chapter: Chapter;
  examId: string;
  subjectId: string;
}) {
  async function handleUpdate(values: ChapterFormValues) {
    await updateChapterAction(examId, subjectId, chapter.id, values);
  }

  async function handleDelete() {
    try {
      await deleteChapterAction(examId, subjectId, chapter.id);
      toast.success("Chapter deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete chapter");
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/exams/${examId}/subjects/${subjectId}/chapters/${chapter.id}`}
            className="font-medium hover:underline truncate"
          >
            {chapter.name}
          </Link>
          <Badge variant={DIFFICULTY_VARIANT[chapter.difficulty]}>{chapter.difficulty}</Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {chapter.estimated_time != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {chapter.estimated_time}h
              </span>
            )}
            <span>{formatPercent(chapter.completion_pct)}</span>
          </div>
          <Progress value={chapter.completion_pct} className="h-1.5" />
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ChapterDialog
            subjectId={subjectId}
            chapter={chapter}
            onSave={handleUpdate}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            }
          />
          <ConfirmDialog
            title="Delete chapter?"
            description={`This will permanently delete "${chapter.name}" and all topics inside it.`}
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
