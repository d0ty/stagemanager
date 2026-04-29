import { createClient } from "@/lib/supabase/client";
import type { Activity } from "./types";

export async function getActivitysByProgram(
  programId: number,
): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity")
    .select("*")
    .eq("program", programId);
  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function createActivity(
  activity: Omit<Activity, "id">,
): Promise<Activity> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity")
    .insert(activity as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Activity;
}

export async function updateActivity(
  id: number,
  updates: Partial<Activity>,
): Promise<Activity> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Activity;
}

export async function deleteActivity(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("activity").delete().eq("id", id);
  if (error) throw error;
}
