"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import {
  Edit,
  Trash2,
  User,
  Calendar,
  MapPin,
  Search,
  MoreVertical,
  History,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listPrograms, deleteProgram } from "@/lib/db/program";
import { listStaff } from "@/lib/db/staff";
import { usePermissions } from "@/hooks/use-permissions";

export default function ProgramsPage() {
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: () => listPrograms("date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["programs"] }),
  });

  const getLeaderName = (leaderId: string | null) => {
    if (!leaderId) return "Nincs felelős";
    const s = staffList.find((st) => st.id === leaderId);
    return s?.name ?? "Nincs felelős";
  };

  const filteredPrograms = programs.filter(
    (p) =>
      (p.description?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (p.location?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
  );

  const activeStatuses = ["varakozo", "tervezes", "proba_alatt", "veglegesites"];
  const archiveStatuses = ["lezarva", "lemondva"];

  const activePrograms = filteredPrograms.filter((p) =>
    activeStatuses.includes(p.status ?? "")
  );
  const archivePrograms = filteredPrograms.filter((p) =>
    archiveStatuses.includes(p.status ?? "")
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Programok</h1>
          <p className="text-slate-500">
            Rendezvények kezelése és felelősök kijelölése
          </p>
        </div>
        {can("programs", "create") && (
          <Link href="/programs/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Új Program
            </Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          className="pl-10 w-full md:w-80 bg-white"
          placeholder="Keresés program vagy helyszín szerint..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Aktuális Programok
          </h2>
          <div className="grid gap-4">
            {activePrograms.map((program) => (
              <Card
                key={program.id}
                className={`overflow-hidden hover:shadow-md transition-shadow border-l-4 cursor-pointer ${
                  program.status === "varakozo"
                    ? "border-l-slate-300"
                    : "border-l-indigo-500"
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center p-6 gap-4">
                    <Link
                      href={`/programs/${program.id}`}
                      className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      <span className="text-xs uppercase font-bold">
                        {program.date
                          ? format(new Date(program.date), "MMM", { locale: hu })
                          : "-"}
                      </span>
                      <span className="text-xl font-bold">
                        {program.date
                          ? format(new Date(program.date), "d")
                          : "-"}
                      </span>
                    </Link>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/programs/${program.id}`}>
                          <h3 className="text-xl font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                            {program.description || "Névtelen"}
                          </h3>
                        </Link>
                        <Badge
                          variant="secondary"
                          className={
                            program.status === "veglegesites"
                              ? "bg-emerald-100 text-emerald-800"
                              : program.status === "proba_alatt"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                          }
                        >
                          {program.status === "proba_alatt"
                            ? "Próba alatt"
                            : program.status === "veglegesites"
                              ? "Végleges"
                              : program.status === "varakozo"
                                ? "Várakozó"
                                : "Tervezés"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />{" "}
                          {program.date
                            ? format(new Date(program.date), "dd/MM/yyyy")
                            : "-"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />{" "}
                          {program.location || "Nincs megadva"}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />{" "}
                          {getLeaderName(program.leader)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/programs/${program.id}`}>
                              <LayoutDashboard className="w-4 h-4 mr-2" />{" "}
                              Program Dashboard
                            </Link>
                          </DropdownMenuItem>
                          {can("programs", "edit") && (
                            <DropdownMenuItem asChild>
                              <Link href={`/programs/${program.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" /> Szerkesztés
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {can("programs", "delete") && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (
                                  confirm("Biztosan törlöd ezt a programot?")
                                ) {
                                  deleteMutation.mutate(program.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Törlés
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {activePrograms.length === 0 && (
              <div className="text-center py-8 text-slate-400 italic">
                Nincs aktuális program.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 opacity-75">
            <History className="w-5 h-5" /> Archív / Lezárt
          </h2>
          <div className="grid gap-4 opacity-75">
            {archivePrograms.map((program) => (
              <Card
                key={program.id}
                className="overflow-hidden hover:shadow-md transition-shadow bg-slate-50"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center p-6 gap-4">
                    <div className="flex items-center gap-2 md:order-first">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem asChild>
                            <Link href={`/programs/${program.id}`}>
                              <LayoutDashboard className="w-4 h-4 mr-2" />{" "}
                              Program Dashboard
                            </Link>
                          </DropdownMenuItem>
                          {can("programs", "delete") && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (
                                  confirm("Biztosan törlöd ezt a programot?")
                                ) {
                                  deleteMutation.mutate(program.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Törlés
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Link
                      href={`/programs/${program.id}`}
                      className="flex-shrink-0 w-16 h-16 bg-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors"
                    >
                      <span className="text-xs uppercase font-bold">
                        {program.date
                          ? format(new Date(program.date), "MMM", { locale: hu })
                          : "-"}
                      </span>
                      <span className="text-xl font-bold">
                        {program.date
                          ? format(new Date(program.date), "d")
                          : "-"}
                      </span>
                    </Link>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/programs/${program.id}`}>
                          <h3 className="text-xl font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
                            {program.description || "Névtelen"}
                          </h3>
                        </Link>
                        <Badge
                          variant="outline"
                          className={
                            program.status === "lemondva"
                              ? "border-red-200 text-red-700 bg-red-50"
                              : "border-slate-300"
                          }
                        >
                          {program.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />{" "}
                          {program.date
                            ? format(new Date(program.date), "dd/MM/yyyy")
                            : "-"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />{" "}
                          {program.location || "Nincs megadva"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {archivePrograms.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-sm italic">
                Nincs archív program.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
