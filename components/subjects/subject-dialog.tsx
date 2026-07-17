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
import { SubjectForm } from "@/components/subjects/subject-form";
import type { SubjectFormValues } from "@/lib/validations/subject";
import type { Subject } from "@/types/domain";

export function SubjectDialog({
  trigger,
  examId,
  subject,
  onSave,
}: {
  trigger: React.ReactNode;
  examId: string;
  subject?: Subject;
  onSave: (values: SubjectFormValues) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(values: SubjectFormValues) {
    try {
      await onSave(values);
      toast.success(subject ? "Subject updated" : "Subject created");
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
          <DialogTitle>{subject ? "Edit subject" : "New subject"}</DialogTitle>
        </DialogHeader>
        <SubjectForm
          examId={examId}
          defaultValues={subject}
          onSubmit={handleSubmit}
          submitLabel={subject ? "Save changes" : "Create subject"}
        />
      </DialogContent>
    </Dialog>
  );
}
