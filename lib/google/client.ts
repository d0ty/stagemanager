"use server";

import { google } from "googleapis";
import { get } from "@vercel/edge-config";
import { updateEdgeConfig } from "../edge-config";

const getUrl = (protocol: string = "http:", host: string = "localhost:3000") =>
  `${protocol}//${host}/auth/google/callback`;

async function getGoogleOauthClient(
  protocol: string = "http:",
  host: string = "localhost:3000",
) {
  const {
    web: { client_id, client_secret },
  } = JSON.parse(Buffer.from(process.env.DRIVE_CREDS!, "base64").toString());

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    getUrl(protocol, host),
  );

  oauth2Client.on("tokens", async (tokens) => {
    console.log("token refreshing");
    const configSuccess = await updateEdgeConfig({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    if (!configSuccess) console.error("token refresh failed");
  });

  return oauth2Client;
}

export async function getGoogleAuthClient() {
  const oauth2Client = await getGoogleOauthClient();

  oauth2Client.setCredentials({
    refresh_token: await get("refresh_token"),
  });

  return oauth2Client;
}

export async function setupDrive() {
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

export async function getRedirectURL(protocol: string, host: string) {
  const oauth2Client = await getGoogleOauthClient(protocol, host);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive"],
    prompt: "consent",
  });
}

export async function authenticateUsingCode(code: string, url: URL) {
  const oauth2Client = await getGoogleOauthClient();
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: getUrl(url.protocol, url.host),
  });
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}
