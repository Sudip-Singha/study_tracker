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
import { ChapterForm } from "@/components/chapters/chapter-form";
import type { ChapterFormValues } from "@/lib/validations/chapter";
import type { Chapter } from "@/types/domain";

export function ChapterDialog({
  trigger,
  subjectId,
  chapter,
  onSave,
}: {
  trigger: React.ReactNode;
  subjectId: string;
  chapter?: Chapter;
  onSave: (values: ChapterFormValues) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(values: ChapterFormValues) {
    try {
      await onSave(values);
      toast.success(chapter ? "Chapter updated" : "Chapter created");
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
          <DialogTitle>{chapter ? "Edit chapter" : "New chapter"}</DialogTitle>
        </DialogHeader>
        <ChapterForm
          subjectId={subjectId}
          defaultValues={chapter}
          onSubmit={handleSubmit}
          submitLabel={chapter ? "Save changes" : "Create chapter"}
        />
      </DialogContent>
    </Dialog>
  );
}
