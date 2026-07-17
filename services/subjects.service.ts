import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type SubjectInsert = Database["public"]["Tables"]["subjects"]["Insert"];
type SubjectUpdate = Database["public"]["Tables"]["subjects"]["Update"];

export async function listSubjectsForExam(examId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("exam_id", examId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSubject(input: Omit<SubjectInsert, "user_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("subjects")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubject(subjectId: string, input: SubjectUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .update(input)
    .eq("id", subjectId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubject(subjectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
  if (error) throw error;
}
