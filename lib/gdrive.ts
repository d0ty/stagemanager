"use server";

import { google } from "googleapis";
import { Program, ProgramFile } from "./db/types";
import { createClient } from "./supabase/server.ts";
import {Readable} from "node:stream";
import {ReadableStream} from "node:stream/web";

async function setupAuth() {
  if (google.auth.apiKey) return;
  const oauth2Client = new google.auth.OAuth2(
    process.env.DRIVE_CLIENT_ID,
    process.env.DRIVE_CLIENT_SECRET,
    "http://localhost:8080"
  );
  oauth2Client.setCredentials({refresh_token: process.env.DRIVE_TOKEN});

  return google.drive({ version: "v3", auth: oauth2Client }) ?? null;
}

async function add_permission(drive: any, fileId: string, type: string = "anyone", role: string = "writer", emailAddress: string | undefined, pendingOwner: true | undefined = undefined) {
  await drive!.permissions.create({
    requestBody: {
      type,
      role,
      emailAddress,
      transferOwnership: (role == "owner") ? true : undefined,
      pendingOwner,
    },
    fileId,
    fields: "id",
  });
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

  await add_permission(drive, folder.data.id!, "user", "writer", "pokgtech.a@gmail.com", true);

  const { error } = await (await createClient())
    .from("program")
    .update({ folder: folder.data.id })
    .eq("id", program.id);
  if (error) throw error;
}

function getMediaType(content_type: string) {
  switch (content_type) {
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
      if (content_type.startsWith("image/")) return "gdrive/image";
      if (content_type.startsWith("video/")) return "gdrive/video";
      if (content_type.startsWith("audio/")) return "gdrive/audio";
      return null;
  }
}

export async function upload_program_media(
  program: Program,
  file: Buffer,
  content_type: string,
  filename: string,
  user_id: string,
) {
  const drive = await setupAuth()!;

  const result_file = await drive!.files.create({
    requestBody: {
      name: filename,
      parents: [program.folder!],
    },
    fields: "id",
    media: {
      mimeType: content_type,
      body: Readable.from(file),
    },
  });


  const mediaType = getMediaType(content_type);
  const { error } = await (await createClient()).from("program_file").insert({
    program: program.id,
    file_name: filename,
    mime_type: mediaType,
    uploaded_at: new Date().toISOString(),
    uploaded_by: user_id,
    file_url: result_file.data.id!,
  });
  if (error) throw error;
}

export async function delete_program_media(program_file: ProgramFile) {
  if (program_file.mime_type !== "link") {
    await (await setupAuth())!.files.update({
      fileId: program_file.file_url ?? undefined,
      requestBody: {
        trashed: true,
      },
    });
  }

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
