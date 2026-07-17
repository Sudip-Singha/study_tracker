import { z } from "zod";
import { difficultySchema } from "./shared";

export const chapterSchema = z.object({
  subject_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  estimated_time: z.coerce.number().min(0).optional(),
  difficulty: difficultySchema.default("medium"),
  weightage: z.coerce.number().min(0).default(1),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type ChapterFormValues = z.infer<typeof chapterSchema>;
