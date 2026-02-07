import { createClient } from "@/lib/supabase/client";
import type { Staff } from "./types";

export async function listStaff(): Promise<Staff[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("staff").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Staff[];
}

export async function getStaff(id: string): Promise<Staff | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("staff").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Staff;
}

export async function createStaff(
  staff: Omit<Staff, "id"> & { id?: string }
): Promise<Staff> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff")
    .insert(staff as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Staff;
}

export async function updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Staff;
}

export async function deleteStaff(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("staff").delete().eq("id", id);
  if (error) throw error;
}
