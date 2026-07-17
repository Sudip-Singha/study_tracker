"use server";

import { revalidatePath } from "next/cache";
import { topicSchema } from "@/lib/validations/topic";
import { createTopic, updateTopic, deleteTopic } from "@/services/topics.service";

export async function createTopicAction(
  examId: string,
  subjectId: string,
  chapterId: string,
  input: unknown
) {
  const parsed = topicSchema.parse(input);
  const topic = await createTopic({
    ...parsed,
    chapter_id: chapterId,
    estimated_time: parsed.estimated_time ?? null,
    notes: parsed.notes || null,
  });
  revalidatePath(`/exams/${examId}/subjects/${subjectId}/chapters/${chapterId}`);
  revalidatePath(`/exams/${examId}/subjects/${subjectId}`);
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
  return topic;
}

export async function updateTopicAction(
  examId: string,
  subjectId: string,
  chapterId: string,
  topicId: string,
  input: unknown
) {
  const parsed = topicSchema.partial().parse(input);
  const topic = await updateTopic(topicId, {
    ...parsed,
    estimated_time: parsed.estimated_time ?? null,
    notes: parsed.notes || null,
  });
  revalidatePath(`/exams/${examId}/subjects/${subjectId}/chapters/${chapterId}`);
  revalidatePath(`/exams/${examId}/subjects/${subjectId}`);
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
  return topic;
}

export async function deleteTopicAction(
  examId: string,
  subjectId: string,
  chapterId: string,
  topicId: string
) {
  await deleteTopic(topicId);
  revalidatePath(`/exams/${examId}/subjects/${subjectId}/chapters/${chapterId}`);
  revalidatePath(`/exams/${examId}/subjects/${subjectId}`);
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");
}
