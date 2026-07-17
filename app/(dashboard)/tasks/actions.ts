"use server";

import { revalidatePath } from "next/cache";
import { taskSchema } from "@/lib/validations/task";
import { createTask, updateTask, deleteTask } from "@/services/tasks.service";

export async function createTaskAction(input: unknown) {
  const parsed = taskSchema.parse(input);
  const task = await createTask({
    ...parsed,
    due_date: parsed.due_date || null,
    description: parsed.description || null,
    related_exam_id: parsed.related_exam_id || null,
    related_subject_id: parsed.related_subject_id || null,
    related_topic_id: parsed.related_topic_id || null,
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function toggleTaskAction(taskId: string, status: "todo" | "done") {
  await updateTask(taskId, { status });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTaskAction(taskId: string) {
  await deleteTask(taskId);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
