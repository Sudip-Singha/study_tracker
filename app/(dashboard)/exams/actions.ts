"use server";

import { revalidatePath } from "next/cache";
import { examSchema } from "@/lib/validations/exam";
import { createExam, updateExam, deleteExam } from "@/services/exams.service";

export async function createExamAction(input: unknown) {
  const parsed = examSchema.parse(input);
  const exam = await createExam({
    ...parsed,
    target_date: parsed.target_date || null,
    description: parsed.description || null,
  });
  revalidatePath("/exams");
  revalidatePath("/dashboard");
  return exam;
}

export async function updateExamAction(examId: string, input: unknown) {
  const parsed = examSchema.partial().parse(input);
  const exam = await updateExam(examId, {
    ...parsed,
    target_date: parsed.target_date || null,
    description: parsed.description || null,
  });
  revalidatePath("/exams");
  revalidatePath("/dashboard");
  return exam;
}

export async function deleteExamAction(examId: string) {
  await deleteExam(examId);
  revalidatePath("/exams");
  revalidatePath("/dashboard");
}
