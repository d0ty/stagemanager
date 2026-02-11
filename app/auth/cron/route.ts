import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supa = await createClient();

  await supa.from("programs").select();

  return new Response(null, { status: 204 });
}
