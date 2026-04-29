"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Save, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProgram, getProgram, updateProgram } from "@/lib/db/program";
import { listStaff } from "@/lib/db/staff";
import type { ProgramState } from "@/lib/db/types";

export default function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const programId = parseInt(id, 10);
  const router = useRouter();

  const [formData, setFormData] = useState({
    date: "",
    location: "",
    description: "",
    status: "varakozo" as ProgramState,
    leader: "",
  });

  const { data: program, isLoading } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => getProgram(programId),
    enabled: !isNaN(programId),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  useEffect(() => {
    if (program) {
      setFormData({
        date: program.date
          ? new Date(program.date).toISOString().slice(0, 16)
          : "",
        location: program.location || "",
        description: program.description || "",
        status: program.status || "varakozo",
        leader: program.leader || "",
      });
    }
  }, [program]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateProgram>[1]) =>
      updateProgram(programId, data),
    onSuccess: () => {
      router.push(`/programs/${programId}`);
    },
    onError: (error) => {
      alert("Hiba történt a program frissítése során: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProgram(programId),
    onSuccess: () => {
      window.location.replace(`/programs`);
    },
    onError: (error) => {
      alert("Hiba történt a program törlése során: " + error.message);
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        "Biztosan törölni szeretnéd ezt a programot? Figyelem: nem visszavonható művelet",
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const programData = {
      date: formData.date ? new Date(formData.date).toISOString() : null,
      location: formData.location || null,
      description: formData.description || null,
      status: formData.status,
      leader: formData.leader || null,
    };

    updateMutation.mutate(programData);
  };

  const handleChange = (field: string, value: string | ProgramState) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isNaN(programId)) {
    return (
      <div className="p-8 text-center text-slate-500">
        Érvénytelen program azonosító.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center">Betöltés...</div>;
  }

  if (!program) {
    return (
      <div className="p-8 text-center text-red-500">
        A program nem található.
      </div>
    );
  }

  console.log(program, formData);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/programs/${programId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Program Szerkesztése
          </h1>
          <p className="text-slate-500">{program.description || "Program"}</p>
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
                  onValueChange={(value) => {
                    if (!value) return;
                    handleChange("status", value as ProgramState);
                  }}
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
                  onValueChange={(value) => {
                    if (!value) return;
                    handleChange("leader", value);
                  }}
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
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDelete()}
              >
                <Trash className="w-4 h-4 mr-2" />
                Törlés
              </Button>
              <div className="gap-3 flex">
                <Link href={`/programs/${programId}`}>
                  <Button type="button" variant="outline">
                    Mégse
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending
                    ? "Mentés..."
                    : "Változtatások Mentése"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
