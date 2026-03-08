"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Edit,
  Users,
  ClipboardList,
  Package,
  FileText,
  MessageCircle,
  Clock,
  Plus,
  Trash2,
  Mic2,
  Lightbulb,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  Download,
  Upload,
  CircleMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProgram, updateProgram } from "@/lib/db/program";
import {
  getCrewByProgram,
  createCrewMember,
  deleteCrewMember,
} from "@/lib/db/crew-member";
import {
  getTasksByProgram,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/db/task";
import {
  getRehearsalsByProgram,
  createRehearsal,
  updateRehearsal,
  deleteRehearsal,
} from "@/lib/db/rehearsal";
import {
  getProgramFiles,
  uploadProgramFile,
  deleteProgramFile,
} from "@/lib/db/program-file";
import { listStaff } from "@/lib/db/staff";
import { usePermissions } from "@/hooks/use-permissions";
import type {
  CrewPosition,
  EquipmentInventory,
  EquipmentLoan,
  EquipmentItem,
} from "@/lib/db/types";
import Chat from "@/components/chat";
import {
  createEquipmentLoanItem,
  deleteLoanItem,
  getEquipmentLoansByProgram,
  listEquipmentItems,
  listEquipmentLoanItems,
  listEquipmentTypes,
} from "@/lib/db";

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const programId = parseInt(id, 10);
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [isRehearsalDialogOpen, setIsRehearsalDialogOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [taskType, setTaskType] = useState<"sound" | "light" | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [fohList, setFohList] = useState("");
  const [stageList, setStageList] = useState("");
  const [otherList, setOtherList] = useState("");

  const [addingItems, setAddingItems] = useState({
    foh: [],
    stage: [],
    egyeb: [],
  });
  const [deletingItems, setDeletingItems] = useState({
    foh: [],
    stage: [],
    egyeb: [],
  });

  const resetLoanState = () => {
    setAddingItems({ foh: [], stage: [], egyeb: [] });
    setDeletingItems({ foh: [], stage: [], egyeb: [] });
  };

  const {
    data: program,
    isLoading,
    error,
  } = useQuery({
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

  const { data: files = [] } = useQuery({
    queryKey: ["program-files", programId],
    queryFn: () => getProgramFiles(programId),
    enabled: !isNaN(programId),
  });

  const {
    data: loans = { foh: null, stage: null, egyeb: null, external: null },
  } = useQuery({
    queryKey: ["loans", programId],
    queryFn: () => getEquipmentLoansByProgram(programId),
    enabled: !isNaN(programId),
  });

  const { data: loan_items = [] } = useQuery({
    queryKey: ["loan_items", programId],
    queryFn: () => listEquipmentLoanItems(),
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items", programId],
    queryFn: () => listEquipmentItems(),
  });

  const { data: equipmentTypes = [] } = useQuery({
    queryKey: ["equipment-types"],
    queryFn: listEquipmentTypes,
  });

  const getTypeName = (typeId: number): string => {
    const t = equipmentTypes.find((et) => et.id === typeId);
    return t?.name ?? "Ismeretlen";
  };

  // Mutations
  const createCrewMutation = useMutation({
    mutationFn: createCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew", programId] });
      setIsCrewDialogOpen(false);
    },
  });

  const deleteCrewMutation = useMutation({
    mutationFn: deleteCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew", programId] });
    },
  });

  const createRehearsalMutation = useMutation({
    mutationFn: createRehearsal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rehearsals", programId] });
      setIsRehearsalDialogOpen(false);
      setEditingRehearsal(null);
    },
  });

  const updateRehearsalMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateRehearsal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rehearsals", programId] });
      setIsRehearsalDialogOpen(false);
      setEditingRehearsal(null);
    },
  });

  const deleteRehearsalMutation = useMutation({
    mutationFn: deleteRehearsal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rehearsals", programId] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", programId] });
      setIsTaskDialogOpen(false);
      setTaskType(null);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", programId] });
      setIsTaskDialogOpen(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", programId] });
    },
  });

  const toggleTaskStatusMutation = useMutation({
    mutationFn: ({
      id,
      currentStatus,
    }: {
      id: number;
      currentStatus: string | null;
    }) => {
      const newStatus = currentStatus === "kesz" ? "teendo" : "kesz";
      return updateTask(id, { status: newStatus as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", programId] });
    },
  });

  const updateEquipmentListsMutation = useMutation({
    mutationFn: (data: {
      foh_list: string;
      stage_list: string;
      other_list: string;
    }) => updateProgram(programId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", programId] });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => uploadProgramFile(programId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-files", programId] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: ({ id, filePath }: { id: number; filePath?: string }) =>
      deleteProgramFile(id, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-files", programId] });
    },
  });

  // Initialize equipment lists from program data
  useEffect(() => {
    if (program) {
      setFohList(program.foh_list || "");
      setStageList(program.stage_list || "");
      setOtherList(program.other_list || "");
    }
  }, [program]);

  const getStaffName = (staffId: string | null) => {
    if (!staffId) return "-";
    const s = staffList.find((st) => st.id === staffId);
    return s?.name ?? "-";
  };

  const getItemsOfInventory = (inv: EquipmentInventory) => {
    const loan: EquipmentLoan = loans[inv] as EquipmentLoan;
    return loan_items.filter((li) => li.loan == loan?.id);
  };

  const getAvailableItems = () => {
    const loan = new Set(Object.entries(loans).map((l) => l[1]?.id));
    const loan_item_set = new Set(
      loan_items.filter((li) => loan.has(li.loan)).map((li) => li.item),
    );
    return items.filter((i) => !loan_item_set.has(i.id));
  };

  console.log(items);
  const handleAddCrewMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCrewMutation.mutate({
      staff: formData.get("staff") as string,
      program: programId,
      role: formData.get("role") as CrewPosition,
    });
  };

  const handleRehearsalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateValue = formData.get("date") as string;
    const timeValue = formData.get("time") as string;
    const dateTimeISO = `${dateValue}T${timeValue}:00`;

    const rehearsalData = {
      program: programId,
      date: new Date(dateTimeISO).toISOString(),
      lesson_period: (formData.get("lesson_period") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    if (editingRehearsal) {
      updateRehearsalMutation.mutate({
        id: editingRehearsal.id,
        data: rehearsalData,
      });
    } else {
      createRehearsalMutation.mutate(rehearsalData);
    }
  };

  const handleTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const taskData = {
      program: programId,
      type: taskType as any,
      assigned_to: (formData.get("assigned_to") as string) || null,
      priority: (formData.get("priority") as any) || null,
      status: (formData.get("status") as any) || "teendo",
      details: (formData.get("details") as string) || null,
    };

    if (editingTask) {
      updateTaskMutation.mutate({
        id: editingTask.id,
        data: taskData,
      });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleSaveEquipmentLists = () => {
    updateEquipmentListsMutation.mutate({
      foh_list: fohList,
      stage_list: stageList,
      other_list: otherList,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadFileMutation.mutateAsync(file);
        // Reset input
        e.target.value = "";
      } catch (error) {
        console.error("File upload error:", error);
        alert("Hiba történt a fájl feltöltése során.");
      }
    }
  };

  const handleLoanChanges = async () => {
    await Promise.all(
      Object.entries(addingItems).map(async (i) => {
        await Promise.all(
          i[1].map(
            async (item: EquipmentItem) =>
              await createEquipmentLoanItem({
                loan: loans[i[0] as EquipmentInventory]!.id,
                item: item.id,
              }),
          ),
        );
      }),
    );
    await Promise.all(
      Object.entries(deletingItems).map(async (i) => {
        await Promise.all(
          i[1].map(async (item) => await deleteLoanItem((item as any).id)),
        );
      }),
    );
    setIsLoanDialogOpen(false);
    resetLoanState();
  };

  const [activeUsers, setActiveUsers] = useState(0);

  if (isNaN(programId))
    return (
      <div className="p-8 text-center text-slate-500">
        Érvénytelen program azonosító.
      </div>
    );
  if (isLoading) return <div className="p-8 text-center">Betöltés...</div>;
  if (error || !program)
    return (
      <div className="p-8 text-center text-red-500">
        Hiba történt a betöltés során.
      </div>
    );

  const soundTasks = tasks.filter((t) => t.type === "sound");
  const lightTasks = tasks.filter((t) => t.type === "light");

  const uniqueStaffCount = new Set(
    [...crew.map((c) => c.staff), program.leader].filter(Boolean),
  ).size;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
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
            <div className="flex items-center gap-4 text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />{" "}
                {program.date
                  ? format(new Date(program.date), "dd/MM/yyyy HH:mm", {
                      locale: hu,
                    })
                  : "-"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />{" "}
                {program.location || "Nincs megadva"}
              </span>
              <Badge variant="secondary">
                {program.status === "varakozo"
                  ? "Várakozó"
                  : program.status === "tervezes"
                    ? "Tervezés"
                    : program.status === "proba_alatt"
                      ? "Próba alatt"
                      : program.status === "veglegesites"
                        ? "Véglegesítés"
                        : program.status === "lezarva"
                          ? "Lezárva"
                          : program.status === "lemondva"
                            ? "Lemondva"
                            : program.status}
              </Badge>
            </div>
          </div>
        </div>
        {can("programs", "edit") && (
          <Link href={`/programs/${programId}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Szerkesztés
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-slate-100 flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="w-4 h-4" /> Áttekintés
          </TabsTrigger>
          <TabsTrigger value="equipment" className="gap-2">
            <Package className="w-4 h-4" /> Eszközök
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="w-4 h-4" /> Feladatok
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Users className="w-4 h-4" /> Stáb
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FileText className="w-4 h-4" /> Fájlok
          </TabsTrigger>
          <TabsTrigger value="rehearsals" className="gap-2">
            <Calendar className="w-4 h-4" /> Próbák
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="w-4 h-4" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageCircle className="w-4 h-4" /> Chat
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Staff Overview */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Stáb & Személyzet
                </CardTitle>
                <Users className="w-4 h-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueStaffCount} fő</div>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Felelős: {getStaffName(program.leader)}
                </p>
                <div className="space-y-2 mb-4">
                  {crew.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                        <span>{getStaffName(c.staff)}</span>
                      </div>
                      <span className="text-xs text-slate-500">{c.role}</span>
                    </div>
                  ))}
                  {crew.length > 3 && (
                    <p className="text-xs text-center text-slate-400">
                      ...és még {crew.length - 3} fő
                    </p>
                  )}
                  {crew.length === 0 && (
                    <p className="text-xs text-slate-400 italic">
                      Nincs stáb hozzárendelve
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tasks Overview */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Feladatok Állapota
                </CardTitle>
                <ClipboardList className="w-4 h-4 text-slate-500" />
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

            {/* Rehearsals Overview */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Próbák</CardTitle>
                <Calendar className="w-4 h-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rehearsals.length}</div>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  próba időpont
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {rehearsals
                    .filter((r) => r.date)
                    .sort(
                      (a, b) =>
                        new Date(a.date!).getTime() -
                        new Date(b.date!).getTime(),
                    )
                    .slice(0, 3)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex items-start gap-2 text-sm p-2 bg-slate-50 rounded"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs">
                            {r.date
                              ? format(new Date(r.date), "dd/MM/yyyy HH:mm")
                              : "-"}
                          </span>
                          {r.lesson_period && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {r.lesson_period}
                            </Badge>
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
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Eszközlisták
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="foh_list" className="text-base font-semibold">
                    FOH (Front of House)
                  </Label>
                  <div className="bg-[#e5e5e54d] rounded-sm">
                    {getItemsOfInventory("foh").map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>
                          {getTypeName(
                            items.find((i) => i.id == item.item)?.type ?? 0,
                          )}
                        </span>
                        <span className="text-xs font-mono text-slate-500 whitespace-break-spaces">
                          SN: {items.find((i) => i.id == item.item)?.serial}
                        </span>
                      </div>
                    ))}
                    {getItemsOfInventory("foh").length == 0 && (
                      <div className="flex items-center gap2">
                        <span className="text-xs font-mono text-slate-500">
                          Még nincs elem ebben a raktárban
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={(_) => {
                      setIsLoanDialogOpen(true);
                    }}
                    className="border-indigo-600 border-2  bg-white hover:bg-indigo-700 text-indigo-600 hover:text-white w-full"
                  >
                    <Plus /> Eszközök hozzáadása
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="stage_list"
                    className="text-base font-semibold"
                  >
                    Stage (Színpad)
                  </Label>
                  <div className="bg-[#e5e5e54d] rounded-sm">
                    {getItemsOfInventory("stage").map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>
                          {getTypeName(
                            items.find((i) => i.id == item.item)?.type ?? 0,
                          )}
                        </span>
                        <span className="text-xs font-mono text-slate-500 whitespace-break-spaces">
                          SN: {items.find((i) => i.id == item.item)?.serial}
                        </span>
                      </div>
                    ))}
                    {getItemsOfInventory("stage").length == 0 && (
                      <div className="flex items-center gap2">
                        <span className="text-xs font-mono text-slate-500">
                          Még nincs elem ebben a raktárban
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={(_) => {
                      setIsLoanDialogOpen(true);
                    }}
                    className="border-indigo-600 border-2  bg-white hover:bg-indigo-700 text-indigo-600 hover:text-white w-full"
                  >
                    <Plus /> Eszközök hozzáadása
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="other_list"
                    className="text-base font-semibold"
                  >
                    Egyéb
                  </Label>
                  <div className="bg-[#e5e5e54d] rounded-sm">
                    {getItemsOfInventory("egyeb").map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>
                          {getTypeName(
                            items.find((i) => i.id == item.item)?.type ?? 0,
                          )}
                        </span>
                        <span className="text-xs font-mono text-slate-500 whitespace-break-spaces">
                          SN: {items.find((i) => i.id == item.item)?.serial}
                        </span>
                      </div>
                    ))}
                    {getItemsOfInventory("egyeb").length == 0 && (
                      <div className="flex items-center gap2">
                        <span className="text-xs font-mono text-slate-500">
                          Még nincs elem ebben a raktárban
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={(_) => {
                      setIsLoanDialogOpen(true);
                    }}
                    className="border-indigo-600 border-2  bg-white hover:bg-indigo-700 text-indigo-600 hover:text-white w-full"
                  >
                    <Plus /> Eszközök hozzáadása
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Írd be az egyes kategóriákhoz tartozó eszközöket. Minden sor egy
                eszközt jelöl.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="foh_list" className="text-base font-semibold">
                    FOH (Front of House)
                  </Label>
                  <Textarea
                    id="foh_list"
                    placeholder="pl. Mixing console&#10;Wireless mikrofonok&#10;Monitor rendszer..."
                    value={fohList}
                    onChange={(e) => setFohList(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    {fohList.split("\n").filter((line) => line.trim()).length}{" "}
                    eszköz
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="stage_list"
                    className="text-base font-semibold"
                  >
                    Stage (Színpad)
                  </Label>
                  <Textarea
                    id="stage_list"
                    placeholder="pl. Monitor hangszórók&#10;DI boxok&#10;Kábelek..."
                    value={stageList}
                    onChange={(e) => setStageList(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    {stageList.split("\n").filter((line) => line.trim()).length}{" "}
                    eszköz
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="other_list"
                    className="text-base font-semibold"
                  >
                    Egyéb
                  </Label>
                  <Textarea
                    id="other_list"
                    placeholder="pl. Hálózati kábelek&#10;Multicore&#10;Dupla csatlakozók..."
                    value={otherList}
                    onChange={(e) => setOtherList(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    {otherList.split("\n").filter((line) => line.trim()).length}{" "}
                    eszköz
                  </p>
                </div>
              </div>

              {can("programs", "edit") && (
                <div className="flex justify-end mt-6 pt-6 border-t">
                  <Button
                    onClick={handleSaveEquipmentLists}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={updateEquipmentListsMutation.isPending}
                  >
                    {updateEquipmentListsMutation.isPending ? (
                      <>Mentés...</>
                    ) : (
                      <>
                        <Package className="w-4 h-4 mr-2" />
                        Eszközlisták Mentése
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-indigo-600" /> Hangtechnikai
                  Feladatok
                </CardTitle>
                {can("tasks", "create") && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setTaskType("sound");
                      setEditingTask(null);
                      setIsTaskDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Új
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {soundTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      Nincs hang feladat.
                    </p>
                  ) : (
                    soundTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition group"
                      >
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() =>
                            toggleTaskStatusMutation.mutate({
                              id: task.id,
                              currentStatus: task.status,
                            })
                          }
                        >
                          {task.status === "kesz" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm ${
                                task.status === "kesz"
                                  ? "line-through text-slate-400"
                                  : "text-slate-900"
                              }`}
                            >
                              {task.details || "Feladat"}
                            </span>
                            {task.assigned_to && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {task.assigned_to}
                              </p>
                            )}
                          </div>
                          {task.priority && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                task.priority === "magas"
                                  ? "border-red-200 text-red-700"
                                  : task.priority === "kozepes"
                                    ? "border-amber-200 text-amber-700"
                                    : "border-slate-200"
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          {can("tasks", "edit") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                              onClick={() => {
                                setTaskType("sound");
                                setEditingTask(task);
                                setIsTaskDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {can("tasks", "delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600"
                              onClick={() => {
                                if (
                                  confirm("Biztosan törlöd ezt a feladatot?")
                                ) {
                                  deleteTaskMutation.mutate(task.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" /> Fénytechnikai
                  Feladatok
                </CardTitle>
                {can("tasks", "create") && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setTaskType("light");
                      setEditingTask(null);
                      setIsTaskDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Új
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lightTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      Nincs fény feladat.
                    </p>
                  ) : (
                    lightTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition group"
                      >
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() =>
                            toggleTaskStatusMutation.mutate({
                              id: task.id,
                              currentStatus: task.status,
                            })
                          }
                        >
                          {task.status === "kesz" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-amber-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm ${
                                task.status === "kesz"
                                  ? "line-through text-slate-400"
                                  : "text-slate-900"
                              }`}
                            >
                              {task.details || "Feladat"}
                            </span>
                            {task.assigned_to && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {task.assigned_to}
                              </p>
                            )}
                          </div>
                          {task.priority && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                task.priority === "magas"
                                  ? "border-red-200 text-red-700"
                                  : task.priority === "kozepes"
                                    ? "border-amber-200 text-amber-700"
                                    : "border-slate-200"
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                          {can("tasks", "edit") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-amber-600"
                              onClick={() => {
                                setTaskType("light");
                                setEditingTask(task);
                                setIsTaskDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {can("tasks", "delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600"
                              onClick={() => {
                                if (
                                  confirm("Biztosan törlöd ezt a feladatot?")
                                ) {
                                  deleteTaskMutation.mutate(task.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Stáb & Crew
              </CardTitle>
              {can("programs", "create") && (
                <Button size="sm" onClick={() => setIsCrewDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crew Hozzáadása
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    L
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {getStaffName(program.leader)}
                    </p>
                    <p className="text-xs text-slate-500">Felelős / Lead</p>
                  </div>
                </div>

                {crew.length > 0 ? (
                  crew.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between group p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium">
                            {getStaffName(c.staff)}
                          </p>
                          <p className="text-xs text-slate-500">{c.role}</p>
                        </div>
                      </div>
                      {can("programs", "delete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                          onClick={() => {
                            if (confirm("Biztosan eltávolítod ezt a tagot?")) {
                              deleteCrewMutation.mutate(c.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Még nincs crew tag hozzáadva.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Fájlok
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {can("programs", "create") && (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50 hover:border-indigo-300 transition">
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="w-12 h-12 text-slate-400" />
                    <div className="text-center">
                      <h3 className="font-medium text-slate-900 mb-1">
                        Fájl feltöltése
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        PDF, Word (.docx) vagy Excel (.xlsx) fájl
                      </p>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileUpload}
                        disabled={uploadFileMutation.isPending}
                      />
                      <Button
                        type="button"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={uploadFileMutation.isPending}
                        onClick={(e) => {
                          e.currentTarget.previousElementSibling?.dispatchEvent(
                            new MouseEvent("click"),
                          );
                        }}
                      >
                        {uploadFileMutation.isPending
                          ? "Feltöltés..."
                          : "Fájl kiválasztása"}
                      </Button>
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {files.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    Még nincs feltöltött fájl ehhez a programhoz.
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate">
                            {file.file_name || "Fájl"}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {file.uploaded_at && (
                              <>
                                <span className="text-xs text-slate-300">
                                  •
                                </span>
                                <p className="text-xs text-slate-500">
                                  {format(
                                    new Date(file.uploaded_at),
                                    "dd/MM/yyyy HH:mm",
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        {file.file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                            onClick={() => {
                              window.open(file.file_url!, "_blank");
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rehearsals Tab */}
        <TabsContent value="rehearsals" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Próbák
              </CardTitle>
              {can("programs", "create") && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingRehearsal(null);
                    setIsRehearsalDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Új Próba
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rehearsals.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    Még nincs próba időpont rögzítve.
                  </div>
                ) : (
                  rehearsals
                    .sort(
                      (a, b) =>
                        new Date(a.date || 0).getTime() -
                        new Date(b.date || 0).getTime(),
                    )
                    .map((rehearsal) => (
                      <div
                        key={rehearsal.id}
                        className="flex items-start justify-between p-4 bg-white rounded-lg border border-slate-200 group hover:shadow-sm transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-slate-900">
                              {rehearsal.date
                                ? format(
                                    new Date(rehearsal.date),
                                    "dd/MM/yyyy HH:mm",
                                  )
                                : "-"}
                            </span>
                            {rehearsal.lesson_period && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {rehearsal.lesson_period}
                              </Badge>
                            )}
                          </div>
                          {rehearsal.notes && (
                            <p className="text-sm text-slate-600 mt-2 pl-6">
                              {rehearsal.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          {can("programs", "edit") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                              onClick={() => {
                                setEditingRehearsal(rehearsal);
                                setIsRehearsalDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {can("programs", "delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600"
                              onClick={() => {
                                if (confirm("Biztosan törlöd ezt a próbát?")) {
                                  deleteRehearsalMutation.mutate(rehearsal.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" /> Program Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: "program", date: program.date, data: program },
                  ...rehearsals.map((r) => ({
                    type: "rehearsal",
                    date: r.date,
                    data: r,
                  })),
                ]
                  .filter((e) => e.date)
                  .sort(
                    (a, b) =>
                      new Date(a.date!).getTime() - new Date(b.date!).getTime(),
                  )
                  .map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-indigo-500"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex flex-col items-center justify-center text-indigo-700">
                        <span className="text-xs uppercase font-bold">
                          {format(new Date(event.date!), "MMM", { locale: hu })}
                        </span>
                        <span className="text-lg font-bold">
                          {format(new Date(event.date!), "d")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {event.type === "program"
                              ? "🎬 Program Dátuma"
                              : "🎭 Próba"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(event.date!), "HH:mm")}
                          </span>
                        </div>
                        {event.type === "rehearsal" &&
                          (event.data as (typeof rehearsals)[0]).notes && (
                            <p className="text-sm text-slate-600 mt-1">
                              {(event.data as (typeof rehearsals)[0]).notes}
                            </p>
                          )}
                      </div>
                    </div>
                  ))}
                {rehearsals.length === 0 && !program.date && (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <p>Még nincsenek események.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab - Placeholder */}
        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row justify-between">
              <CardTitle>Program Chat</CardTitle>
              <div className="flex flex-row">
                <User />
                {activeUsers}
              </div>
            </CardHeader>
            <Chat
              canSend={true}
              program={programId}
              onPresenceUpdate={setActiveUsers}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Crew Dialog */}
      <Dialog open={isCrewDialogOpen} onOpenChange={setIsCrewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crew Tag Hozzáadása</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCrewMember} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="staff">Személy</Label>
              <Select name="staff" required>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz személyt..." />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name || s.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Feladatkör</Label>
              <Select name="role" required>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz feladatkört..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stage">Stage (Színpad)</SelectItem>
                  <SelectItem value="hangtechnikus">Hangtechnikus</SelectItem>
                  <SelectItem value="fenytechnikus">Fénytechnikus</SelectItem>
                  <SelectItem value="fotos">Fotós</SelectItem>
                  <SelectItem value="videos">Videós</SelectItem>
                  <SelectItem value="vetito">Vetítő</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCrewDialogOpen(false)}
              >
                Mégse
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={createCrewMutation.isPending}
              >
                Hozzáadás
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rehearsal Dialog */}
      <Dialog
        open={isRehearsalDialogOpen}
        onOpenChange={setIsRehearsalDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRehearsal ? "Próba Szerkesztése" : "Új Próba"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRehearsalSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Dátum</Label>
                <Input
                  type="date"
                  name="date"
                  defaultValue={
                    editingRehearsal?.date
                      ? format(new Date(editingRehearsal.date), "yyyy-MM-dd")
                      : ""
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Időpont</Label>
                <Input
                  type="time"
                  name="time"
                  defaultValue={
                    editingRehearsal?.date
                      ? format(new Date(editingRehearsal.date), "HH:mm")
                      : ""
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson_period">Tanrendi óra (opcionális)</Label>
              <Input
                name="lesson_period"
                placeholder="pl. 3. óra, 4-5. óra"
                defaultValue={editingRehearsal?.lesson_period || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Megjegyzések</Label>
              <Textarea
                name="notes"
                placeholder="Technikai igények, résztvevők, stb..."
                defaultValue={editingRehearsal?.notes || ""}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRehearsalDialogOpen(false);
                  setEditingRehearsal(null);
                }}
              >
                Mégse
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={
                  createRehearsalMutation.isPending ||
                  updateRehearsalMutation.isPending
                }
              >
                {editingRehearsal ? "Mentés" : "Létrehozás"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loan editor */}
      <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eszközök kezelése</DialogTitle>
          </DialogHeader>
          <div className="flex jutify-between gap-5">
            {["foh", "stage", "egyeb"].map((inv) => (
              <div key={inv} className="space-y-2 block">
                <Label
                  htmlFor={`inv-${inv}`}
                  className="text-base font-semibold"
                >
                  {inv}
                </Label>
                <div className="bg-[#e5e5e54d] rounded-sm">
                  {getItemsOfInventory(inv as EquipmentInventory).map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2"
                      >
                        <span>
                          {getTypeName(
                            items.find((i) => i.id == item.item)?.type ?? 0,
                          )}
                        </span>
                        <span className="text-xs font-mono text-slate-500 whitespace-break-spaces">
                          SN: {items.find((i) => i.id == item.item)?.serial}
                        </span>
                        <CircleMinus
                          className={`w-4 h-4 text-${deletingItems[inv as "foh" | "stage" | "egyeb"].includes(item as never) ? "stone" : "red"}-500 flex-shrink-0`}
                          onClick={() => {
                            if (
                              !deletingItems[
                                inv as "foh" | "stage" | "egyeb"
                              ].includes(item as never)
                            ) {
                              setDeletingItems({
                                ...deletingItems,
                                [inv]: [
                                  ...deletingItems[
                                    inv as "foh" | "stage" | "egyeb"
                                  ],
                                  item,
                                ],
                              });
                            }
                          }}
                        />
                      </div>
                    ),
                  )}
                  {getAvailableItems().map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2"
                      onClick={() => {
                        if (
                          !addingItems[
                            inv as "foh" | "stage" | "egyeb"
                          ].includes(item as never)
                        )
                          setAddingItems({
                            ...addingItems,
                            [inv]: [
                              ...addingItems[inv as "foh" | "stage" | "egyeb"],
                              item,
                            ],
                          });
                      }}
                    >
                      <span>{getTypeName(item.type)}</span>
                      <span className="text-xs font-mono text-slate-500">
                        SN: {item.serial}
                      </span>
                      {addingItems[inv as "foh" | "stage" | "egyeb"].includes(
                        item as never,
                      ) && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                  {getAvailableItems().length == 0 && (
                    <div className="flex items-center gap2">
                      <span className="text-xs font-mono text-slate-500">
                        Mindent használsz már...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetLoanState();
                setIsLoanDialogOpen(false);
              }}
            >
              Mégse
            </Button>
            <Button
              onClick={handleLoanChanges}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={
                createTaskMutation.isPending || updateTaskMutation.isPending
              }
            >
              Mentés
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Feladat Szerkesztése" : "Új Feladat"} -{" "}
              {taskType === "sound" ? "Hang" : "Fény"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="details">
                Feladat Leírása <span className="text-red-500">*</span>
              </Label>
              <Textarea
                name="details"
                placeholder="Írja le a feladatot részletesen..."
                defaultValue={editingTask?.details || ""}
                required
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Ki végzi?</Label>
              <Select
                name="assigned_to"
                defaultValue={editingTask?.assigned_to || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassz személyt..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nincs kijelölve</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name || s.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioritás</Label>
                <Select
                  name="priority"
                  defaultValue={editingTask?.priority || "kozepes"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alacsony">Alacsony</SelectItem>
                    <SelectItem value="kozepes">Közepes</SelectItem>
                    <SelectItem value="magas">Magas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Állapot</Label>
                <Select
                  name="status"
                  defaultValue={editingTask?.status || "teendo"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teendo">Teendő</SelectItem>
                    <SelectItem value="folyamatban">Folyamatban</SelectItem>
                    <SelectItem value="kesz">Kész</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsTaskDialogOpen(false);
                  setTaskType(null);
                  setEditingTask(null);
                }}
              >
                Mégse
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={
                  createTaskMutation.isPending || updateTaskMutation.isPending
                }
              >
                {editingTask ? "Mentés" : "Létrehozás"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
