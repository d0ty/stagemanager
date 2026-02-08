"use client";

import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function Home() {
  if (window.location.hash.startsWith("#error=access_denied")) {
    redirect("/auth/error" + window.location.hash);
  }

  if (window.location.hash.startsWith("#access_token")) {
    redirect("/auth/update-password" + window.location.hash);
  }

  createClient()
    .auth.getUser()
    .then((user) => {
      if (user) redirect("/dashboard");
    });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          StageManager
        </h1>
        <p className="text-slate-500">Pro Audio & Event Soft</p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Bejelentkezés
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
