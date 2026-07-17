"use server";

import { revalidatePath } from "next/cache";
import { chapterSchema } from "@/lib/validations/chapter";
import { createChapter, updateChapter, deleteChapter } from "@/services/chapters.service";

export async function createChapterAction(
  examId: string,
  subjectId: string,
  input: unknown
) {
  const parsed = chapterSchema.parse(input);
  const chapter = await createChapter({
    ...parsed,
    subject_id: subjectId,
    estimated_time: parsed.estimated_time ?? null,
    notes: parsed.notes || null,
  });
  revalidatePath(`/exams/${examId}/subjects/${subjectId}`);
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
  return chapter;
}

export async function updateChapterAction(
  examId: string,
  subjectId: string,
  chapterId: string,
  input: unknown
) {
  const parsed = chapterSchema.partial().parse(input);
  const chapter = await updateChapter(chapterId, {
    ...parsed,
    estimated_time: parsed.estimated_time ?? null,
    notes: parsed.notes || null,
  });
  revalidatePath(`/exams/${examId}/subjects/${subjectId}`);
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
  return chapter;
}

export async function deleteChapterAction(
  examId: string,
  subjectId: string,
  chapterId: string
) {
  await deleteChapter(chapterId);
  revalidatePath(`/exams/${examId}/subjects/${subjectId}`);
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
}
