"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProgram } from "@/lib/db/program";
import { getCrewByProgram } from "@/lib/db/crew-member";
import { getTasksByProgram } from "@/lib/db/task";
import { getRehearsalsByProgram } from "@/lib/db/rehearsal";
import { listStaff } from "@/lib/db/staff";

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const programId = parseInt(id, 10);

  const { data: program, isLoading, error } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => getProgram(programId),
    enabled: !isNaN(programId),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const { data: crew = [] } = useQuery({
    queryKey: ["crew", programId],
    queryFn: () => getCrewByProgram(programId),
    enabled: !isNaN(programId),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", programId],
    queryFn: () => getTasksByProgram(programId),
    enabled: !isNaN(programId),
  });

  const { data: rehearsals = [] } = useQuery({
    queryKey: ["rehearsals", programId],
    queryFn: () => getRehearsalsByProgram(programId),
    enabled: !isNaN(programId),
  });

  const getStaffName = (staffId: string) => {
    const s = staffList.find((st) => st.id === staffId);
    return s?.name ?? "-";
  };

  if (isNaN(programId))
    return (
      <div className="p-8 text-center text-slate-500">
        Érvénytelen program azonosító.
      </div>
    );
  if (isLoading)
    return <div className="p-8 text-center">Betöltés...</div>;
  if (error || !program)
    return (
      <div className="p-8 text-center text-red-500">
        Hiba történt a betöltés során.
      </div>
    );

  const soundTasks = tasks.filter((t) => t.type === "sound");
  const lightTasks = tasks.filter((t) => t.type === "light");

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex items-center gap-4">
        <Link href="/programs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {program.description || "Névtelen"}
          </h1>
          <div className="flex items-center gap-4 text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />{" "}
              {program.date
                ? format(new Date(program.date), "dd/MM/yyyy")
                : "-"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {program.location}
            </span>
            <Badge variant="secondary">{program.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stáb</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-2">
              Felelős: {getStaffName(program.leader ?? "")}
            </p>
            <div className="space-y-2">
              {crew.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>{getStaffName(c.staff)}</span>
                  <span className="text-xs text-slate-500">({c.role})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Feladatok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-indigo-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {soundTasks.filter((t) => t.status !== "kesz").length}
                </div>
                <div className="text-xs text-indigo-800 font-medium">
                  Nyitott Hang
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {lightTasks.filter((t) => t.status !== "kesz").length}
                </div>
                <div className="text-xs text-amber-800 font-medium">
                  Nyitott Fény
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Próbák</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rehearsals
                .filter((r) => r.date)
                .sort(
                  (a, b) =>
                    new Date(a.date!).getTime() - new Date(b.date!).getTime()
                )
                .slice(0, 5)
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-2 text-sm p-2 bg-slate-50 rounded"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
                    <div>
                      <span>
                        {r.date
                          ? format(new Date(r.date), "dd/MM/yyyy HH:mm")
                          : "-"}
                      </span>
                      {r.lesson_period && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {r.lesson_period}
                        </Badge>
                      )}
                      {r.notes && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          {r.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              {rehearsals.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  Még nincsenek próbák.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
