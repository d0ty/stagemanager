"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { Tables, Constants } from "@/lib/database.types";
import { refresh } from "next/cache";

function formatData(formData: FormData): Tables<"staff_data"> {
  let positions = Array.from(formData.getAll("roles")).map((x) => x.toString());
  console.log(positions);
  return {
    id: formData.get("id")?.toString() ?? null,
    email: formData.get("email")?.toString() ?? null,
    phone: formData.get("phone")?.toString() ?? null,
    name: formData.get("name")?.toString() ?? null,
    mention_name: formData.get("mention_name")?.toString() ?? null,
    positions: positions as any[],
    role: null,
  };
}

export async function create_user(_: any, formData: FormData) {
  let raw_data: Tables<"staff_data"> = formatData(formData);
  raw_data.mention_name =
    raw_data.name?.toLowerCase().replace(" ", "_") ?? null;

  const supabase = createAdminClient();

  const { data: user_data, error } = await supabase.auth.admin.createUser({
    email: raw_data.email ?? undefined,
    phone: raw_data.phone ?? undefined,
    phone_confirm: false,
  });

  if (error) {
    console.log(error);
    return { message: error.message };
  }

  const { error: pf_error } = await supabase.from("staff").insert({
    id: user_data.user.id,
    name: raw_data.name,
    mention_name: raw_data.mention_name,
    positions: ["egyeb"],
    role: null,
  });

  if (pf_error) {
    console.log(pf_error);
    return { message: pf_error.message };
  }
}

export async function update_user(_: any, formData: FormData) {
  //console.log(formData);
}
