"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProgram } from "@/lib/db/program";
import { listStaff } from "@/lib/db/staff";
import type { EquipmentInventory, Program, ProgramState } from "@/lib/db/types";
import { createEquipmentLoan } from "@/lib/db";
import { formatDateTime } from "@/lib/date";

export default function NewProgramPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    date: "",
    location: "",
    description: "",
    status: "varakozo" as ProgramState,
    leader: "",
    foh_list: "",
    stage_list: "",
    other_list: "",
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const createMutation = useMutation({
    mutationFn: (prog: Omit<Program, "id">) =>
      createProgram(prog).then((prog_id) => {
        ["foh", "stage", "egyeb"].forEach((inv) =>
          createEquipmentLoan({
            start_date: formatDateTime(new Date()),
            expected_return_date: prog_id.date,
            return_date: null,
            inventory: inv as EquipmentInventory,
            status: "aktiv",
            taken_by: {
              type: "staff",
              staff: prog_id.leader ?? undefined,
              program: prog_id.id,
            },
            notes: `Taken for ${prog_id.description} to ${inv}`,
          }),
        );
        return prog_id;
      }),
    onSuccess: (data) => {
      router.push(`/programs/${data.id}`);
    },
    onError: (error) => {
      alert("Hiba történt a program létrehozása során: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const programData = {
      date: formData.date ? new Date(formData.date).toISOString() : null,
      location: formData.location || null,
      description: formData.description || null,
      status: formData.status,
      leader: formData.leader || null,
      foh_list: null,
      stage_list: null,
      other_list: null,
    };

    createMutation.mutate(programData);
  };

  const handleChange = (field: string, value: string | ProgramState) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center gap-4">
        <Link href="/programs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Új Program</h1>
          <p className="text-slate-500">
            Hozz létre egy új rendezvényt vagy programot
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Program Részletek
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description">
                  Program Neve / Leírás <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  placeholder="pl. Karácsonyi koncert"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Helyszín <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="pl. Főtéri Színpad"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">
                  Dátum és Időpont <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Állapot</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleChange("status", value as ProgramState)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="varakozo">Várakozó</SelectItem>
                    <SelectItem value="tervezes">Tervezés</SelectItem>
                    <SelectItem value="proba_alatt">Próba alatt</SelectItem>
                    <SelectItem value="veglegesites">Véglegesítés</SelectItem>
                    <SelectItem value="lezarva">Lezárva</SelectItem>
                    <SelectItem value="lemondva">Lemondva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="leader">Felelős Személy</Label>
                <Select
                  value={formData.leader}
                  onValueChange={(value) => handleChange("leader", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz felelőst..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nincs kijelölve</SelectItem>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name || staff.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/programs">
                <Button type="button" variant="outline">
                  Mégse
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={createMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Mentés..." : "Program Létrehozása"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
