"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format, set } from "date-fns";
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
  FileSpreadsheet,
  FileChartPie,
  FileImage,
  FileVideo,
  FileMusic,
  FileSymlink,
  MessageCircle,
  Clock,
  Plus,
  SquarePlus,
  Trash2,
  Mic2,
  Lightbulb,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  Upload,
  CircleMinus,
  Search,
  PlusSquare,
  X,
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
  getCrewPositionName,
} from "@/lib/db/crew-member";
import {
  getTasksByProgram,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/db/task";
import {
  getActivitysByProgram,
  createActivity,
  updateActivity,
  deleteActivity,
} from "@/lib/db/activity";
import { getProgramFiles } from "@/lib/db/program-file";
import {
  uploadFilesAction,
  deleteFileAction,
  getFileLinkAction,
  linkFileAction,
} from "./actions";
import { listStaff } from "@/lib/db/staff";
import { usePermissions } from "@/hooks/use-permissions";
import type {
  CrewPosition,
  EquipmentInventory,
  EquipmentLoan,
  EquipmentItem,
  ActivityType,
  Activity,
  CrewMember,
  CrewMemberResult,
} from "@/lib/db/types";
import Chat from "@/components/chat";
import {
  createEquipmentLoanItem,
  CREW_POSITIONS,
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
  const [editingCrew, setEditingCrew] = useState<CrewMemberResult | null>(null);
  const [addingRoles, setAddingRoles] = useState<CrewPosition[]>([]);
  const [addingRole, setAddingRole] = useState<CrewPosition | null>(null);
  const [removingRoles, setRemovingRoles] = useState<CrewMember[]>([]);
  const [isRoleOther, setIsRoleOther] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [taskType, setTaskType] = useState<"sound" | "light" | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [fohList, setFohList] = useState("");
  const [stageList, setStageList] = useState("");
  const [otherList, setOtherList] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [linkInput, setLinkInput] = useState("");

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
    queryKey: ["crew", program],
    queryFn: () => getCrewByProgram(program!),
    enabled: program !== null,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", programId],
    queryFn: () => getTasksByProgram(programId),
    enabled: !isNaN(programId),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", programId],
    queryFn: () => getActivitysByProgram(programId),
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

  const createActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", programId] });
      setIsActivityDialogOpen(false);
      setEditingActivity(null);
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", programId] });
      setIsActivityDialogOpen(false);
      setEditingActivity(null);
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", programId] });
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
    mutationFn: (files: File[]) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      return uploadFilesAction(programId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-files", programId] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (programFile: import("@/lib/db/types").ProgramFile) =>
      deleteFileAction(programFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-files", programId] });
    },
  });

  const linkFileMutation = useMutation({
    mutationFn: (link: string) => linkFileAction(programId, link),
    onSuccess: () => {
      setLinkInput("");
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
    if (inv == "external") return [];
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

  const handleCrewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const staff = (formData.get("staff") as string) ?? editingCrew!.staff;
    if (isRoleOther) {
      createCrewMutation.mutate({
        staff,
        program: programId,
        role: "egyeb",
      });
    } else {
      addingRoles.forEach((role) => {
        createCrewMutation.mutate({
          staff,
          program: programId,
          role,
        });
      });
    }
    if (editingCrew !== null)
      removingRoles.forEach((role) => {
        deleteCrewMutation.mutate(role.id);
      });
    setAddingRoles([]);
    setAddingRole(null);
    setIsCrewDialogOpen(false);
    window.location.reload();
  };

  const handleActivitySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateValue = formData.get("date") as string;
    const timeValue = formData.get("time") as string;
    const dateTimeISO = `${dateValue}T${timeValue}:00`;

    const activityData = {
      program: programId,
      type: formData.get("type") as ActivityType,
      date: new Date(dateTimeISO).toISOString(),
      lesson_period: (formData.get("lesson_period") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    if (editingActivity) {
      updateActivityMutation.mutate({
        id: editingActivity.id,
        data: activityData,
      });
    } else {
      createActivityMutation.mutate(activityData);
    }
  };

  const handleTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const assigned_to = formData.get("assigned_to") as string;
    const taskData = {
      program: programId,
      type: taskType as any,
      assigned_to: (assigned_to == "none" ? null : assigned_to) || null,
      priority: (formData.get("priority") as any) || null,
      status: (formData.get("status") as any) || "teendo",
      details: (formData.get("details") as string) || null,
    };
    console.log(taskData);
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

  const ACCEPTED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.presentation",
  ];

  const isAccepted = (file: File) =>
    ACCEPTED_MIME_TYPES.includes(file.type) ||
    file.type.startsWith("image/") ||
    file.type.startsWith("video/") ||
    file.type.startsWith("audio/");

  const handleFilesUpload = async (selectedFiles: FileList | File[]) => {
    const valid = Array.from(selectedFiles).filter(isAccepted);
    if (valid.length === 0) return;
    try {
      await uploadFileMutation.mutateAsync(valid);
    } catch (error) {
      console.error("File upload error:", error);
      alert("Hiba történt a fájl feltöltése során.");
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFilesUpload(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      await handleFilesUpload(e.dataTransfer.files);
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    switch (mimeType) {
      case "link":
        return <FileSymlink className="w-5 h-5 text-indigo-600" />;
      case "gdrive/docs":
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case "gdrive/sheets":
        return <FileSpreadsheet className="w-5 h-5 text-indigo-600" />;
      case "gdrive/slides":
        return <FileChartPie className="w-5 h-5 text-indigo-600" />;
      case "gdrive/image":
        return <FileImage className="w-5 h-5 text-indigo-600" />;
      case "gdrive/video":
        return <FileVideo className="w-5 h-5 text-indigo-600" />;
      case "gdrive/audio":
        return <FileMusic className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-600" />;
    }
  };

  const handleLoanChanges = async () => {
    await Promise.all(
      Object.entries(addingItems).map(async (i) => {
        await Promise.all(
          i[1].map(
            async (item: EquipmentItem) =>
              await createEquipmentLoanItem({
                loan: loans[i[0] as "foh" | "stage" | "egyeb"]!.id,
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

  const filteredFiles = files.filter((f) =>
    (f.file_name ?? "").toLowerCase().includes(fileSearch.toLowerCase()),
  );

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
      <Tabs defaultValue="overview" className="w-full max-w-[90vw]">
        <TabsList className="w-full justify-start bg-slate-100 h-auto overflow-x-auto inline-flex">
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
                <CardTitle className="text-sm font-medium">Stáb</CardTitle>
                <Users className="w-4 h-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueStaffCount} fő</div>
                <div className="space-y-2 mb-4">
                  {crew.slice(0, 3).map((c) => (
                    <div
                      key={c.staff}
                      className={`flex items-center justify-between text-sm p-2 rounded ${c.roles.some((r) => r.role === "leader") ? "bg-indigo-50" : "bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                        <span>{getStaffName(c.staff)}</span>
                      </div>
                      <div className="flex gap-1">
                        {c.roles.map((member_role: CrewMember) => (
                          <Badge key={member_role.id} variant="outline">
                            {getCrewPositionName(member_role.role!)}
                          </Badge>
                        ))}
                      </div>
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

            {/* Activitys Overview */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Próbák</CardTitle>
                <Calendar className="w-4 h-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activities.length}</div>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  próba időpont
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {activities
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
                  {activities.length === 0 && (
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
                                {getStaffName(task.assigned_to)}
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
                                {getStaffName(task.assigned_to)}
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

        {/* Crew Tab */}
        <TabsContent value="staff" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Stáb
              </CardTitle>
              {can("programs", "create") && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsCrewDialogOpen(true);
                    setEditingCrew(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Új stábtag
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crew.length > 0 ? (
                  crew.map((c) => (
                    <div
                      key={c.staff}
                      className={`flex items-center justify-between group p-3 rounded-lg transition ${c.roles.some((r) => r.role === "leader") ? "bg-indigo-100 hover:bg-indigo-50" : "border-2 border-slate-200  hover:bg-slate-100"}`}
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p
                            className={`text-sm font-medium ${c.roles.find((role) => role.role === "egyeb") ? "text-slate-400" : ""}`}
                          >
                            {getStaffName(c.staff)}
                          </p>
                          <div className="flex gap-1">
                            {c.roles.map((member_role: CrewMember) => (
                              <Badge
                                key={member_role.id}
                                variant={
                                  member_role.role === "egyeb"
                                    ? "outline"
                                    : "secondary"
                                }
                                className={
                                  member_role.role === "egyeb"
                                    ? "text-slate-400"
                                    : ""
                                }
                              >
                                {getCrewPositionName(member_role.role!)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                        {can("programs", "edit") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8  text-slate-400 hover:text-slate-600"
                            onClick={() => {
                              setEditingCrew(c);
                              setIsCrewDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {can("programs", "delete") &&
                          c.staff !== program.leader && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                              onClick={() => {
                                if (
                                  confirm("Biztosan eltávolítod ezt a tagot?")
                                ) {
                                  c.roles.forEach((role) => {
                                    deleteCrewMutation.mutate(role.id);
                                  });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
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
            <CardContent className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Fájl keresése..."
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Drag & Drop upload area */}
              {can("programs", "create") && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragging
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-slate-200 bg-slate-50 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload
                      className={`w-10 h-10 ${isDragging ? "text-indigo-500" : "text-slate-400"}`}
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">
                        {isDragging
                          ? "Engedd el a fájlokat a feltöltéshez"
                          : "Húzd ide a fájlokat, vagy"}
                      </p>
                      {!isDragging && (
                        <p className="text-xs text-slate-500 mt-1">
                          Dokumentumok, táblázatok, bemutatók, képek, videók,
                          hangfájlok
                        </p>
                      )}
                    </div>
                    {!isDragging && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.oasis.opendocument.presentation,image/*,video/*,audio/*"
                          onChange={handleFileInputChange}
                          disabled={uploadFileMutation.isPending}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          disabled={uploadFileMutation.isPending}
                          onClick={(e) => {
                            (
                              e.currentTarget
                                .previousElementSibling as HTMLInputElement
                            )?.click();
                          }}
                        >
                          {uploadFileMutation.isPending
                            ? "Feltöltés..."
                            : "Fájl kiválasztása"}
                        </Button>
                      </label>
                    )}

                    {/* File list inside drag & drop area */}
                    {files.length > 0 && (
                      <div className="w-full mt-2 space-y-2">
                        {filteredFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                {getFileIcon(file.mime_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <button
                                  className="font-medium text-sm text-slate-900 truncate hover:text-indigo-600 transition-colors text-left w-full"
                                  onClick={async () => {
                                    if (file.mime_type === "link") {
                                      if (file.file_url)
                                        window.open(file.file_url, "_blank");
                                    } else {
                                      const link =
                                        await getFileLinkAction(file);
                                      window.open(link, "_blank");
                                    }
                                  }}
                                >
                                  {file.file_name || "Fájl"}
                                </button>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {file.uploaded_at && (
                                    <p className="text-xs text-slate-500">
                                      {format(
                                        new Date(file.uploaded_at),
                                        "dd/MM/yyyy HH:mm",
                                      )}
                                    </p>
                                  )}
                                  {file.uploaded_by && (
                                    <>
                                      <span className="text-xs text-slate-300">
                                        •
                                      </span>
                                      <p className="text-xs text-slate-500">
                                        {getStaffName(file.uploaded_by)}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {can("programs", "delete") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                                disabled={deleteFileMutation.isPending}
                                onClick={() => deleteFileMutation.mutate(file)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {filteredFiles.length === 0 && (
                          <div className="text-center py-4 text-sm text-slate-400">
                            Nincs a keresésnek megfelelő fájl.
                          </div>
                        )}
                      </div>
                    )}

                    {files.length === 0 && (
                      <p className="text-sm text-slate-400">
                        Még nincs feltöltött fájl ehhez a programhoz.
                      </p>
                    )}

                    {/* Link input */}
                    <div className="flex items-center gap-2 w-full mt-2">
                      <input
                        type="text"
                        placeholder="Link hozzáadása..."
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && linkInput.trim()) {
                            linkFileMutation.mutate(linkInput.trim());
                          }
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        disabled={linkFileMutation.isPending}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-indigo-600 hover:text-indigo-700"
                        disabled={
                          linkFileMutation.isPending || !linkInput.trim()
                        }
                        onClick={() => {
                          if (linkInput.trim()) {
                            linkFileMutation.mutate(linkInput.trim());
                          }
                        }}
                      >
                        <SquarePlus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Read-only file list for users without upload permission */}
              {!can("programs", "create") && (
                <div className="space-y-2">
                  {files.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      Még nincs feltöltött fájl ehhez a programhoz.
                    </div>
                  ) : (
                    filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            {getFileIcon(file.mime_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              className="font-medium text-sm text-slate-900 truncate hover:text-indigo-600 transition-colors text-left w-full"
                              onClick={async () => {
                                if (file.mime_type === "link") {
                                  if (file.file_url)
                                    window.open(file.file_url, "_blank");
                                } else {
                                  const link = await getFileLinkAction(file);
                                  window.open(link, "_blank");
                                }
                              }}
                            >
                              {file.file_name || "Fájl"}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {file.uploaded_at && (
                                <p className="text-xs text-slate-500">
                                  {format(
                                    new Date(file.uploaded_at),
                                    "dd/MM/yyyy HH:mm",
                                  )}
                                </p>
                              )}
                              {file.uploaded_by && (
                                <>
                                  <span className="text-xs text-slate-300">
                                    •
                                  </span>
                                  <p className="text-xs text-slate-500">
                                    {getStaffName(file.uploaded_by)}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" /> Program Timeline
              </CardTitle>
              {can("programs", "create") && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingActivity(null);
                    setIsActivityDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Új Időpont
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: "program",
                    date: program.date,
                    data: program,
                    lesson_period: null,
                  },
                  ...activities.map((r) => ({
                    type: r.type,
                    date: r.date,
                    lesson_period: r.lesson_period,
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
                      className="flex group items-start gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-indigo-500"
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
                              : event.type === "proba"
                                ? "🎭 Próba"
                                : event.type === "megbeszeles"
                                  ? "📝 Megbeszélés"
                                  : event.type === "epites"
                                    ? "💡 Építés"
                                    : event.type === "bontas"
                                      ? "🚧 Bontás"
                                      : "-"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(event.date!), "HH:mm")}
                          </span>
                          {event.lesson_period && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {event.lesson_period}
                            </Badge>
                          )}
                        </div>
                        {event.type !== "program" &&
                          (event.data as Activity).notes && (
                            <p className="text-sm text-slate-600 mt-1">
                              {(event.data as Activity).notes}
                            </p>
                          )}
                      </div>
                      {event.type !== "program" && (
                        <div className="flex gap-2 group-hover:opacity-100 transition opacity-0">
                          {can("programs", "edit") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                              onClick={() => {
                                setEditingActivity(event.data);
                                setIsActivityDialogOpen(true);
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
                                  deleteActivityMutation.mutate(event.data.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                {activities.length === 0 && !program.date && (
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
            <DialogTitle>
              Stábtag {editingCrew ? "Szerkesztése" : "Hozzáadása"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCrewSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="staff">Személy</Label>
              <Select
                name="staff"
                required={editingCrew === null}
                disabled={editingCrew !== null}
                defaultValue={editingCrew?.staff}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassz személyt..." />
                </SelectTrigger>
                <SelectContent>
                  {editingCrew && (
                    <SelectItem
                      key={editingCrew.staff}
                      value={editingCrew.staff}
                    >
                      {getStaffName(editingCrew.staff)}
                    </SelectItem>
                  )}
                  {staffList
                    .filter(
                      (s) =>
                        !crew.find((c) => c.staff === s.id) &&
                        s.id !== editingCrew?.staff,
                    )
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name || s.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Feladatkörök</Label>
              {editingCrew === null && (
                <>
                  <br />
                  <Label htmlFor="other" className="pr-2">
                    Egyéb
                  </Label>
                  <input
                    type="checkbox"
                    checked={isRoleOther}
                    onChange={(e) => setIsRoleOther(e.target.checked)}
                  />
                </>
              )}
              {!isRoleOther && (
                <>
                  <div className="flex gap-2">
                    <Select
                      name="role"
                      value={addingRole ?? undefined}
                      onValueChange={(value) =>
                        setAddingRole(value as CrewPosition)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz feladatkört..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CREW_POSITIONS.filter(
                          (pos: CrewPosition) =>
                            !addingRoles.includes(pos) && pos !== "egyeb",
                        ).map((pos: CrewPosition) => (
                          <SelectItem key={pos} value={pos}>
                            {getCrewPositionName(pos)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (addingRole) {
                          setAddingRoles([...addingRoles, addingRole]);
                          setAddingRole(null);
                        }
                      }}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {editingCrew?.roles.map((role) => (
                      <Badge
                        key={role.id}
                        variant={
                          removingRoles.includes(role)
                            ? "destructive"
                            : "outline"
                        }
                        className="h-8"
                      >
                        {role.role}
                        {role.role !== "leader" && (
                          <X
                            onClick={() => {
                              if (!removingRoles.includes(role)) {
                                setRemovingRoles([...removingRoles, role]);
                              } else {
                                setRemovingRoles(
                                  removingRoles.filter((r) => r !== role),
                                );
                              }
                            }}
                          />
                        )}
                      </Badge>
                    ))}
                    {addingRoles.map((role) => (
                      <Badge key={role} variant="outline" className="h-8">
                        {role}
                        <X
                          onClick={() =>
                            setAddingRoles(
                              addingRoles.filter((r) => r !== role),
                            )
                          }
                        />
                      </Badge>
                    ))}{" "}
                  </div>
                </>
              )}
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
                disabled={
                  createCrewMutation.isPending || deleteCrewMutation.isPending
                }
              >
                {editingCrew ? "Mentés" : "Hozzáadás"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? "Időpont Szerkesztése" : "Új Időpont"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleActivitySubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="type">Típus</Label>
              <Select name="type" required defaultValue={editingActivity?.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz típust..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proba">Próba</SelectItem>
                  <SelectItem value="megbeszeles">Megbeszélés</SelectItem>
                  <SelectItem value="epites">Építés</SelectItem>
                  <SelectItem value="bontas">Bontás</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Dátum</Label>
                <Input
                  type="date"
                  name="date"
                  defaultValue={
                    editingActivity?.date
                      ? format(new Date(editingActivity.date), "yyyy-MM-dd")
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
                    editingActivity?.date
                      ? format(new Date(editingActivity.date), "HH:mm")
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
                defaultValue={editingActivity?.lesson_period || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Megjegyzések</Label>
              <Textarea
                name="notes"
                placeholder="Technikai igények, résztvevők, stb..."
                defaultValue={editingActivity?.notes || ""}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsActivityDialogOpen(false);
                  setEditingActivity(null);
                }}
              >
                Mégse
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={
                  createActivityMutation.isPending ||
                  updateActivityMutation.isPending
                }
              >
                {editingActivity ? "Mentés" : "Létrehozás"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loan editor */}
      <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
        <DialogContent className="max-h-[80%] !max-w-fit">
          <DialogHeader>
            <DialogTitle>Eszközök kezelése</DialogTitle>
          </DialogHeader>
          <div className="flex jutify-between gap-5 h-full w-full">
            {["foh", "stage", "egyeb"].map((inv) => (
              <div key={inv} className="space-y-2 block">
                <Label
                  htmlFor={`inv-${inv}`}
                  className="text-base font-semibold"
                >
                  {inv}
                </Label>
                <div className="bg-[#e5e5e54d] rounded-sm h-[500px] overflow-scroll w-full">
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
                defaultValue={editingTask?.assigned_to || "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassz személyt..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nincs hozzárendelve</SelectItem>
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
