import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ExamInsert = Database["public"]["Tables"]["exams"]["Insert"];
type ExamUpdate = Database["public"]["Tables"]["exams"]["Update"];

export async function listExams() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("target_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function getExam(examId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exams").select("*").eq("id", examId).single();
  if (error) throw error;
  return data;
}

export async function createExam(input: Omit<ExamInsert, "user_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("exams")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExam(examId: string, input: ExamUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exams")
    .update(input)
    .eq("id", examId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExam(examId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("exams").delete().eq("id", examId);
  if (error) throw error;
}
