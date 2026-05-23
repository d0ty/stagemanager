"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Box,
  Plus,
  Search,
  ArrowRightLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  History,
  Edit,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/date";
import {
  listEquipmentTypes,
  listEquipmentItems,
  listEquipmentLoans,
  listEquipmentLoanItems,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType,
  createEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem,
  createEquipmentLoan,
  updateEquipmentLoan,
  createEquipmentLoanItem,
} from "@/lib/db/equipment";
import { listStaff } from "@/lib/db/staff";
import { listPrograms } from "@/lib/db/program";
import type {
  EquipmentType,
  EquipmentItem,
  EquipmentLoan,
  EquipmentLoanItem,
  EquipmentCategory,
  EquipmentStatus,
  EquipmentLoanTakerType,
  EquipmentLoanTaker,
} from "@/lib/db/types";

export default function InventoryPage() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("loans");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewTypeOpen, setIsNewTypeOpen] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [equipmentSortField, setEquipmentSortField] = useState<string | null>(
    null,
  );
  const [equipmentSortDirection, setEquipmentSortDirection] = useState<
    "asc" | "desc"
  >("asc");
  const [currentLoanId, setCurrentLoanId] = useState<number | null>(null);

  // New item form state
  const [newItemTypeId, setNewItemTypeId] = useState<string>("");
  const [newItemSerial, setNewItemSerial] = useState("");
  const [newItemStatus, setNewItemStatus] =
    useState<EquipmentStatus>("elerheto");
  const [newItemNotes, setNewItemNotes] = useState("");

  // Queries
  const { data: equipmentTypes = [] } = useQuery({
    queryKey: ["equipment-types"],
    queryFn: listEquipmentTypes,
  });

  const { data: equipmentItems = [] } = useQuery({
    queryKey: ["equipment-items"],
    queryFn: listEquipmentItems,
  });

  const { data: loans = [] } = useQuery({
    queryKey: ["equipment-loans"],
    queryFn: () => listEquipmentLoans(),
  });

  const { data: loanItems = [] } = useQuery({
    queryKey: ["equipment-loan-items"],
    queryFn: listEquipmentLoanItems,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: () => listPrograms("date"),
  });

  // Helper lookups
  const getTypeName = (typeId: number): string => {
    const t = equipmentTypes.find((et) => et.id === typeId);
    return t?.name ?? "Ismeretlen";
  };

  const getTypeCategory = (typeId: number): string => {
    const t = equipmentTypes.find((et) => et.id === typeId);
    return t?.category ?? "egyeb";
  };

  const getItemById = (itemId: number): EquipmentItem | undefined => {
    return equipmentItems.find((i) => i.id === itemId);
  };

  const getItemsForLoan = (loanId: number): EquipmentItem[] => {
    const itemIds = loanItems
      .filter((li) => li.loan === loanId)
      .map((li) => li.item);
    return itemIds
      .map((id) => equipmentItems.find((i) => i.id === id))
      .filter(Boolean) as EquipmentItem[];
  };

  const isItemLoaned = (itemId: number): boolean => {
    const activeLoans = loans.filter((l) => l.status === "aktiv");
    const activeLoanIds = new Set(activeLoans.map((l) => l.id));
    return loanItems.some(
      (li) => li.item === itemId && activeLoanIds.has(li.loan),
    );
  };

  const getActiveLoans = () =>
    loans.filter((l) => {
      return (
        loanItems.filter((li) => li.loan == l.id).length > 0 &&
        l.status == "aktiv"
      );
    });
  const getHistoryLoans = () => loans.filter((l) => l.status === "lezart");

  // Mutations
  const createTypeMutation = useMutation({
    mutationFn: (data: Omit<EquipmentType, "id">) => createEquipmentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-types"] });
      setIsNewTypeOpen(false);
      setEditingType(null);
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EquipmentType> }) =>
      updateEquipmentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-types"] });
      setIsNewTypeOpen(false);
      setEditingType(null);
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => deleteEquipmentType(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["equipment-types"] }),
  });

  const createItemMutation = useMutation({
    mutationFn: (data: Omit<EquipmentItem, "id">) => createEquipmentItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] });
      setIsNewItemOpen(false);
      setNewItemSerial("");
      setNewItemNotes("");
      setNewItemStatus("elerheto");
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EquipmentItem> }) =>
      updateEquipmentItem(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => deleteEquipmentItem(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["equipment-items"] }),
  });

  const createLoanMutation = useMutation({
    mutationFn: async (data: {
      takenBy: EquipmentLoanTaker;
      expectedReturnDate: string | null;
      itemIds: number[];
      notes: string;
    }) => {
      const loan = await createEquipmentLoan({
        start_date: new Date().toISOString(),
        expected_return_date: data.expectedReturnDate,
        return_date: null,
        inventory: null,
        status: "aktiv",
        taken_by: data.takenBy,
        notes: data.notes,
      });
      for (const itemId of data.itemIds) {
        await createEquipmentLoanItem({ loan: loan.id, item: itemId });
      }
      return loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-loans"] });
      queryClient.invalidateQueries({ queryKey: ["equipment-loan-items"] });
      setIsLoanOpen(false);
      setSelectedItems([]);
    },
  });

  const returnLoanMutation = useMutation({
    mutationFn: (loanId: number) =>
      updateEquipmentLoan(loanId, {
        status: "lezart",
        return_date: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-loans"] });
      queryClient.invalidateQueries({ queryKey: ["equipment-loan-items"] });
    },
  });

  const returnAllLoansMutation = useMutation({
    mutationFn: async (loanIds: number[]) => {
      for (const id of loanIds) {
        await updateEquipmentLoan(id, {
          status: "lezart",
          return_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-loans"] });
      queryClient.invalidateQueries({ queryKey: ["equipment-loan-items"] });
    },
  });

  // Handlers
  const handleCreateType = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      category: (formData.get("category") as EquipmentCategory) || null,
      description: (formData.get("description") as string) || null,
    };
    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, data });
    } else {
      createTypeMutation.mutate(data);
    }
  };

  const handleCreateItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newItemTypeId) return;

    // Support multi-line serials
    const serials = newItemSerial
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    if (serials.length === 0) {
      serials.push(`ITEM-${Date.now()}`);
    }

    const promises = serials.map((serial) =>
      createItemMutation.mutateAsync({
        type: parseInt(newItemTypeId, 10),
        serial,
        status: newItemStatus,
        notes: newItemNotes || null,
      }),
    );

    Promise.all(promises).then(() => {
      setIsNewItemOpen(false);
      setNewItemSerial("");
      setNewItemNotes("");
      setNewItemTypeId("");
    });
  };

  const handleCreateLoan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const staffId = formData.get("staff_id") as string;
    const programId = formData.get("program_id") as string;
    const expectedReturn = formData.get("expected_return_date") as string;
    const notes = formData.get("notes") as string;
    const externalName = formData.get("external_name") as string;

    createLoanMutation.mutate({
      takenBy: {
        type: staffId === "external" ? "external" : "staff",
        staff: staffId === "external" ? undefined : staffId,
        name: staffId === "external" ? externalName : undefined,
        program:
          programId && programId !== "none"
            ? (parseInt(programId) ?? undefined)
            : undefined,
      },
      expectedReturnDate: expectedReturn
        ? new Date(expectedReturn).toISOString()
        : null,
      itemIds: selectedItems,
      notes: notes || "",
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEquipmentSort = (field: string) => {
    if (equipmentSortField === field) {
      setEquipmentSortDirection(
        equipmentSortDirection === "asc" ? "desc" : "asc",
      );
    } else {
      setEquipmentSortField(field);
      setEquipmentSortDirection("asc");
    }
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  // Derived data
  const activeLoans = getActiveLoans();
  const historyLoans = getHistoryLoans();

  const availableItems = equipmentItems.filter(
    (item) =>
      item.status === "elerheto" &&
      !isItemLoaned(item.id) &&
      !selectedItems.includes(item.id),
  );
  // Items enriched with type info for the inventory table
  const enrichedItems = equipmentItems.map((item) => {
    const type = equipmentTypes.find((t) => t.id === item.type);
    return {
      ...item,
      typeName: type?.name ?? "Ismeretlen",
      typeCategory: type?.category ?? "egyeb",
      typeDescription: type?.description ?? "",
      loaned: isItemLoaned(item.id),
    };
  });

  const filteredItems = enrichedItems.filter(
    (item) =>
      item.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!equipmentSortField) return 0;
    let cmp = 0;
    if (equipmentSortField === "name") {
      cmp = a.typeName.localeCompare(b.typeName);
    } else if (equipmentSortField === "category") {
      cmp = (a.typeCategory ?? "").localeCompare(b.typeCategory ?? "");
    } else if (equipmentSortField === "status") {
      const statusOrder: Record<string, number> = {
        elerheto: 1,
        karbantartas: 2,
        selejt: 3,
      };
      const aOrder = a.loaned ? 1.5 : (statusOrder[a.status] ?? 99);
      const bOrder = b.loaned ? 1.5 : (statusOrder[b.status] ?? 99);
      cmp = aOrder - bOrder;
    } else if (equipmentSortField === "serial") {
      cmp = a.serial.localeCompare(b.serial);
    }
    return equipmentSortDirection === "asc" ? cmp : -cmp;
  });

  // Sort active loans
  const sortedActiveLoans = [...activeLoans].sort((a, b) => {
    if (!sortField) return 0;
    let cmp = 0;
    const aBy = a.taken_by as Record<string, string> | null;
    const bBy = b.taken_by as Record<string, string> | null;
    if (sortField === "staff") {
      cmp = (aBy?.staff_name ?? "").localeCompare(bBy?.staff_name ?? "");
    } else if (sortField === "taken_at") {
      cmp =
        new Date(a.start_date ?? 0).getTime() -
        new Date(b.start_date ?? 0).getTime();
    } else if (sortField === "expected_return") {
      const aDate = a.expected_return_date
        ? new Date(a.expected_return_date).getTime()
        : Infinity;
      const bDate = b.expected_return_date
        ? new Date(b.expected_return_date).getTime()
        : Infinity;
      cmp = aDate - bDate;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const [isExternal, setIsExternal] = useState(false);

  const getLoanTakenBy = (
    loan: EquipmentLoan,
  ): { staffName: string; isExternal: boolean; notes: string } => {
    const tb = loan.taken_by as EquipmentLoanTaker | null;
    return {
      staffName:
        (tb?.type == "external"
          ? tb?.name
          : staffList.find((s) => s.id === tb?.staff)?.name) ?? "Ismeretlen",
      isExternal: tb?.type === "external",
      notes: (loan.notes as string) ?? "",
    };
  };

  useEffect(() => {
    if (currentLoanId !== null) {
      setCurrentLoanId(
        parseInt(window.location.search.replace("?", "").split("=")[1]),
      );
    }
    document.getElementById("current-loan")?.scrollIntoView();
  }, [currentLoanId]);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Box className="w-8 h-8 text-indigo-600" />
            Leltár
          </h1>
          <p className="text-slate-500">Eszközök nyilvántartása és kiadása</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {can("equipment", "create") && (
            <>
              {/* New Equipment Type Dialog */}
              <Dialog
                open={isNewTypeOpen}
                onOpenChange={(open) => {
                  setIsNewTypeOpen(open);
                  if (!open) setEditingType(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Új Típus
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingType ? "Típus Szerkesztése" : "Új Eszköztípus"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateType} className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label>Megnevezés</Label>
                      <Input
                        name="name"
                        defaultValue={editingType?.name}
                        required
                        placeholder="pl. Shure SM58"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Kategória</Label>
                      <Select
                        name="category"
                        defaultValue={editingType?.category ?? "hangtechnika"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hangtechnika">
                            Hangtechnika
                          </SelectItem>
                          <SelectItem value="fenytechnika">
                            Fénytechnika
                          </SelectItem>
                          <SelectItem value="szinpad">Színpad</SelectItem>
                          <SelectItem value="kabel">Kábel</SelectItem>
                          <SelectItem value="egyeb">Egyéb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Leírás</Label>
                      <Input
                        name="description"
                        defaultValue={editingType?.description ?? ""}
                        placeholder="Opcionális leírás..."
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 text-white"
                    >
                      Mentés
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* New Equipment Item Dialog */}
              <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Új Eszköz
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Új Eszköz Hozzáadása</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateItem} className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label>Eszköztípus</Label>
                      <Select
                        value={newItemTypeId}
                        onValueChange={setNewItemTypeId}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Válassz típust..." />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name} ({t.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Szériaszám(ok) - soronként egy</Label>
                      <Textarea
                        value={newItemSerial}
                        onChange={(e) => setNewItemSerial(e.target.value)}
                        placeholder={"ABC-001\nABC-002\nABC-003"}
                        className="font-mono text-sm"
                        required
                      />
                      <p className="text-[10px] text-slate-400">
                        Több szériaszám megadása esetén minden sorhoz külön
                        eszköz jön létre.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Állapot</Label>
                      <Select
                        value={newItemStatus}
                        onValueChange={(v) =>
                          setNewItemStatus(v as EquipmentStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="elerheto">Elérhető</SelectItem>
                          <SelectItem value="karbantartas">
                            Karbantartás
                          </SelectItem>
                          <SelectItem value="selejt">Selejt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Megjegyzés</Label>
                      <Input
                        value={newItemNotes}
                        onChange={(e) => setNewItemNotes(e.target.value)}
                        placeholder="Opcionális..."
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 text-white"
                      disabled={!newItemTypeId}
                    >
                      Mentés
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}

          {can("equipment", "edit") && (
            <Dialog
              open={isLoanOpen}
              onOpenChange={(open) => {
                setIsLoanOpen(open);
                if (!open) {
                  setSelectedItems([]);
                  setIsExternal(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Eszköz Kiadása
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Eszközök Kiadása</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateLoan} className="space-y-4 mt-4">
                  {/* Selected items */}
                  <div className="grid gap-2">
                    <Label>
                      Kiválasztott eszközök ({selectedItems.length})
                    </Label>
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-slate-50 space-y-2">
                      {selectedItems.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-2">
                          Még nincs kiválasztott eszköz
                        </p>
                      ) : (
                        selectedItems.map((itemId) => {
                          const item = getItemById(itemId);
                          return (
                            <div
                              key={itemId}
                              className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                              <div>
                                <span className="font-medium text-sm">
                                  {item ? getTypeName(item.type) : "Ismeretlen"}
                                </span>
                                <span className="text-xs text-slate-500 ml-2">
                                  ({item?.serial ?? "?"})
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleItemSelection(itemId)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Add item */}
                  <div className="grid gap-2">
                    <Label>Eszköz hozzáadása</Label>
                    <Select
                      value=""
                      onValueChange={(v) => {
                        const itemId = parseInt(v, 10);
                        if (!selectedItems.includes(itemId)) {
                          setSelectedItems((prev) => [...prev, itemId]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz eszközt..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {getTypeName(item.type)} - {item.serial}
                          </SelectItem>
                        ))}
                        {availableItems.length === 0 && (
                          <div className="p-2 text-sm text-slate-400 text-center">
                            Nincs elérhető eszköz
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Who */}
                  <div className="grid gap-2">
                    <Label>
                      Ki viszi el? <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="staff_id"
                      required
                      onValueChange={(value) =>
                        setIsExternal(value === "external")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz személyt" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name ?? s.id}
                          </SelectItem>
                        ))}
                        <SelectItem value="external">Külsős</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isExternal && (
                    <div className="grid gap-2 animate-in fade-in">
                      <Label>
                        Külsős neve <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="external_name"
                        placeholder="pl. Kovács János"
                        required
                      />
                    </div>
                  )}

                  {/* Program */}
                  <div className="grid gap-2">
                    <Label>Melyik programhoz? (Opcionális)</Label>
                    <Select name="program_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz programot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Nincs programhoz kötve
                        </SelectItem>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.description || "Névtelen"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Expected return */}
                  <div className="grid gap-2">
                    <Label>Várható visszavétel (Opcionális)</Label>
                    <Input type="date" name="expected_return_date" />
                  </div>

                  <div className="grid gap-2">
                    <Label>Megjegyzés</Label>
                    <Input
                      name="notes"
                      placeholder="pl. Csak a próba idejére"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 text-white"
                    disabled={selectedItems.length === 0}
                  >
                    Kiadás Rögzítése ({selectedItems.length} eszköz)
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-slate-100">
          <TabsTrigger value="loans">
            Aktív Kölcsönzések ({activeLoans.length})
          </TabsTrigger>
          <TabsTrigger value="inventory">Eszközlista</TabsTrigger>
          <TabsTrigger value="history">Előzmények</TabsTrigger>
        </TabsList>

        {/* Active Loans Tab */}
        <TabsContent value="loans" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base">Aktív Kölcsönzések</CardTitle>
              {activeLoans.length > 0 && can("equipment", "edit") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        `Biztosan visszaveszel minden eszközt? (${activeLoans.length} kölcsönzés)`,
                      )
                    ) {
                      returnAllLoansMutation.mutate(
                        activeLoans.map((l) => l.id),
                      );
                    }
                  }}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Minden Visszavétele
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Eszközök</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("staff")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Ki vitte el?
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("taken_at")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Mikor?
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("expected_return")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Várható visszavétel
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Megjegyzés</TableHead>
                    <TableHead className="text-right">Művelet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedActiveLoans.map((loan) => {
                    const items = getItemsForLoan(loan.id);
                    const {
                      staffName,
                      isExternal: ext,
                      notes,
                    } = getLoanTakenBy(loan);
                    return (
                      <TableRow
                        key={loan.id}
                        id={
                          loan.id === currentLoanId ? "current-loan" : undefined
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2"
                              >
                                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <span>{getTypeName(item.type)}</span>
                                <span className="text-xs font-mono text-slate-500">
                                  SN: {item.serial}
                                </span>
                              </div>
                            ))}
                            {items.length === 0 && (
                              <span className="text-slate-400 italic">
                                Nincs eszköz
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ext ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500">
                                Külsős:
                              </span>
                              <span>{staffName}</span>
                            </div>
                          ) : (
                            staffName
                          )}
                        </TableCell>
                        <TableCell>
                          {loan.start_date
                            ? formatDateTime(new Date(loan.start_date))
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {loan.expected_return_date ? (
                            <span className="text-sm text-slate-700">
                              {formatDate(new Date(loan.expected_return_date))}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 italic">
                          {notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {can("equipment", "edit") && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="hover:bg-emerald-100 hover:text-emerald-700"
                              onClick={() => returnLoanMutation.mutate(loan.id)}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" /> Visszavétel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {activeLoans.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-slate-400"
                      >
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-100" />
                        Minden eszköz a helyén van.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment List Tab */}
        <TabsContent value="inventory" className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              className="pl-10 max-w-sm"
              placeholder="Keresés név vagy szériaszám alapján..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleEquipmentSort("name")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Megnevezés
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleEquipmentSort("category")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Kategória
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleEquipmentSort("serial")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Szériaszám
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleEquipmentSort("status")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Státusz
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Megjegyzés</TableHead>
                    <TableHead className="text-right">Művelet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.typeName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.typeCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.serial}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status === "selejt" ||
                            item.status === "karbantartas"
                              ? "bg-red-100 text-red-800"
                              : item.loaned
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          }
                        >
                          {item.status === "selejt"
                            ? "Selejt"
                            : item.status === "karbantartas"
                              ? "Karbantartás"
                              : item.loaned
                                ? "Kiadva"
                                : "Elérhető"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {item.notes ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {can("equipment", "edit") && (
                            <Select
                              value={item.status}
                              onValueChange={(v) =>
                                updateItemMutation.mutate({
                                  id: item.id,
                                  data: { status: v as EquipmentStatus },
                                })
                              }
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="elerheto">
                                  Elérhető
                                </SelectItem>
                                <SelectItem value="karbantartas">
                                  Karbantartás
                                </SelectItem>
                                <SelectItem value="selejt">Selejt</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {can("equipment", "delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (confirm("Biztosan törlöd?"))
                                  deleteItemMutation.mutate(item.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedItems.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-slate-400"
                      >
                        Nincs találat az eszközök között.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Equipment Types Management */}
          {can("equipment", "create") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Eszköztípusok</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Megnevezés</TableHead>
                      <TableHead>Kategória</TableHead>
                      <TableHead>Leírás</TableHead>
                      <TableHead>Darabszám</TableHead>
                      <TableHead className="text-right">Művelet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentTypes.map((type) => {
                      const itemCount = equipmentItems.filter(
                        (i) => i.type === type.id,
                      ).length;
                      return (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">
                            {type.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {type.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {type.description || "-"}
                          </TableCell>
                          <TableCell>{itemCount} db</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingType(type);
                                  setIsNewTypeOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 text-slate-500" />
                              </Button>
                              {can("equipment", "delete") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Biztosan törlöd ezt a típust? Az összes hozzá tartozó eszköz is törlődik.",
                                      )
                                    )
                                      deleteTypeMutation.mutate(type.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {equipmentTypes.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-slate-400"
                        >
                          Nincs eszköztípus rögzítve.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Kölcsönzési Napló</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Eszközök</TableHead>
                    <TableHead>Ki vitte?</TableHead>
                    <TableHead>Állapot</TableHead>
                    <TableHead>Időtartam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...activeLoans, ...historyLoans]
                    .sort(
                      (a, b) =>
                        new Date(b.start_date ?? 0).getTime() -
                        new Date(a.start_date ?? 0).getTime(),
                    )
                    .map((loan) => {
                      const items = getItemsForLoan(loan.id);
                      const { staffName, isExternal: ext } =
                        getLoanTakenBy(loan);
                      return (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">
                            <div className="space-y-1">
                              {items.map((item) => (
                                <div key={item.id}>
                                  <span>{getTypeName(item.type)}</span>
                                  <span className="text-xs font-mono text-slate-500 ml-2">
                                    ({item.serial})
                                  </span>
                                </div>
                              ))}
                              {items.length === 0 && (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                            {loan.status === "aktiv" && (
                              <Badge className="ml-2 bg-amber-100 text-amber-800">
                                Aktív
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {ext ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-500">
                                  Külsős:
                                </span>
                                <span>{staffName}</span>
                              </div>
                            ) : (
                              staffName
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                loan.status === "aktiv"
                                  ? "border-amber-300 text-amber-700"
                                  : "border-emerald-300 text-emerald-700"
                              }
                            >
                              {loan.status === "aktiv" ? "Aktív" : "Lezárt"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="text-slate-700">
                                K:{" "}
                                {loan.start_date
                                  ? formatDateTime(new Date(loan.start_date))
                                  : "-"}
                              </span>
                              {loan.return_date && (
                                <span className="text-emerald-600">
                                  V:{" "}
                                  {formatDateTime(new Date(loan.return_date))}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {loans.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-slate-400"
                      >
                        Még nincsenek előzmények.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
