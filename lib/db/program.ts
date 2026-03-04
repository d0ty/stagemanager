import { createClient } from "@/lib/supabase/client";
import { createProgramFolder } from "@/lib/gdrive";
import type { Program } from "./types";

export async function listPrograms(orderBy = "date"): Promise<Program[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("program")
    .select("*")
    .order(orderBy, { ascending: true });
  if (error) throw error;
  return (data ?? []) as Program[];
}

export async function getProgram(id: number): Promise<Program | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("program")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Program;
}

export async function createProgram(
  program: Omit<Program, "id">,
): Promise<Program> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("program")
    .insert(program as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;

  await createProgramFolder(data as Program);
  return data as Program;
}

export async function updateProgram(
  id: number,
  updates: Partial<Program>,
): Promise<Program> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("program")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Program;
}

export async function deleteProgram(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("program").delete().eq("id", id);
  if (error) throw error;
}
