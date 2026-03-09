"use server";

import { google } from "googleapis";
import { Program, ProgramFile } from "./db/types";
import { createClient } from "./supabase/server.ts";
import {Readable} from "node:stream";

async function setupAuth() {
  if (google.auth.apiKey) return;
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(
      Buffer.from(process.env.DRIVE_CREDENTIALS!, "base64").toString("utf-8"),
    ),
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.apps.readonly",
    ],
  });

  const client = await auth.getClient();
  return google.drive({ version: "v3", auth }) ?? null;
}

export async function createProgramFolder(program: Program) {
  const drive = await setupAuth()!;
  const folderName = `${program.date} - ${program.description}`;
  const folder = await drive!.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [process.env.DRIVE_ROOT!],
    },
    fields: "id",
  });

  const { error } = await (await createClient())
    .from("program")
    .update({ folder: folder.data.id })
    .eq("id", program.id);
  if (error) throw error;
}

function getMediaType(file: File) {
  switch (file.type) {
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
    case "application/vnd.oasis.opendocument.text":
    case "application/pdf":
      return "gdrive/docs";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.oasis.opendocument.spreadsheet":
      return "gdrive/sheets";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.oasis.opendocument.presentation":
      return "gdrive/slides";
    default:
      if (file.type.startsWith("image/")) return "gdrive/image";
      if (file.type.startsWith("video/")) return "gdrive/video";
      if (file.type.startsWith("audio/")) return "gdrive/audio";
      return null;
  }
}

export async function upload_program_media(
  program: Program,
  file: File,
  user_id: string,
) {
  const drive = await setupAuth()!;

  const result_file = await drive!.files.create({
    requestBody: {
      name: file.name,
      parents: [program.folder!],
    },
    fields: "id",
    media: {
      mimeType: file.type,
      body: Readable.from(file.stream()),
    },
  });

  await drive!.permissions.create({
    requestBody: {
      type: "anyone",
      role: "writer",
    },
    fileId: result_file.data.id!,
    fields: "id",
  });

  const mediaType = getMediaType(file);
  const { error } = await (await createClient()).from("program_file").insert({
    program: program.id,
    file_name: file.name,
    mime_type: mediaType,
    uploaded_at: new Date().toISOString(),
    uploaded_by: user_id,
    file_url: result_file.data.id!,
  });
  if (error) throw error;
}

export async function delete_program_media(program_file: ProgramFile) {
  await (await setupAuth())!.files.update({
    fileId: program_file.file_url ?? undefined,
    requestBody: {
      trashed: true,
    },
  });

  await (await createClient())
    .from("program_file")
    .delete()
    .eq("id", program_file.id);
}

export async function get_program_media_link(
  program_file: ProgramFile,
): Promise<string> {
  return `https://drive.google.com/file/d/${program_file.file_url}/view?usp=sharing`;
}
