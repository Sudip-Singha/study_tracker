"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { formatPercent } from "@/lib/utils";
import { updateSubjectAction, deleteSubjectAction } from "@/app/(dashboard)/exams/[examId]/actions";
import type { Subject } from "@/types/domain";
import type { SubjectFormValues } from "@/lib/validations/subject";

export function SubjectCard({ subject }: { subject: Subject }) {
  async function handleUpdate(values: SubjectFormValues) {
    await updateSubjectAction(subject.exam_id, subject.id, values);
  }

  async function handleDelete() {
    try {
      await deleteSubjectAction(subject.exam_id, subject.id);
      toast.success("Subject deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete subject");
    }
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <Link
            href={`/exams/${subject.exam_id}/subjects/${subject.id}`}
            className="hover:underline"
          >
            <CardTitle className="text-base">{subject.name}</CardTitle>
          </Link>
          {subject.estimated_hours != null && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {subject.estimated_hours}h estimated
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <SubjectDialog
              examId={subject.exam_id}
              subject={subject}
              onSave={handleUpdate}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              }
            />
            <ConfirmDialog
              title="Delete subject?"
              description={`This will permanently delete "${subject.name}" and all chapters and topics inside it.`}
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={subject.priority} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{formatPercent(subject.completion_pct)}</span>
          </div>
          <Progress value={subject.completion_pct} />
        </div>
      </CardContent>
    </Card>
  );
}
