import { createClient } from "@/lib/supabase/client";
import type { Staff } from "./types";

export async function listStaff(): Promise<Staff[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff_data")
    .select("*")
    .neq("active", false)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Staff[];
}

export async function getStaff(id: string): Promise<Staff | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff_data")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Staff;
}

export async function createStaff(
  staff: Omit<Staff, "id"> & { email: string; phone: string },
): Promise<Staff> {
  const supabase = createClient();
  const { data: user, error: userError } = await supabase.functions.invoke(
    "create_user",
    {
      body: { email: staff.email, phone: staff.phone },
    },
  );

  console.log(user, staff);
  if (userError) throw userError;
  const { data, error } = await supabase
    .from("staff")
    .insert({
      id: user.user.id,
      name: staff.name,
      mention_name: staff.mention_name,
      position: staff.position,
      role: staff.role,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Staff;
}

export async function updateStaff(
  id: string,
  updates: Partial<Staff> & { email?: string; phone?: string },
): Promise<Staff> {
  const supabase = createClient();

  const { data: user, error: userError } = await supabase.functions.invoke(
    "edit_user",
    {
      body: { user_id: id, email: updates.email, phone: updates.phone },
    },
  );

  if (userError) throw userError;

  delete updates.email;
  delete updates.phone;

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
  const { data, error } = await supabase
    .from("staff")
    .update({ active: false })
    .eq("id", id);
  if (error) throw error;
}
