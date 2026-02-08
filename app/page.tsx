"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.startsWith("#error=access_denied")) {
      router.replace("/auth/error" + hash);
      return;
    }

    if (hash.startsWith("#access_token")) {
      router.replace("/auth/update-password" + hash);
      return;
    }

    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user) router.replace("/dashboard");
      });
  }, [router]);

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
