import { z } from "zod";
import { prioritySchema } from "./shared";

export const subjectSchema = z.object({
  exam_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  estimated_hours: z.coerce.number().min(0).optional(),
  priority: prioritySchema.default("medium"),
  weightage: z.coerce.number().min(0).default(1),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;
