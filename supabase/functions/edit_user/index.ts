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
    .select("id, role(id, update)")
    .eq("id", session.user.id)
    .single();
  if (staffError) {
    console.error(staffError);
    return new Response(JSON.stringify({ error: "Bad Gateway" }), {
      headers: { "Content-Type": "application/json" },
      status: 502,
    });
  }

  if (!staff.role.update.includes("staff"))
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  const { user_id, email, phone } = await req.json();

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  ).auth.admin;

  const { data: updatedUser, error: updateError } = await admin.updateUserById(
    user_id,
    {
      email,
      email_confirm: true,
      phone,
      phone_confirm: true,
    },
  );

  if (updateError) {
    console.error(updateError);
    return new Response(JSON.stringify({ error: "Bad Gateway" }), {
      headers: { "Content-Type": "application/json" },
      status: 502,
    });
  }

  return new Response(null, {
    headers: cors_headers,
    status: 204,
  });
});
