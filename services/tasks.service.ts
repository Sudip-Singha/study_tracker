import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export async function listTasks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function listTasksDueToday() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("due_date", today)
    .eq("status", "todo")
    .order("priority", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTask(input: Omit<TaskInsert, "user_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...input, user_id: user.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, input: TaskUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(input as any)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}
