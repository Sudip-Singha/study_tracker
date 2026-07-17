"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExamForm } from "@/components/exams/exam-form";
import type { ExamFormValues } from "@/lib/validations/exam";
import type { Exam } from "@/types/domain";

export function ExamDialog({
  trigger,
  exam,
  onSave,
}: {
  trigger: React.ReactNode;
  exam?: Exam;
  onSave: (values: ExamFormValues) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(values: ExamFormValues) {
    try {
      await onSave(values);
      toast.success(exam ? "Exam updated" : "Exam created");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{exam ? "Edit exam" : "New exam"}</DialogTitle>
        </DialogHeader>
        <ExamForm
          defaultValues={exam}
          onSubmit={handleSubmit}
          submitLabel={exam ? "Save changes" : "Create exam"}
        />
      </DialogContent>
    </Dialog>
  );
}
