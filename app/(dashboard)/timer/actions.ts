"use server";

import { revalidatePath } from "next/cache";
import { logStudySession } from "@/services/sessions.service";

export async function logSessionAction(input: {
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  is_pomodoro: boolean;
  topic_id?: string | null;
}) {
  if (input.duration_seconds <= 0) return null;
  const session = await logStudySession(input);
  revalidatePath("/dashboard");
  revalidatePath("/timer");
  return session;
}
