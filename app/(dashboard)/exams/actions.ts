"use server";

import { revalidatePath } from "next/cache";
import { examSchema } from "@/lib/validations/exam";
import { examImportArraySchema, type ExamImport } from "@/lib/validations/exam-import";
import { createExam, updateExam, deleteExam } from "@/services/exams.service";
import { createSubject } from "@/services/subjects.service";
import { createChapter } from "@/services/chapters.service";
import { createTopic } from "@/services/topics.service";

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

/** Bulk-imports one or more complete exam hierarchies from a parsed JSON payload. */
export async function importExamJsonAction(payload: unknown) {
  const parsed = examImportArraySchema.parse(payload);
  const exams: ExamImport[] = Array.isArray(parsed) ? parsed : [parsed];

  const results: Array<{ name: string; subjectCount: number; chapterCount: number; topicCount: number }> = [];

  for (const examData of exams) {
    // Insert exam
    const exam = await createExam({
      name: examData.name,
      description: examData.description ?? null,
      priority: examData.priority,
      target_date: examData.exam_date ?? null,
      status: "planned",
      weightage: 1,
    });

    let chapterCount = 0;
    let topicCount = 0;

    for (const subjectData of examData.subjects) {
      const subject = await createSubject({
        exam_id: exam.id,
        name: subjectData.name,
        weightage: subjectData.weightage ?? undefined,
      });

      for (const chapterData of subjectData.chapters) {
        const chapter = await createChapter({
          subject_id: subject.id,
          name: chapterData.name,
        });
        chapterCount++;

        for (const topicName of chapterData.topics) {
          await createTopic({
            chapter_id: chapter.id,
            name: topicName,
          });
          topicCount++;
        }
      }
    }

    results.push({
      name: exam.name,
      subjectCount: examData.subjects.length,
      chapterCount,
      topicCount,
    });
  }

  revalidatePath("/exams");
  revalidatePath("/dashboard");
  return results;
}
