"use server";

import { revalidatePath } from "next/cache";
import { subjectSchema } from "@/lib/validations/subject";
import { createSubject, updateSubject, deleteSubject } from "@/services/subjects.service";

export async function createSubjectAction(examId: string, input: unknown) {
  const parsed = subjectSchema.parse(input);
  const subject = await createSubject({
    ...parsed,
    exam_id: examId,
    estimated_hours: parsed.estimated_hours ?? null,
  });
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
  return subject;
}

export async function updateSubjectAction(examId: string, subjectId: string, input: unknown) {
  const parsed = subjectSchema.partial().parse(input);
  const subject = await updateSubject(subjectId, {
    ...parsed,
    estimated_hours: parsed.estimated_hours ?? null,
  });
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
  return subject;
}

export async function deleteSubjectAction(examId: string, subjectId: string) {
  await deleteSubject(subjectId);
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
}
