import { createClient } from "@/lib/supabase/client";
import type {
  CrewMember,
  CrewMemberResult,
  CrewPosition,
  Program,
} from "./types";

export async function getCrewByProgram(
  program: Program,
): Promise<CrewMemberResult[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("crew_member")
    .select("*")
    .eq("program", program.id);
  if (error) throw error;
  if (!data) return [];

  return [
    ...new Set([
      program.leader!,
      ...data.map((member: CrewMember) => member.staff),
    ]),
  ].map((staff_id) => {
    let roles = data.filter((member: CrewMember) => member.staff == staff_id);
    if (staff_id === program.leader) {
      roles = [...roles, { id: 0, staff: staff_id, role: "leader" }];
    }
    return {
      staff: staff_id,
      roles,
    };
  });
}

export async function createCrewMember(
  member: Omit<CrewMember, "id">,
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

export function getCrewPositionName(role: CrewPosition | "leader"): string {
  switch (role) {
    case "ugyelo":
      return "Ügyelő";
    case "hangtechnikus":
      return "Hangtechnikus";
    case "fenytechnikus":
      return "Fénytechnikus";
    case "vetito":
      return "Vetítő";
    case "supervisor":
      return "Supervisor";
    case "egyeb":
      return "Egyéb";
    case "ugyeloasszistens":
      return "Ügyelőasszisztens";
    case "szerverzo":
      return "Szervező";
    case "leader":
      return "Vezető technikus";
    default:
      return role;
  }
}
