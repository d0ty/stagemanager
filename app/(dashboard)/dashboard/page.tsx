"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDate, formatTime, formatDateTime } from "@/lib/date";
import {
  CalendarDays,
  MapPin,
  User,
  ArrowRight,
  Box,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Loader,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listPrograms } from "@/lib/db/program";
import { listEquipmentLoans } from "@/lib/db/equipment";
import { listStaff } from "@/lib/db/staff";
import { checkToken, getRedirectURL } from "@/lib/google";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

export default function DashboardPage() {
  const { data: programs, isLoading: isProgramsLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: () => listPrograms("date"),
  });

  const { data: loans, isLoading: isLoansLoading } = useQuery({
    queryKey: ["equipment-loans"],
    queryFn: () => listEquipmentLoans("aktiv"),
  });

  const { data: staffList } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const upcomingPrograms = (programs ?? []).filter(
    (p) => p.status !== "lezarva" && p.status !== "lemondva",
  );

  const getStaffName = (staffId: string | null) => {
    if (!staffId || !staffList) return "-";
    const s = staffList.find((st) => st.id === staffId);
    return s?.name ?? "-";
  };

  const getProgramName = (programId: number | null) => {
    if (!programId || !programs) return "-";
    const p = programs.find((p) => p.id === programId);
    return p?.description ?? "-";
  };

  const allLoanedItems = (loans ?? []).reduce(
    (acc, loan) => acc + (loan.item_count ?? 0),
    0,
  );

  const [isSystemReady, setIsSystemReady] = useState<boolean | null>(null);
  const [redirectURL, setRedirectURL] = useState<string | null>(null);
  useEffect(() => {
    const checkSystemReady = async () => {
      const ready = await checkToken();
      setIsSystemReady(ready);
      if (!ready) {
        const url = await getRedirectURL(
          window.location.protocol,
          window.location.host,
        );
        setRedirectURL(url);
      }
    };
    checkSystemReady();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Áttekintés</h1>
          <p className="text-slate-500">Üdvözöllek a StageManagerben!</p>
        </div>
        <div className="flex gap-2">
          <Link href="/programs">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <CalendarDays className="w-4 h-4 mr-2" /> Programok Kezelése
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Aktív Programok
              </p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">
                {upcomingPrograms.length}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Kiadott Eszközök
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {allLoanedItems}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-full">
              <Box className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Kapcsolat a Google Drive-val
              </p>
              <p
                className={`text-xl font-bold text-${isSystemReady === null ? "slate" : isSystemReady ? "emerald" : "amber"}-600 mt-1 flex items-center gap-2`}
              >
                {isSystemReady === null ? (
                  <Loader />
                ) : isSystemReady ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}{" "}
                {isSystemReady === null
                  ? "Ellenőrzés..."
                  : isSystemReady
                    ? "Online"
                    : "Offline"}
              </p>
              {isSystemReady === false && (
                <Link href={redirectURL ?? "/"}>Fix</Link>
              )}
            </div>
            <div
              className={`p-3 bg-${isSystemReady === null ? "slate" : isSystemReady ? "emerald" : "amber"}-50 rounded-full`}
            >
              <Clock
                className={`w-6 h-6 text-${isSystemReady === null ? "slate" : isSystemReady ? "emerald" : "amber"}-600`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-full bg-white">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h2 className="text-lg font-semibold text-slate-500">
              Következő Események
            </h2>
            <Link
              href="/programs"
              className="text-sm text-indigo-600 hover:underline flex items-center"
            >
              Összes <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {isProgramsLoading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="p-4 flex gap-4 animate-pulse">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
              ) : upcomingPrograms.length > 0 ? (
                upcomingPrograms.slice(0, 5).map((program) => (
                  <Link
                    key={program.id}
                    href={`/programs/${program.id}`}
                    className="block p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-700 font-bold text-sm">
                        <span className="text-xs uppercase">
                          {program.date
                            ? dayjs(program.date).format("MMMM")
                            : "-"}
                        </span>
                        <span>
                          {program.date ? new Date(program.date).getDay() : "-"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {program.description || "Névtelen"}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3" />{" "}
                            {program.location || "Nincs helyszín"}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-3 h-3" />{" "}
                            {getStaffName(program.leader)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          program.status === "veglegesites"
                            ? "bg-emerald-100 text-emerald-800 whitespace-nowrap"
                            : "bg-amber-100 text-amber-800 whitespace-nowrap"
                        }
                      >
                        {program.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Nincsenek közelgő események.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full bg-white">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <h2 className="text-lg font-semibold text-slate-500">
              Aktív Kölcsönzések
            </h2>
            <Link
              href="/inventory"
              className="text-sm text-indigo-600 hover:underline flex items-center"
            >
              Raktár <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {isLoansLoading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
              ) : (loans?.length ?? 0) > 0 ? (
                loans!.slice(0, 5).map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center p-2 w-8 h-8 bg-amber-50 rounded-full">
                        <p className="text-center font-bold text-amber-600">
                          {loan.item_count ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {loan.taken_by?.program != null
                            ? `${getProgramName(loan.taken_by!.program!)} (${getStaffName(loan.taken_by!.staff!)})`
                            : loan.taken_by?.type == "staff"
                              ? getStaffName(loan.taken_by!.staff!)
                              : loan.taken_by?.type == "external"
                                ? loan.taken_by!.name != null
                                  ? `Külsős: ${loan.taken_by!.name}`
                                  : "Külsős"
                                : "Kölcsönzés"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {loan.start_date
                            ? formatDateTime(new Date(loan.start_date))
                            : "-"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs rounded-full h-8 w-8 flex items-center justify-center"
                    >
                      <a href={`/inventory?current=${loan.id}`}>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </a>
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-200" />
                  <p>Minden eszköz a raktárban.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
