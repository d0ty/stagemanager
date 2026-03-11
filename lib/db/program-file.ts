import { createClient } from "@/lib/supabase/client";
import type { ProgramFile, Staff } from "./types";

export async function getProgramFiles(
  programId: number,
): Promise<ProgramFile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("program_file")
    .select("*")
    .eq("program", programId)
    .order("id", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProgramFile[];
}

export async function createProgramFile(
  file: Omit<ProgramFile, "id">,
): Promise<ProgramFile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("program_file")
    .insert(file as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as ProgramFile;
}

export async function deleteProgramFile(
  id: number,
  filePath?: string,
): Promise<void> {
  const supabase = createClient();

  // Delete file from storage if path provided
  if (filePath) {
    await supabase.storage.from("program-files").remove([filePath]);
  }

  // Delete database record
  const { error } = await supabase.from("program_file").delete().eq("id", id);
  if (error) throw error;
}

export async function link_program_media(
  program: number,
  link: string,
  user: Staff,
) {
  const supabase = createClient();

  const { error } = await supabase.from("program_file").insert({
    program,
    file_name: link,
    file_url: link,
    mime_type: "link",
    uploaded_at: new Date().toISOString(),
    uploaded_by: user.id,
  });

  if (error) throw error;
}
