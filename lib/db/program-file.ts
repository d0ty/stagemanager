import { createClient } from "@/lib/supabase/client";
import type { ProgramFile } from "./types";

export async function getProgramFiles(programId: number): Promise<ProgramFile[]> {
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
  file: Omit<ProgramFile, "id">
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
  filePath?: string
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

// Upload file and create database record
export async function uploadProgramFile(
  programId: number,
  file: File
): Promise<ProgramFile> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Create a unique file path
  const fileExt = file.name.split(".").pop();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${Date.now()}-${sanitizedName}`;
  const filePath = `program-${programId}/${fileName}`;

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("program-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("program-files").getPublicUrl(filePath);

  // Create database record
  const fileRecord: Omit<ProgramFile, "id"> = {
    program: programId,
    file: uploadData.path, // Store path in legacy field
    file_name: file.name,
    file_path: uploadData.path,
    file_size: file.size,
    mime_type: file.type,
    file_url: publicUrl,
    uploaded_at: new Date().toISOString(),
    uploaded_by: user?.id || null,
  };

  return createProgramFile(fileRecord);
}
