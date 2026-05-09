import { createClient } from "@/lib/supabase/client";
import type {CrewMember, CrewMemberResult} from "./types";

export async function getCrewByProgram(programId: number): Promise<CrewMemberResult[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("crew_member")
    .select("*")
    .eq("program", programId);
  if (error) throw error;
  if(!data) return [];

  return [...new Set(data.map((member: CrewMember) => member.staff))]
      .map((staff_id) => {
        return {
          staff: staff_id,
          roles: data
                .filter((member: CrewMember) => member.staff == staff_id)
        };
  })
}

export async function createCrewMember(
  member: Omit<CrewMember, "id">
): Promise<CrewMember> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("crew_member")
    .insert(member as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as CrewMember;
}

export async function deleteCrewMember(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("crew_member").delete().eq("id", id);
  if (error) throw error;
}
