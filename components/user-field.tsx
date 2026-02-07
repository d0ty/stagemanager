"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { createClient } from "../lib/supabase/client";
import { UserResponse } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

export function UserField() {
  const client = createClient().auth;
  const [user, setUser] = useState<UserResponse>();

  useEffect(() => {
    client.getUser().then((resp) => {
      console.log(resp);
      setUser(resp);
    });
  }, []);

  const email: string = user?.data?.user?.email || "??";
  const fullName: string = user?.data?.user?.user_metadata?.full_name || "??";
  const avatar =
    user?.data?.user?.user_metadata?.avatar_url || "/placeholder.svg";
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="flex items-center gap-2 flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-4 py-2 w-full hover:bg-slate-800 rounded-lg transition-colors">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={avatar || "/placeholder.svg"}
                  alt={fullName}
                />
                <AvatarFallback className="rounded-lg">??</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{fullName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                client.signOut();
                redirect("/");
              }}
            >
              <LogOut />
              Kijelentkezés
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
