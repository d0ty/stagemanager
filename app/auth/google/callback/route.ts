import { updateEdgeConfig } from "@/lib/edge-config";
import { authenticateUsingCode } from "@/lib/google";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  const auth = await authenticateUsingCode(code);
  const configSuccess = await updateEdgeConfig({
    access_token: auth.credentials.access_token,
    refresh_token: auth.credentials.refresh_token,
  });
  if (!configSuccess) {
    return new Response("Failed to update edge config", { status: 500 });
  }
  redirect("/dashboard");
}
