"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Plus,
  User,
  Trash2,
  Edit,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "@/lib/db/staff";
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/lib/db/role";
import type {
  Staff,
  Role,
  StaffPosition,
  RoleView,
} from "@/lib/db/types";

const POSITIONS: { value: StaffPosition; label: string }[] = [
  { value: "hangtechnikus", label: "Hangtechnikus" },
  { value: "fenytechnikus", label: "Fénytechnikus" },
  { value: "stage", label: "Stage" },
  { value: "szervezo", label: "Szervező" },
  { value: "egyeb", label: "Egyéb" },
];

const ROLE_VIEWS: { value: RoleView; label: string }[] = [
  { value: "equipment", label: "Leltár" },
  { value: "programs", label: "Programok" },
  { value: "staff", label: "Személyzet" },
  { value: "task", label: "Feladatok" },
  { value: "chat", label: "Chat" },
  { value: "settings", label: "Admin Beállítások" },
];

const ROLE_COLORS: Record<string, string> = {
  piros: "bg-red-100 text-red-800 border-red-300",
  kek: "bg-blue-100 text-blue-800 border-blue-300",
  zold: "bg-green-100 text-green-800 border-green-300",
  sarga: "bg-yellow-100 text-yellow-800 border-yellow-300",
  lila: "bg-purple-100 text-purple-800 border-purple-300",
};

const ROLE_COLOR_BG: Record<string, string> = {
  piros: "bg-red-100 border-red-300",
  kek: "bg-blue-100 border-blue-300",
  zold: "bg-green-100 border-green-300",
  sarga: "bg-yellow-100 border-yellow-300",
  lila: "bg-purple-100 border-purple-300",
};

