import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ChapterInsert = Database["public"]["Tables"]["chapters"]["Insert"];
type ChapterUpdate = Database["public"]["Tables"]["chapters"]["Update"];

export async function listChaptersForSubject(subjectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createChapter(input: Omit<ChapterInsert, "user_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("chapters")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChapter(chapterId: string, input: ChapterUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapters")
    .update(input)
    .eq("id", chapterId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChapter(chapterId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
  if (error) throw error;
}
