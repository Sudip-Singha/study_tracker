import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type TopicInsert = Database["public"]["Tables"]["topics"]["Insert"];
type TopicUpdate = Database["public"]["Tables"]["topics"]["Update"];

export async function listTopicsForChapter(chapterId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTopic(input: Omit<TopicInsert, "user_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("topics")
    .insert({ ...input, user_id: user.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTopic(topicId: string, input: TopicUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .update(input as any)
    .eq("id", topicId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTopic(topicId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("topics").delete().eq("id", topicId);
  if (error) throw error;
}

/** Convenience used by the Dashboard "pending topics" stat. */
export async function countPendingTopics() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("topics")
    .select("*", { count: "exact", head: true })
    .neq("status", "completed")
    .neq("status", "skipped");
  if (error) throw error;
  return count ?? 0;
}
