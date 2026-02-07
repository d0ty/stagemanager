import { createClient } from "@/lib/supabase/client";
import type { Rehearsal } from "./types";

export async function getRehearsalsByProgram(
  programId: number
): Promise<Rehearsal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rehearsal")
    .select("*")
    .eq("program", programId);
  if (error) throw error;
  return (data ?? []) as Rehearsal[];
}

export async function createRehearsal(
  rehearsal: Omit<Rehearsal, "id">
): Promise<Rehearsal> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rehearsal")
    .insert(rehearsal as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Rehearsal;
}

export async function updateRehearsal(
  id: number,
  updates: Partial<Rehearsal>
): Promise<Rehearsal> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rehearsal")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Rehearsal;
}

export async function deleteRehearsal(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("rehearsal").delete().eq("id", id);
  if (error) throw error;
}
