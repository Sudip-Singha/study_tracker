import { z } from "zod";

export const topicImportSchema = z.string().min(1, "Topic name cannot be empty");

export const chapterImportSchema = z.object({
  name: z.string().min(1, "Chapter name is required"),
  topics: z
    .array(topicImportSchema)
    .min(1, "Each chapter must have at least one topic"),
});

export const subjectImportSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  weightage: z.coerce.number().min(0).max(100).optional(),
  chapters: z
    .array(chapterImportSchema)
    .min(1, "Each subject must have at least one chapter"),
});

export const examImportSchema = z.object({
  name: z.string().min(1, "Exam name is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  exam_date: z.string().optional(), // ISO date string e.g. "2025-06-01"
  subjects: z
    .array(subjectImportSchema)
    .min(1, "Exam must have at least one subject"),
});

export const examImportArraySchema = z.union([
  examImportSchema,
  z.array(examImportSchema).min(1),
]);

export type ExamImport = z.infer<typeof examImportSchema>;
export type ExamImportPayload = z.infer<typeof examImportArraySchema>;
