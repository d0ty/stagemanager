"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { RoleView } from "@/lib/db/types";

export type Category = "equipment" | "programs" | "staff" | "tasks" | "chat" | "admin_settings";
export type Action = "view" | "create" | "edit" | "delete" | "send";

const CATEGORY_TO_VIEW: Record<Category, RoleView | null> = {
  equipment: "equipment",
  programs: "programs",
  staff: "staff",
  tasks: "task",
  chat: "chat",
  admin_settings: "settings",
};

const ACTION_TO_COLUMN = {
  view: "read" as const,
  create: "add" as const,
  edit: "update" as const,
  delete: "delete" as const,
  send: "add" as const,
};

export function usePermissions() {
  const supabase = createClient();

  const { data: staff } = useQuery({
    queryKey: ["staff", "current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("staff")
        .select('*, role:role(id, name, "add", "read", "update", "delete")')
        .eq("id", user.id)
        .single();
      return data;
    },
  });

  const can = (category: Category, action: Action): boolean => {
    if (!staff) return false;
    const role = staff.role as
      | { add?: RoleView[]; read?: RoleView[]; update?: RoleView[]; delete?: RoleView[] }
      | null;
    if (!role) return true;
    const view = CATEGORY_TO_VIEW[category];
    const col = ACTION_TO_COLUMN[action];
    if (!view || !col) return true;
    const arr = role[col];
    return Array.isArray(arr) && arr.includes(view);
  };

  return { can, staff };
}
