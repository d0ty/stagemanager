// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: cors_headers,
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization")!,
        },
      },
    },
  );

  const { data: session, error: sessionError } = await supabase.auth.getUser();

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id, role(id, add)")
    .eq("id", session.user.id)
    .single();
  if (staffError) {
    console.error(staffError);
    return new Response(JSON.stringify({ error: "Bad Gateway" }), {
      headers: { "Content-Type": "application/json" },
      status: 502,
    });
  }

  if (!staff.role.add.includes("staff"))
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  const { email, phone } = await req.json();

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  ).auth.admin;

  const { data: user, error: inviteError } =
    await admin.inviteUserByEmail(email);

  if (inviteError) {
    console.error(inviteError);
    return new Response(JSON.stringify({ error: "Bad Gateway" }), {
      headers: { "Content-Type": "application/json" },
      status: 502,
    });
  }

  const { data: updatedUser, error: updateError } = await admin.updateUserById(
    user.user.id,
    {
      phone,
      phone_confirm: true,
    },
  );

  if (inviteError) {
    console.error(inviteError);
    return new Response(JSON.stringify({ error: "Bad Gateway" }), {
      headers: { "Content-Type": "application/json" },
      status: 502,
    });
  }

  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json", ...cors_headers },
    status: 201,
  });
});
