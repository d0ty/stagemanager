"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { create_user, update_user } from "./actions";
import { Tables } from "@/lib/database.types";
import { useState, useActionState, useEffect } from "react";

const initialData = {
  message: "",
};

export function StaffEditor({
  children,
  data,
}: {
  children: React.ReactNode;
  data?: Tables<"staff_data">;
}) {
  const [state, formAction, pending] = useActionState(
    data ? update_user : create_user,
    initialData,
  );

  useEffect(console.log, [state?.message]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? "Felhasználó szerkesztése" : "Új Munkatárs"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4 mt-4" action={formAction}>
          {data?.id && <input type="hidden" id="id" value={data?.id} />}
          {data?.mention_name && (
            <input type="hidden" id="mention_name" value={data?.mention_name} />
          )}
          {pending && (
            <span className="text-red-600 font-bold">{state?.message}</span>
          )}
          <div className="grid gap-2">
            <Label>Név</Label>
            <Input name="name" id="name" required defaultValue={data?.name} />
          </div>
          <div className="grid gap-2">
            <Label>Munkakörök</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                "hangtechnikus",
                "fenytechnikus",
                "szervezo",
                "stage",
                "egyeb",
              ].map((role) => (
                <label
                  key={role}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="roles"
                    value={role}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 capitalize">
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="grid gap-2 mb-2">
              <Label>Kapcsolattartási e-mail</Label>
              <Input
                name="email"
                id="email"
                type="email"
                placeholder="email@pelda.com"
                required
                defaultValue={data?.email}
              />
            </div>
            <div className="grid gap-2">
              <Label>Kapcsolattartási telefonszám</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+36..."
                defaultValue={data?.phone}
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              className="bg-indigo-600 text-white w-full"
              disabled={pending}
            >
              Mentés
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
