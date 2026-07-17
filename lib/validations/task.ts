import { z } from "zod";
import { prioritySchema } from "./shared";

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  priority: prioritySchema.default("medium"),
  related_exam_id: z.string().uuid().optional().or(z.literal("")),
  related_subject_id: z.string().uuid().optional().or(z.literal("")),
  related_topic_id: z.string().uuid().optional().or(z.literal("")),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
