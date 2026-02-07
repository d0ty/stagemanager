import { createClient } from "@/lib/supabase/client";
import type { Role } from "./types";

export async function listRoles(): Promise<Role[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("role").select("*").order("id");
  if (error) throw error;
  return (data ?? []) as Role[];
}

export async function createRole(role: Omit<Role, "id">): Promise<Role> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role")
    .insert(role as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Role;
}

export async function updateRole(id: number, updates: Partial<Role>): Promise<Role> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Role;
}

export async function deleteRole(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("role").delete().eq("id", id);
  if (error) throw error;
}
