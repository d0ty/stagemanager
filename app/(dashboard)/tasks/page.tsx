"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Mic2,
  Lightbulb,
  Edit2,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { listPrograms } from "@/lib/db/program";
import { listStaff } from "@/lib/db/staff";
import { listTasks, createTask, updateTask, deleteTask } from "@/lib/db/task";
import type { Task, TaskType, TaskPriority, TaskStatus } from "@/lib/db/types";
import { formatDate } from "@/lib/date";

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [taskType, setTaskType] = useState<TaskType>("sound");
  const [selectedProgramId, setSelectedProgramId] = useState<
    number | "all" | "unassigned"
  >("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Form state for editing
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editProgramId, setEditProgramId] = useState<string>("");
  const [editAssignedTo, setEditAssignedTo] = useState<string>("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("kozepes");

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: () => listPrograms(),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => listTasks(),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => listStaff(),
  });

  const tasks = allTasks.filter((t) => t.type === taskType);

  const programTasks =
    selectedProgramId === "all"
      ? tasks
      : selectedProgramId === "unassigned"
        ? tasks.filter((t) => !t.program)
        : tasks.filter((t) => t.program === selectedProgramId);

  const createTaskMutation = useMutation({
    mutationFn: (data: Omit<Task, "id">) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) =>
      updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const programIdStr = formData.get("program_id") as string;
    const assignedTo = formData.get("assigned_to") as string;

    createTaskMutation.mutate({
      program:
        programIdStr && programIdStr !== "none"
          ? parseInt(programIdStr, 10)
          : null,
      type: taskType,
      assigned_to: assignedTo && assignedTo !== "none" ? assignedTo : null,
      priority: (formData.get("priority") as TaskPriority) || "kozepes",
      status: "teendo" as TaskStatus,
      details: (formData.get("details") as string) || null,
    });
    e.currentTarget.reset();
  };

  const handleUpdateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;

    updateTaskMutation.mutate({
      id: editingTask.id,
      data: {
        program:
          editProgramId && editProgramId !== "none"
            ? parseInt(editProgramId, 10)
            : null,
        assigned_to:
          editAssignedTo && editAssignedTo !== "none" ? editAssignedTo : null,
        priority: editPriority,
        details: editDetails || null,
      },
    });
    setEditingTask(null);
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus: TaskStatus = task.status === "kesz" ? "teendo" : "kesz";
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: newStatus },
    });
  };

  const getStaffName = (staffId: string | null): string => {
    if (!staffId) return "Nincs hozzárendelve";
    const staff = staffList.find((s) => s.id === staffId);
    return staff?.name ?? "Ismeretlen";
  };

  const getProgramName = (programId: number | null): string => {
    if (!programId) return "Nincs programhoz kötve";
    const program = programs.find((p) => p.id === programId);
    return program?.description ?? "Ismeretlen program";
  };

  // Initialize edit form when editingTask changes
  useEffect(() => {
    if (editingTask) {
      setEditDetails(editingTask.details ?? "");
      setEditProgramId(editingTask.program?.toString() ?? "none");
      setEditAssignedTo(editingTask.assigned_to ?? "none");
      setEditPriority(editingTask.priority ?? "kozepes");
    }
  }, [editingTask]);

  const themeColor = taskType === "sound" ? "indigo" : "amber";
  const Icon = taskType === "sound" ? Mic2 : Lightbulb;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          Feladatok
        </h1>
        <p className="text-slate-500">
          Hangtechnikai és fénytechnikai feladatok kezelése
        </p>
      </div>

      {/* Task Type Selector */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTaskType("sound")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            taskType === "sound"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Mic2 className="w-4 h-4" />
          Hangtechnika
        </button>
        <button
          onClick={() => setTaskType("light")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            taskType === "light"
              ? "bg-white text-amber-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Fénytechnika
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Select Program */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Esemény Kiválasztása</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              <button
                onClick={() => setSelectedProgramId("all")}
                className={`p-4 text-left border-l-4 transition-all hover:bg-slate-50 ${
                  selectedProgramId === "all"
                    ? `border-${themeColor}-600 bg-${themeColor === "indigo" ? "indigo" : "amber"}-50`
                    : "border-transparent"
                }`}
              >
                <div className="font-medium">Minden program</div>
                <div className="text-xs text-slate-500">Összes feladat</div>
              </button>
              <button
                onClick={() => setSelectedProgramId("unassigned")}
                className={`p-4 text-left border-l-4 transition-all hover:bg-slate-50 ${
                  selectedProgramId === "unassigned"
                    ? `border-${themeColor}-600 bg-${themeColor === "indigo" ? "indigo" : "amber"}-50`
                    : "border-transparent"
                }`}
              >
                <div className="font-medium">Nincs programhoz rendelve</div>
                <div className="text-xs text-slate-500">
                  Általános feladatok
                </div>
              </button>
              {programs
                .filter(
                  (p) =>
                    Date.parse(p.date!) + 24 * 3600 * 1000 > Date.now() &&
                    p.status !== "lemondva" &&
                    p.status !== "lezarva",
                )
                .map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => setSelectedProgramId(prog.id)}
                    className={`p-4 text-left border-l-4 transition-all hover:bg-slate-50 ${
                      selectedProgramId === prog.id
                        ? `border-${themeColor}-600 bg-${themeColor === "indigo" ? "indigo" : "amber"}-50`
                        : "border-transparent"
                    }`}
                  >
                    <div className="font-medium truncate">
                      {prog.description || "Névtelen"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {prog.date ? formatDate(new Date(prog.date)) : "-"}
                    </div>
                  </button>
                ))}
              {programs.length === 0 && (
                <div className="p-4 text-sm text-slate-400">
                  Nincs elérhető esemény.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main: Task Board */}
        <div className="lg:col-span-3 space-y-6">
          {/* New Task Form */}
          {can("tasks", "create") && (
            <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Új Feladat Hozzáadása
                      </CardTitle>
                      {isFormOpen ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <form onSubmit={handleAddTask} className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">
                          Esemény (Opcionális)
                        </label>
                        <Select
                          name="program_id"
                          defaultValue={
                            typeof selectedProgramId === "number"
                              ? selectedProgramId.toString()
                              : "none"
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz eseményt..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              Nincs eseményhez kötve
                            </SelectItem>
                            {programs.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.description || "Névtelen"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium">
                          Részletek / Megjegyzések
                        </label>
                        <Textarea
                          name="details"
                          placeholder="Technikai részletek, igények..."
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="grid gap-2 w-full md:w-48">
                          <label className="text-xs font-medium">Kinek?</label>
                          <Select name="assigned_to" defaultValue="none">
                            <SelectTrigger>
                              <SelectValue placeholder="Válassz..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Nincs hozzárendelve
                              </SelectItem>
                              {staffList.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name ?? s.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2 w-full md:w-32">
                          <label className="text-xs font-medium">
                            Prioritás
                          </label>
                          <Select name="priority" defaultValue="kozepes">
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
                      </div>

                      <Button
                        type="submit"
                        className={`w-full ${
                          taskType === "sound"
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "bg-amber-600 hover:bg-amber-700"
                        } text-white`}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Hozzáadás
                      </Button>
                    </form>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Task List */}
          <div className="grid gap-3">
            {programTasks.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                {selectedProgramId === "all"
                  ? "Nincsenek feladatok."
                  : selectedProgramId === "unassigned"
                    ? "Nincsenek általános feladatok."
                    : "Ehhez az eseményhez nincsenek technikai feladatok."}
              </div>
            )}
            {programTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4 flex-1">
                  <button onClick={() => toggleTaskStatus(task)}>
                    {task.status === "kesz" ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle
                        className={`w-6 h-6 text-slate-300 hover:text-${themeColor}-500`}
                      />
                    )}
                  </button>
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setViewingTask(task)}
                  >
                    <h4
                      className={`font-medium transition-colors ${
                        task.status === "kesz"
                          ? "line-through text-slate-400"
                          : "text-slate-900"
                      }`}
                    >
                      {task.details
                        ? task.details.substring(0, 80) +
                          (task.details.length > 80 ? "..." : "")
                        : "Feladat"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 ${
                          taskType === "sound"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <User className="w-3 h-3" />
                        {getStaffName(task.assigned_to)}
                      </Badge>
                      <Badge
                        className={`text-[10px] ${
                          task.priority === "magas"
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : task.priority === "kozepes"
                              ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {task.priority ?? "kozepes"}
                      </Badge>
                      {task.program && (
                        <Badge variant="secondary" className="text-[10px]">
                          {getProgramName(task.program)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                  {can("tasks", "edit") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-indigo-600"
                      onClick={() => setEditingTask(task)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  {can("tasks", "delete") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Task Dialog */}
      <Dialog
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon
                className={`w-5 h-5 ${taskType === "sound" ? "text-indigo-600" : "text-amber-600"}`}
              />
              Feladat Részletei
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {viewingTask?.details && (
              <div className="grid gap-2">
                <Label className="text-slate-500 text-xs">
                  Részletek / Megjegyzések
                </Label>
                <p className="text-sm bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                  {viewingTask.details}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-slate-500 text-xs">
                  Hozzárendelt személy
                </Label>
                <Badge
                  variant="outline"
                  className={`w-fit flex items-center gap-1 ${
                    taskType === "sound"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <User className="w-3 h-3" />
                  {getStaffName(viewingTask?.assigned_to ?? null)}
                </Badge>
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-500 text-xs">Prioritás</Label>
                <Badge
                  className={`w-fit ${
                    viewingTask?.priority === "magas"
                      ? "bg-red-100 text-red-800"
                      : viewingTask?.priority === "kozepes"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {viewingTask?.priority ?? "kozepes"}
                </Badge>
              </div>
            </div>

            {viewingTask?.program && (
              <div className="grid gap-2">
                <Label className="text-slate-500 text-xs">Program</Label>
                <p className="text-sm">{getProgramName(viewingTask.program)}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  setEditingTask(viewingTask);
                  setViewingTask(null);
                }}
                variant="outline"
                className="flex-1"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Szerkesztés
              </Button>
              <Button
                onClick={() => setViewingTask(null)}
                className={`flex-1 ${
                  taskType === "sound"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-amber-600 hover:bg-amber-700"
                } text-white`}
              >
                Bezárás
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feladat Szerkesztése</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTask} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label>Részletek / Feljegyzések</Label>
              <Textarea
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                placeholder="Írj ide feljegyzéseket..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label>Esemény</Label>
              <Select value={editProgramId} onValueChange={setEditProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz eseményt..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nincs eseményhez kötve</SelectItem>
                  {programs.map((prog) => (
                    <SelectItem key={prog.id} value={prog.id.toString()}>
                      {prog.description || "Névtelen"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Kinek?</Label>
              <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nincs hozzárendelve</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name ?? s.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Prioritás</Label>
              <Select
                value={editPriority}
                onValueChange={(v) => setEditPriority(v as TaskPriority)}
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

            <Button
              type="submit"
              className={`w-full ${
                taskType === "sound"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-amber-600 hover:bg-amber-700"
              } text-white`}
            >
              Mentés
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
