import { updateEdgeConfig } from "@/lib/edge-config";
import { getGoogleAuthClient } from "@/lib/google";

export async function GET() {
  const auth = await getGoogleAuthClient();
  const result = await updateEdgeConfig({
    access_token: auth.credentials.access_token,
    refresh_token: auth.credentials.refresh_token,
  });
  return new Response(result ? "OK" : "Failed", { status: result ? 200 : 500 });
}
