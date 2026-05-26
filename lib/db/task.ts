import { createClient } from "@/lib/supabase/client";
import type { Task, TaskType } from "./types";

export async function listTasks(type?: TaskType): Promise<Task[]> {
  const supabase = createClient();
  let query = supabase.from("task").select("*");
  if (type) query = query.eq("type", type);
  const { data, error } = await query.order("id", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getTasksByProgram(programId: number): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task")
    .select("*")
    .eq("program", programId);
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getSoundTasks(programId: number): Promise<Task[]> {
  return getTasksByProgram(programId).then((tasks) =>
    tasks.filter((t) => t.type === "sound"),
  );
}

export async function getLightTasks(programId: number): Promise<Task[]> {
  return getTasksByProgram(programId).then((tasks) =>
    tasks.filter((t) => t.type === "light"),
  );
}

export async function createTask(task: Omit<Task, "id">): Promise<Task> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task")
    .insert(task as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  id: number,
  updates: Partial<Task>,
): Promise<Task> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function closeTasksByProgram(programId: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("task")
    .update({ status: "kesz" })
    .eq("program", programId);
  if (error) throw error;
}

export async function deleteTask(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("task").delete().eq("id", id);
  if (error) throw error;
}
