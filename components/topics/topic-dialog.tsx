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
import { TopicForm } from "@/components/topics/topic-form";
import type { TopicFormValues } from "@/lib/validations/topic";
import type { Topic } from "@/types/domain";

export function TopicDialog({
  trigger,
  chapterId,
  topic,
  onSave,
}: {
  trigger: React.ReactNode;
  chapterId: string;
  topic?: Topic;
  onSave: (values: TopicFormValues) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(values: TopicFormValues) {
    try {
      await onSave(values);
      toast.success(topic ? "Topic updated" : "Topic created");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{topic ? "Edit topic" : "New topic"}</DialogTitle>
        </DialogHeader>
        <TopicForm
          chapterId={chapterId}
          defaultValues={topic}
          onSubmit={handleSubmit}
          submitLabel={topic ? "Save changes" : "Create topic"}
        />
      </DialogContent>
    </Dialog>
  );
}
