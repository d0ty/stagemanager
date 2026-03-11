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

export async function linkFileAction(
  programId: number,
  link: string,
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nem vagy bejelentkezve.");

  // Validate URL — only allow http/https to prevent SSRF
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(link);
  } catch {
    throw new Error("Érvénytelen URL.");
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Csak HTTP és HTTPS linkek engedélyezettek.");
  }

  let fileName = link;
  try {
    const response = await fetch(link, {
      signal: AbortSignal.timeout(5000),
    });
    const html = await response.text();
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match?.[1]) {
      // Decode common HTML entities in the title
      fileName = match[1]
        .trim()
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#039;/gi, "'")
        .replace(/&apos;/gi, "'");
    }
  } catch {
    // Fall back to URL as file name
  }

  const { error } = await supabase.from("program_file").insert({
    program: programId,
    file_name: fileName,
    file_url: link,
    mime_type: "link",
    uploaded_at: new Date().toISOString(),
    uploaded_by: user.id,
  });

  if (error) throw error;
}
