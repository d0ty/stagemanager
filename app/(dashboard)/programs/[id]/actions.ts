"use server";

import {
  upload_program_media,
  delete_program_media,
  get_program_media_link,
} from "@/lib/gdrive";
import { createClient } from "@/lib/supabase/server";
import type { ProgramFile } from "@/lib/db/types";

export async function uploadFilesAction(
  programId: number,
  formData: FormData,
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nem vagy bejelentkezve.");

  const { data: program, error } = await supabase
    .from("program")
    .select("*")
    .eq("id", programId)
    .single();
  if (error || !program) throw new Error("A program nem található.");

  const files = formData.getAll("files") as File[];
  for (const file of files) {
    await upload_program_media(program, Buffer.from(await file.arrayBuffer()), file.type, file.name, user.id);
  }
}

export async function deleteFileAction(
  programFile: ProgramFile,
): Promise<void> {
  await delete_program_media(programFile);
}

export async function getFileLinkAction(
  programFile: ProgramFile,
): Promise<string> {
  return get_program_media_link(programFile);
}
