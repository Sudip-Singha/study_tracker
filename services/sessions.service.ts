import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type SessionInsert = Database["public"]["Tables"]["study_sessions"]["Insert"];

export async function logStudySession(input: Omit<SessionInsert, "user_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({ ...input, user_id: user.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Sum of duration_seconds for the last 7 days, bucketed by day — powers the Dashboard chart. */
export async function getWeeklyStudySeconds() {
  const supabase = await createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("study_sessions")
    .select("started_at, duration_seconds")
    .gte("started_at", sevenDaysAgo.toISOString());
  if (error) throw error;

  const byDay = new Map<string, number>();
  for (const row of data) {
    const day = row.started_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + row.duration_seconds);
  }
  return byDay;
}

/**
 * Sum of duration_seconds for a given calendar month, bucketed by day.
 * Returns a Map of "YYYY-MM-DD" → total seconds.
 */
export async function getMonthlyStudySeconds(year: number, month: number) {
  const supabase = await createClient();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1); // exclusive: first day of next month

  const { data, error } = await supabase
    .from("study_sessions")
    .select("started_at, duration_seconds")
    .gte("started_at", start.toISOString())
    .lt("started_at", end.toISOString());
  if (error) throw error;

  const byDay = new Map<string, number>();
  for (const row of data) {
    const day = row.started_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + row.duration_seconds);
  }
  return byDay;
}

export async function getStudyStreak(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_study_streak", { p_user_id: userId });
  if (error) throw error;
  return data ?? 0;
}
