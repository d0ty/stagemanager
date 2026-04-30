import { getGoogleAuthClient } from "@/lib/gdrive";

export async function GET() {
  const auth = await getGoogleAuthClient();

  console.log(
    await (await fetch(
      `https://api.vercel.com/v1/edge-config/${new URL(process.env.EDGE_CONFIG!).pathname.split("/")[1]}/items`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        },
        body: JSON.stringify({
          items: [
            {
              operation: "update",
              key: "access_token",
              value: auth.credentials.access_token,
            },
            {
              operation: "update",
              key: "refresh_token",
              value: auth.credentials.refresh_token,
            },
          ],
        }),
      },
    ),
  ).text());

  return new Response("OK", { status: 200 });
}