export default function StaffPage() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Staff dialog state
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Staff form state
  const [staffName, setStaffName] = useState("");
  const [staffMentionName, setStaffMentionName] = useState("");
  const [staffPosition, setStaffPosition] = useState<StaffPosition | "none">("egyeb");
  const [staffRoleId, setStaffRoleId] = useState<string>("none");

  // Role dialog state
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleColor, setRoleColor] = useState("kek");
  const [roleAdd, setRoleAdd] = useState<RoleView[]>([]);
  const [roleRead, setRoleRead] = useState<RoleView[]>([]);
  const [roleUpdate, setRoleUpdate] = useState<RoleView[]>([]);
  const [roleDelete, setRoleDelete] = useState<RoleView[]>([]);

  // Current user
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase.auth]);

  // Queries
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const { data: rolesList = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
  });

  // Staff mutations
  const createStaffMutation = useMutation({
    mutationFn: (data: Omit<Staff, "id"> & { id?: string }) => createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeStaffDialog();
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Staff> }) =>
      updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeStaffDialog();
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  // Role mutations
  const createRoleMutation = useMutation({
    mutationFn: (data: Omit<Role, "id">) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeRoleDialog();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Role> }) =>
      updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeRoleDialog();
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  // Staff dialog handlers
  const openStaffDialog = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setStaffName(staff.name ?? "");
      setStaffMentionName(staff.mention_name ?? "");
      setStaffPosition(staff.position ?? "egyeb");
      setStaffRoleId(staff.role?.toString() ?? "none");
    } else {
      setEditingStaff(null);
      setStaffName("");
      setStaffMentionName("");
      setStaffPosition("egyeb");
      setStaffRoleId("none");
    }
    setIsStaffDialogOpen(true);
  };

  const closeStaffDialog = () => {
    setIsStaffDialogOpen(false);
    setEditingStaff(null);
    setStaffName("");
    setStaffMentionName("");
    setStaffPosition("egyeb");
    setStaffRoleId("none");
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mentionName =
      staffMentionName || staffName.toLowerCase().replace(/\s+/g, "_");

    const data: Partial<Staff> = {
      name: staffName,
      mention_name: mentionName,
      position: staffPosition === "none" ? null : staffPosition,
      role: staffRoleId !== "none" ? parseInt(staffRoleId, 10) : null,
    };

    if (editingStaff) {
      updateStaffMutation.mutate({ id: editingStaff.id, data });
    } else {
      // For new staff without a linked auth user, we need a UUID.
      // In practice, staff records are typically linked to auth.users.
      // Here we create with the current user's ID as a fallback demo.
      createStaffMutation.mutate({
        ...(data as Omit<Staff, "id">),
        id: currentUserId ?? undefined,
      } as Omit<Staff, "id"> & { id?: string });
    }
  };

  // Role dialog handlers
  const openRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name ?? "");
      setRoleColor(role.color ?? "kek");
      setRoleAdd(role.add ?? []);
      setRoleRead(role.read ?? []);
      setRoleUpdate(role.update ?? []);
      setRoleDelete(role.delete ?? []);
    } else {
      setEditingRole(null);
      setRoleName("");
      setRoleColor("kek");
      setRoleAdd([]);
      setRoleRead(ROLE_VIEWS.map((v) => v.value).filter((v) => v !== "settings"));
      setRoleUpdate([]);
      setRoleDelete([]);
    }
    setIsRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    setIsRoleDialogOpen(false);
    setEditingRole(null);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Role> = {
      name: roleName,
      color: roleColor,
      add: roleAdd,
      read: roleRead,
      update: roleUpdate,
      delete: roleDelete,
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data as Omit<Role, "id">);
    }
  };

  const togglePermission = (
    list: RoleView[],
    setList: React.Dispatch<React.SetStateAction<RoleView[]>>,
    view: RoleView
  ) => {
    if (list.includes(view)) {
      setList(list.filter((v) => v !== view));
    } else {
      setList([...list, view]);
    }
  };

  // Helper to get role for a staff member
  const getStaffRole = (staff: Staff): Role | undefined => {
    if (!staff.role) return undefined;
    return rolesList.find((r) => r.id === staff.role);
  };

  const getPositionLabel = (position: StaffPosition | null): string => {
    if (!position) return "Egyéb";
    const p = POSITIONS.find((pos) => pos.value === position);
    return p?.label ?? position;
  };

  const formatPermissionLabel = (action: string): string => {
    switch (action) {
      case "add":
        return "Létrehozás";
      case "read":
        return "Megtekintés";
      case "update":
        return "Szerkesztés";
      case "delete":
        return "Törlés";
      default:
        return action;
    }
  };

  const getViewLabel = (view: RoleView): string => {
    const v = ROLE_VIEWS.find((rv) => rv.value === view);
    return v?.label ?? view;
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Személyzet</h1>
          <p className="text-slate-500">
            Technikusok és szervezők kezelése
          </p>
        </div>
        {can("staff", "create") && (
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => openStaffDialog()}
          >
            <Plus className="w-4 h-4 mr-2" /> Új Tag
          </Button>
        )}
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="staff">Személyzet</TabsTrigger>
          {can("admin_settings", "view") && (
            <TabsTrigger value="admin">Admin Beállítások</TabsTrigger>
          )}
        </TabsList>

        {/* Staff Tab */}
        <TabsContent value="staff" className="mt-6">
          {!can("staff", "view") ? (
            <div className="text-center py-12 text-slate-400">
              Nincs jogosultságod megtekinteni ezt az oldalt.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((staff) => {
                const role = getStaffRole(staff);
                return (
                  <Card
                    key={staff.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 overflow-hidden">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-col gap-1">
                              <h3 className="font-bold text-slate-900">
                                {staff.name ?? "Névtelen"}
                              </h3>
                              {role && (
                                <Badge
                                  className={`text-xs w-fit ${
                                    role.color
                                      ? ROLE_COLORS[role.color] ??
                                        "bg-indigo-100 text-indigo-800"
                                      : "bg-indigo-100 text-indigo-800"
                                  }`}
                                >
                                  {role.name ?? "Szerepkör"}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge
                                variant="secondary"
                                className="capitalize text-xs"
                              >
                                {getPositionLabel(staff.position)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {(can("staff", "edit") || can("staff", "delete")) && (
                          <div className="flex gap-1">
                            {can("staff", "edit") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-indigo-600 h-8 w-8"
                                onClick={() => openStaffDialog(staff)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {can("staff", "delete") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-red-600 h-8 w-8"
                                onClick={() => {
                                  if (confirm("Biztosan törlöd?"))
                                    deleteStaffMutation.mutate(staff.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        {staff.mention_name && (
                          <div className="text-sm text-slate-500">
                            @{staff.mention_name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {staffList.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed rounded-lg">
                  Nincs rögzített személyzet.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Admin Tab */}
        {can("admin_settings", "view") && (
          <TabsContent value="admin" className="mt-6">
            <div className="space-y-6">
              {/* Roles Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      Szerepkörök Kezelése
                    </CardTitle>
                    <Button
                      onClick={() => openRoleDialog()}
                      className="bg-indigo-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Új Szerepkör
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-4">
                    {rolesList.map((role) => (
                      <AccordionItem
                        key={role.id}
                        value={role.id.toString()}
                        className={`border rounded-lg ${
                          role.color
                            ? ROLE_COLOR_BG[role.color] ?? "bg-white"
                            : "bg-white"
                        }`}
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div>
                              <h3 className="font-semibold text-slate-900 text-left">
                                {role.name ?? "Névtelen"}
                              </h3>
                            </div>
                            <div
                              className="flex gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRoleDialog(role)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Biztosan törölni szeretnéd ezt a szerepkört?"
                                    )
                                  ) {
                                    deleteRoleMutation.mutate(role.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {(
                              [
                                {
                                  key: "read" as const,
                                  label: "Megtekintés",
                                  emoji: "👁️",
                                },
                                {
                                  key: "add" as const,
                                  label: "Létrehozás",
                                  emoji: "➕",
                                },
                                {
                                  key: "update" as const,
                                  label: "Szerkesztés",
                                  emoji: "✏️",
                                },
                                {
                                  key: "delete" as const,
                                  label: "Törlés",
                                  emoji: "🗑️",
                                },
                              ] as const
                            ).map(({ key, label, emoji }) => {
                              const views = role[key];
                              if (!views || views.length === 0) return null;
                              return (
                                <div
                                  key={key}
                                  className="bg-slate-50 p-2 rounded"
                                >
                                  <strong className="text-slate-900">
                                    {emoji} {label}:
                                  </strong>
                                  <div className="flex gap-2 mt-1 flex-wrap">
                                    {views.map((view) => (
                                      <Badge
                                        key={view}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {getViewLabel(view)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    {rolesList.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        Nincs szerepkör rögzítve.
                      </div>
                    )}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Staff Role Assignment Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Személyzet Szerepkörei</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {staffList.map((staff) => {
                      const role = getStaffRole(staff);
                      return (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {staff.name ?? "Névtelen"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {getPositionLabel(staff.position)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={
                                role?.color
                                  ? ROLE_COLORS[role.color] ??
                                    "bg-indigo-100 text-indigo-800"
                                  : "bg-slate-100 text-slate-600"
                              }
                            >
                              {role?.name ?? "Nincs szerepkör"}
                            </Badge>
                            {can("admin_settings", "edit") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStaffDialog(staff)}
                              >
                                Módosítás
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {staffList.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        Nincs személyzet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Staff Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Munkatárs Szerkesztése" : "Új Munkatárs"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStaffSubmit} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label>Név</Label>
              <Input
                value={staffName}
                onChange={(e) => {
                  setStaffName(e.target.value);
                  if (!editingStaff) {
                    setStaffMentionName(
                      e.target.value.toLowerCase().replace(/\s+/g, "_")
                    );
                  }
                }}
                required
                placeholder="Teljes név"
              />
            </div>

            <div className="grid gap-2">
              <Label>Mention név</Label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">@</span>
                <Input
                  value={staffMentionName}
                  onChange={(e) =>
                    setStaffMentionName(
                      e.target.value.toLowerCase().replace(/\s+/g, "_")
                    )
                  }
                  placeholder="mention_nev"
                />
              </div>
              <p className="text-xs text-slate-400">
                Ezzel a névvel lehet megemlíteni a chatben.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Munkakör</Label>
              <Select
                value={staffPosition}
                onValueChange={(v) =>
                  setStaffPosition(v as StaffPosition | "none")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válassz munkakört..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nincs megadva</SelectItem>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Szerepkör</Label>
              <Select value={staffRoleId} onValueChange={setStaffRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz szerepkört..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nincs szerepkör</SelectItem>
                  {rolesList.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name ?? `Szerepkör #${role.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                className="bg-indigo-600 text-white w-full"
              >
                Mentés
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Szerepkör Szerkesztése" : "Új Szerepkör"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-6 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Szerepkör neve</Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="pl. Moderátor"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Szín</Label>
                <Select value={roleColor} onValueChange={setRoleColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piros">🔴 Piros</SelectItem>
                    <SelectItem value="kek">🔵 Kék</SelectItem>
                    <SelectItem value="zold">🟢 Zöld</SelectItem>
                    <SelectItem value="sarga">🟡 Sárga</SelectItem>
                    <SelectItem value="lila">🟣 Lila</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">
                Jogosultságok
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-slate-700">
                        Modul
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-slate-700">
                        Megtekintés
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-slate-700">
                        Létrehozás
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-slate-700">
                        Szerkesztés
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-slate-700">
                        Törlés
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROLE_VIEWS.map((view) => (
                      <tr
                        key={view.value}
                        className="border-b last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="py-3 pr-4 font-medium">
                          {view.label}
                        </td>
                        <td className="text-center py-3 px-3">
                          <Checkbox
                            checked={roleRead.includes(view.value)}
                            onCheckedChange={() =>
                              togglePermission(
                                roleRead,
                                setRoleRead,
                                view.value
                              )
                            }
                          />
                        </td>
                        <td className="text-center py-3 px-3">
                          <Checkbox
                            checked={roleAdd.includes(view.value)}
                            onCheckedChange={() =>
                              togglePermission(
                                roleAdd,
                                setRoleAdd,
                                view.value
                              )
                            }
                          />
                        </td>
                        <td className="text-center py-3 px-3">
                          <Checkbox
                            checked={roleUpdate.includes(view.value)}
                            onCheckedChange={() =>
                              togglePermission(
                                roleUpdate,
                                setRoleUpdate,
                                view.value
                              )
                            }
                          />
                        </td>
                        <td className="text-center py-3 px-3">
                          <Checkbox
                            checked={roleDelete.includes(view.value)}
                            onCheckedChange={() =>
                              togglePermission(
                                roleDelete,
                                setRoleDelete,
                                view.value
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeRoleDialog}
              >
                Mégse
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                Mentés
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
