import { createClient } from "@/lib/supabase/server";

export type TimeBlockInsert = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  activity: string;
  color?: string;
};

export type TimeBlockUpdate = Partial<TimeBlockInsert>;

export async function listTimeBlocks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_blocks")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTimeBlock(input: TimeBlockInsert) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("time_blocks")
    .insert({ ...input, user_id: user.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createMultipleTimeBlocks(inputs: TimeBlockInsert[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const inserts = inputs.map(input => ({ ...input, user_id: user.id }));
  const { data, error } = await supabase
    .from("time_blocks")
    .insert(inserts as any)
    .select();
  if (error) throw error;
  return data;
}

export async function updateTimeBlock(id: string, input: TimeBlockUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_blocks")
    .update(input as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTimeBlock(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("time_blocks").delete().eq("id", id);
  if (error) throw error;
}
