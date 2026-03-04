"use server";

import { TsGoogleDrive } from "ts-google-drive";
import { Program } from "./db/types";
import { createClient } from "./supabase/server.ts";

const drive = new TsGoogleDrive({
  credentials: JSON.parse(
    Buffer.from(process.env.DRIVE_CREDENTIALS!, "base64").toString(),
  ),
});

export async function createProgramFolder(program: Program) {
  const folderName = `${program.date} - ${program.description}`;
  const folder = await drive.createFolder({
    name: folderName,
    parent: process.env.DRIVE_ROOT!,
  });

  const { error } = await (await createClient())
    .from("program")
    .update({ folder: folder.id })
    .eq("id", program.id);
  if (error) throw error;
}
