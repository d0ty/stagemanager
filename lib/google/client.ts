"use server";

import { google } from "googleapis";
import { get } from "@vercel/edge-config";

async function getGoogleOauthClient() {
  const {
    web: { client_id, client_secret },
  } = JSON.parse(Buffer.from(process.env.DRIVE_CREDS!, "base64").toString());

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://localhost:3000/auth/google/callback",
  );

  return oauth2Client;
}

export async function getGoogleAuthClient() {
  const oauth2Client = await getGoogleOauthClient();

  oauth2Client.setCredentials({
    refresh_token: await get("refresh_token"),
  });

  console.log("token refresh");
  // console.log(await oauth2Client.refreshAccessToken());
  console.log(oauth2Client.credentials);
  console.log(await oauth2Client.getAccessToken());

  return oauth2Client;
}

export async function setupAuth() {
  const oauth2Client = await getGoogleAuthClient();
  return google.drive({ version: "v3", auth: oauth2Client }) ?? null;
}

export async function checkToken() {
  const accessToken = await get("access_token");
  const resp = await fetch(
    "https://oauth2.googleapis.com/tokeninfo?access_token=" + accessToken,
  );
  return resp.ok;
}

export async function getRedirectURL() {
  const oauth2Client = await getGoogleOauthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive"],
    prompt: "consent",
  });
}

export async function authenticateUsingCode(code: string) {
  const oauth2Client = await getGoogleOauthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}
