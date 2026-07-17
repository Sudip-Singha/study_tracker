import { z } from "zod";
import { prioritySchema } from "./shared";

export const examSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  target_date: z.string().optional().or(z.literal("")),
  priority: prioritySchema.default("medium"),
  status: z.enum(["planned", "active", "completed", "archived"]).default("planned"),
  expected_marks: z.coerce.number().optional(),
  weightage: z.coerce.number().min(0).default(1),
});

export type ExamFormValues = z.infer<typeof examSchema>;
