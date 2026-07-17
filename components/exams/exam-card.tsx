"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
import { ExamDialog } from "@/components/exams/exam-dialog";
import { formatPercent } from "@/lib/utils";
import { updateExamAction, deleteExamAction } from "@/app/(dashboard)/exams/actions";
import type { Exam } from "@/types/domain";
import type { ExamFormValues } from "@/lib/validations/exam";

export function ExamCard({ exam }: { exam: Exam }) {
  async function handleUpdate(values: ExamFormValues) {
    await updateExamAction(exam.id, values);
  }

  async function handleDelete() {
    try {
      await deleteExamAction(exam.id);
      toast.success("Exam deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete exam");
    }
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <Link href={`/exams/${exam.id}`} className="hover:underline">
            <CardTitle>{exam.name}</CardTitle>
          </Link>
          {exam.target_date && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(exam.target_date), "d MMM yyyy")}
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
            <ExamDialog
              exam={exam}
              onSave={handleUpdate}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              }
            />
            <ConfirmDialog
              title="Delete exam?"
              description={`This will permanently delete "${exam.name}" and every subject, chapter, and topic inside it.`}
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
          <PriorityBadge priority={exam.priority} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{formatPercent(exam.completion_pct)}</span>
          </div>
          <Progress value={exam.completion_pct} />
        </div>
      </CardContent>
    </Card>
  );
}
