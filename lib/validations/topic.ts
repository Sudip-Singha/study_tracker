import { z } from "zod";
import { prioritySchema, difficultySchema } from "./shared";

export const topicSchema = z.object({
  chapter_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  status: z.enum(["not_started", "in_progress", "completed", "skipped"]).default("not_started"),
  priority: prioritySchema.default("medium"),
  difficulty: difficultySchema.default("medium"),
  estimated_time: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  is_bookmarked: z.boolean().default(false),
  is_favorite: z.boolean().default(false),
  revision_required: z.boolean().default(false),
  weightage: z.coerce.number().min(0).default(1),
});

export type TopicFormValues = z.infer<typeof topicSchema>;
