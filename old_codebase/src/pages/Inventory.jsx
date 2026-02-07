import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/usePermissions';
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
  ArrowUpDown
} from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parse } from 'date-fns';
import { hu } from 'date-fns/locale';

export default function Inventory() {
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("loans");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [isExternal, setIsExternal] = useState(false);
  const [externalName, setExternalName] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [equipmentSortField, setEquipmentSortField] = useState(null);
  const [equipmentSortDirection, setEquipmentSortDirection] = useState('asc');
  const queryClient = useQueryClient();

  // Queries
  const { data: equipments } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list(),
    initialData: []
  });

  const { data: loans } = useQuery({
    queryKey: ['equipment-loans'],
    queryFn: () => base44.entities.EquipmentLoan.list('-taken_at'),
    initialData: []
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: []
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list('-date', 10),
    initialData: []
  });

  // Mutations
  const createEquipmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      setIsNewItemOpen(false);
      setEditingItem(null);
    }
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: ({id, data}) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      setIsNewItemOpen(false);
      setEditingItem(null);
    }
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['equipments'])
  });

  const createLoanMutation = useMutation({
    mutationFn: async (loans) => {
      // Create multiple loan records at once
      for (const loan of loans) {
        await base44.entities.EquipmentLoan.create(loan);
        await base44.entities.Equipment.update(loan.equipment_id, { status: 'kiosztva' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      queryClient.invalidateQueries(['equipment-loans']);
      setIsLoanOpen(false);
      setSelectedEquipments([]);
    }
  });

  const returnLoanMutation = useMutation({
    mutationFn: async (loan) => {
      // 1. Update loan record
      await base44.entities.EquipmentLoan.update(loan.id, { 
        status: 'lezart',
        returned_at: new Date().toISOString()
      });
      // 2. Update equipment status
      await base44.entities.Equipment.update(loan.equipment_id, { status: 'elerheto' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      queryClient.invalidateQueries(['equipment-loans']);
    }
  });

  const returnAllLoansMutation = useMutation({
    mutationFn: async (loans) => {
      for (const loan of loans) {
        await base44.entities.EquipmentLoan.update(loan.id, { 
          status: 'lezart',
          returned_at: new Date().toISOString()
        });
        await base44.entities.Equipment.update(loan.equipment_id, { status: 'elerheto' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      queryClient.invalidateQueries(['equipment-loans']);
    }
  });

  // Handlers
  const handleCreateItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serialsText = formData.get('serial_numbers');
    const serials = serialsText ? serialsText.split('\n').map(s => s.trim()).filter(s => s !== '') : [];
    
    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      quantity: serials.length > 0 ? serials.length : parseInt(formData.get('quantity') || '1'),
      serial_numbers: serials,
      status: editingItem ? formData.get('status') : 'elerheto',
      description: formData.get('description')
    };

    if (editingItem) {
        updateEquipmentMutation.mutate({ id: editingItem.id, data });
    } else {
        createEquipmentMutation.mutate(data);
    }
  };

  const formatDateInput = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleCreateLoan = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const staffId = formData.get('staff_id');
    const staff = staffList.find(s => s.id === staffId);
    const programId = formData.get('program_id');
    const notes = formData.get('notes');
    const externalNameValue = formData.get('external_name');

    const expectedReturn = formData.get('expected_return_date');
    const expectedReturnFormatted = expectedReturn && expectedReturn.includes('/') 
      ? format(parse(expectedReturn, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd')
      : expectedReturn;

    const loans = selectedEquipments.map(sel => {
      const equipment = equipments.find(e => e.id === sel.equipmentId);
      return {
        equipment_id: sel.equipmentId,
        equipment_name: equipment?.name,
        staff_id: staffId === 'external' ? 'external' : staffId,
        staff_name: staffId === 'external' ? externalNameValue : staff?.name,
        taken_at: new Date().toISOString(),
        expected_return_date: expectedReturnFormatted ? new Date(expectedReturnFormatted).toISOString() : null,
        status: 'aktiv',
        program_id: programId === 'none' ? null : programId,
        serial_number: sel.serialNumber || null,
        notes: notes
      };
    });

    createLoanMutation.mutate(loans);
  };

  const handleEquipmentSort = (field) => {
    if (equipmentSortField === field) {
      setEquipmentSortDirection(equipmentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setEquipmentSortField(field);
      setEquipmentSortDirection('asc');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortLoans = (loansToSort) => {
    if (!sortField) return loansToSort;

    return [...loansToSort].sort((a, b) => {
      let compareResult = 0;

      if (sortField === 'equipment') {
        compareResult = (a.equipment_name || '').localeCompare(b.equipment_name || '');
        if (compareResult === 0 && a.serial_number && b.serial_number) {
          const aNum = parseInt(a.serial_number.match(/\d+/)?.[0] || '0');
          const bNum = parseInt(b.serial_number.match(/\d+/)?.[0] || '0');
          compareResult = aNum - bNum;
        }
      } else if (sortField === 'staff') {
        compareResult = (a.staff_name || '').localeCompare(b.staff_name || '');
      } else if (sortField === 'taken_at') {
        compareResult = new Date(a.taken_at || 0) - new Date(b.taken_at || 0);
      } else if (sortField === 'expected_return') {
        const aDate = a.expected_return_date ? new Date(a.expected_return_date) : new Date('9999-12-31');
        const bDate = b.expected_return_date ? new Date(b.expected_return_date) : new Date('9999-12-31');
        compareResult = aDate - bDate;
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  };

  const activeLoans = sortLoans(loans.filter(l => l.status === 'aktiv'));
  const historyLoans = loans.filter(l => l.status === 'lezart');

  // Helper to get active loans count for an item
  const getActiveLoanCount = (itemId) => activeLoans.filter(l => l.equipment_id === itemId).length;

  const sortEquipments = (equipmentsToSort) => {
    if (!equipmentSortField) return equipmentsToSort;

    return [...equipmentsToSort].sort((a, b) => {
      let compareResult = 0;

      if (equipmentSortField === 'name') {
        compareResult = (a.name || '').localeCompare(b.name || '');
      } else if (equipmentSortField === 'category') {
        const categoryOrder = { 'hangtechnika': 1, 'fenytechnika': 2, 'stage': 3, 'egyeb': 4 };
        const aOrder = categoryOrder[a.category] || 999;
        const bOrder = categoryOrder[b.category] || 999;
        compareResult = aOrder - bOrder;
      } else if (equipmentSortField === 'status') {
        const statusOrder = { 'elerheto': 1, 'kiosztva': 2, 'selejt': 3, 'karbantartas': 4 };
        const loaned_a = getActiveLoanCount(a.id);
        const available_a = (a.quantity || 1) - loaned_a;
        const loaned_b = getActiveLoanCount(b.id);
        const available_b = (b.quantity || 1) - loaned_b;
        
        let aStatus = a.status === 'selejt' || a.status === 'karbantartas' ? a.status : (available_a > 0 ? 'elerheto' : 'kiosztva');
        let bStatus = b.status === 'selejt' || b.status === 'karbantartas' ? b.status : (available_b > 0 ? 'elerheto' : 'kiosztva');
        
        const aOrder = statusOrder[aStatus] || 999;
        const bOrder = statusOrder[bStatus] || 999;
        compareResult = aOrder - bOrder;
      }

      return equipmentSortDirection === 'asc' ? compareResult : -compareResult;
    });
  };

  const filteredEquipments = sortEquipments(equipments.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  // Component for selecting serial number dynamically
  const LoanSerialSelector = ({ equipments, activeLoans }) => {
     const [selectedEqId, setSelectedEqId] = useState(null);
     
     // Find parent select change - we need to hook into the parent's select. 
     // Actually, let's just make the parent select controlled for this purpose.
     // Since we can't easily reach up, we will have to refactor the main component to store selectedLoanEquipmentId.
     return null; 
  };
  
  const [selectedLoanEquipmentId, setSelectedLoanEquipmentId] = useState(null);

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
        <div className="flex gap-2">
          {can('equipment', 'create') && (
          <Dialog open={isNewItemOpen} onOpenChange={(open) => {
              setIsNewItemOpen(open);
              if(!open) setEditingItem(null);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Új Eszköz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Eszköz Szerkesztése' : 'Új Eszköz Felvétele'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label>Megnevezés</Label>
                  <Input name="name" defaultValue={editingItem?.name} required placeholder="pl. Shure SM58" />
                </div>
                <div className="grid gap-2">
                  <Label>Mennyiség</Label>
                  <Input type="number" name="quantity" defaultValue={editingItem?.quantity || "1"} min="1" required />
                </div>
                <div className="grid gap-2">
                  <Label>Kategória</Label>
                  <Select name="category" defaultValue={editingItem?.category || "hangtechnika"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hangtechnika">Hangtechnika</SelectItem>
                      <SelectItem value="fenytechnika">Fénytechnika</SelectItem>
                      <SelectItem value="stage">Stage</SelectItem>
                      <SelectItem value="egyeb">Egyéb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingItem && (
                <div className="grid gap-2">
                  <Label>Állapot</Label>
                  <Select name="status" defaultValue={editingItem?.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elerheto">Elérhető</SelectItem>
                      <SelectItem value="selejt">Selejt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                )}
                <div className="grid gap-2">
                  <Label>Szériaszámok (Soronként egy)</Label>
                  <Textarea 
                    name="serial_numbers" 
                    defaultValue={editingItem?.serial_numbers?.join('\n')} 
                    placeholder="ABC-123&#10;ABC-124"
                    className="font-mono text-sm"
                  />
                  <p className="text-[10px] text-slate-400">Ha megadsz szériaszámokat, a mennyiség automatikusan frissül.</p>
                </div>
                <div className="grid gap-2">
                  <Label>Leírás</Label>
                  <Input name="description" defaultValue={editingItem?.description} />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 text-white">Mentés</Button>
              </form>
            </DialogContent>
          </Dialog>
          )}

          {can('equipment', 'edit') && (
          <Dialog open={isLoanOpen} onOpenChange={(open) => {
            setIsLoanOpen(open);
            if (!open) {
              setSelectedEquipments([]);
              setIsExternal(false);
              setExternalName("");
            }
          }}>
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
                <div className="grid gap-2">
                  <Label>Kiválasztott eszközök ({selectedEquipments.length})</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-slate-50 space-y-2">
                    {selectedEquipments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-2">Még nincs kiválasztott eszköz</p>
                    ) : (
                      selectedEquipments.map((sel, idx) => {
                        const eq = equipments.find(e => e.id === sel.equipmentId);
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <span className="font-medium text-sm">{eq?.name}</span>
                              {sel.serialNumber && <span className="text-xs text-slate-500 ml-2">({sel.serialNumber})</span>}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEquipments(prev => prev.filter((_, i) => i !== idx))}
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

                <div className="grid gap-2">
                  <Label>
                    Eszköz hozzáadása 
                    {selectedEquipments.length > 0 && <span className="text-slate-400 text-xs ml-2">(opcionális)</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      value="" 
                      onValueChange={(eqId) => {
                        const eq = equipments.find(e => e.id === eqId);
                        if (!eq) return;

                        const loanedSerials = activeLoans
                          .filter(l => l.equipment_id === eqId && l.serial_number)
                          .map(l => l.serial_number);
                        const availableSerials = (eq.serial_numbers || []).filter(sn => !loanedSerials.includes(sn));

                        if (availableSerials.length > 0) {
                          setSelectedLoanEquipmentId(eqId);
                        } else {
                          setSelectedEquipments(prev => [...prev, { equipmentId: eqId, serialNumber: null }]);
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Válassz eszközt..." /></SelectTrigger>
                      <SelectContent>
                        {equipments.filter(e => {
                          const loaned = getActiveLoanCount(e.id);
                          const total = e.quantity || 1;
                          const alreadySelected = selectedEquipments.filter(s => s.equipmentId === e.id).length;
                          return (total - loaned - alreadySelected) > 0 && e.status !== 'selejt' && e.status !== 'karbantartas';
                        }).map(e => {
                          const loaned = getActiveLoanCount(e.id);
                          const alreadySelected = selectedEquipments.filter(s => s.equipmentId === e.id).length;
                          const available = e.quantity - loaned - alreadySelected;
                          return (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name} ({available} db elérhető)
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedLoanEquipmentId && (() => {
                  const eq = equipments.find(e => e.id === selectedLoanEquipmentId);
                  if (!eq || !eq.serial_numbers || eq.serial_numbers.length === 0) return null;

                  const loanedSerials = activeLoans
                    .filter(l => l.equipment_id === selectedLoanEquipmentId && l.serial_number)
                    .map(l => l.serial_number);
                  const selectedSerials = selectedEquipments
                    .filter(s => s.equipmentId === selectedLoanEquipmentId)
                    .map(s => s.serialNumber);
                  const availableSerials = eq.serial_numbers.filter(sn => !loanedSerials.includes(sn) && !selectedSerials.includes(sn));

                  if (availableSerials.length === 0) return null;

                  return (
                    <div className="grid gap-2 animate-in fade-in">
                      <Label>Válassz szériaszámot: {eq.name}</Label>
                      <Select 
                        onValueChange={(sn) => {
                          setSelectedEquipments(prev => [...prev, { equipmentId: selectedLoanEquipmentId, serialNumber: sn }]);
                          setSelectedLoanEquipmentId(null);
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Válassz szériaszámot..." /></SelectTrigger>
                        <SelectContent>
                          {availableSerials.map(sn => (
                            <SelectItem key={sn} value={sn}>{sn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}
                
                <div className="grid gap-2">
                  <Label>Ki viszi el? <span className="text-red-500">*</span></Label>
                  <Select 
                    name="staff_id" 
                    required 
                    onValueChange={(value) => setIsExternal(value === 'external')}
                  >
                    <SelectTrigger><SelectValue placeholder="Válassz személyt" /></SelectTrigger>
                    <SelectContent>
                      {staffList.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                      <SelectItem value="external">Külsős</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Kötelező mező</p>
                </div>
                {isExternal && (
                  <div className="grid gap-2 animate-in fade-in">
                    <Label>Külsős neve <span className="text-red-500">*</span></Label>
                    <Input 
                      name="external_name" 
                      value={externalName}
                      onChange={(e) => setExternalName(e.target.value)}
                      placeholder="pl. Kovács János"
                      required
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Melyik programhoz? (Opcionális)</Label>
                  <Select name="program_id">
                    <SelectTrigger><SelectValue placeholder="Válassz programot" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nincs programhoz kötve</SelectItem>
                      {programs.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Várható visszavétel (Opcionális)</Label>
                  <Input 
                    type="text" 
                    name="expected_return_date" 
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    onChange={(e) => {
                      const formatted = formatDateInput(e.target.value);
                      e.target.value = formatted;
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Megjegyzés</Label>
                  <Input name="notes" placeholder="pl. Csak a próba idejére" />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 text-white" disabled={selectedEquipments.length === 0}>
                  Kiadás Rögzítése ({selectedEquipments.length} eszköz)
                </Button>
                </form>
                </DialogContent>
                </Dialog>
                )}
          )}
                </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-slate-100">
          <TabsTrigger value="loans">Aktív Kölcsönzések ({activeLoans.length})</TabsTrigger>
          <TabsTrigger value="inventory">Eszközlista</TabsTrigger>
          <TabsTrigger value="history">Előzmények</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base">Aktív Kölcsönzések</CardTitle>
              {activeLoans.length > 0 && can('equipment', 'edit') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (confirm(`Biztosan visszaveszel minden eszközt? (${activeLoans.length} db)`)) {
                      returnAllLoansMutation.mutate(activeLoans);
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
                    <TableHead>
                      <button 
                        onClick={() => handleSort('equipment')} 
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Eszköz
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleSort('staff')} 
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Ki vitte el?
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleSort('taken_at')} 
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Mikor?
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleSort('expected_return')} 
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
                  {activeLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            {loan.equipment_name}
                          </div>
                          {loan.serial_number && (
                            <span className="text-xs font-mono text-slate-500 ml-6">SN: {loan.serial_number}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {loan.staff_id === 'external' ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Külsős:</span>
                            <span>{loan.staff_name}</span>
                          </div>
                        ) : (
                          loan.staff_name
                        )}
                      </TableCell>
                      <TableCell>{loan.taken_at ? format(new Date(loan.taken_at), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                      <TableCell>
                        {loan.expected_return_date ? (
                          <span className="text-sm text-slate-700">
                            {format(new Date(loan.expected_return_date), 'dd/MM/yyyy')}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 italic">{loan.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        {can('equipment', 'edit') && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="hover:bg-emerald-100 hover:text-emerald-700"
                          onClick={() => returnLoanMutation.mutate(loan)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" /> Visszavétel
                        </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeLoans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400">
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
                        onClick={() => handleEquipmentSort('name')} 
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Megnevezés
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleEquipmentSort('category')} 
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Kategória
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Szériaszám</TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleEquipmentSort('status')} 
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Státusz
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Leírás</TableHead>
                    <TableHead className="text-right">Művelet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.serial_numbers && item.serial_numbers.length > 0 
                          ? item.serial_numbers.length === 1 
                            ? item.serial_numbers[0]
                            : <span title={item.serial_numbers.join(', ')}>{item.serial_numbers.length} db SN</span> 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const loaned = getActiveLoanCount(item.id);
                          const total = item.quantity || 1;
                          const available = total - loaned;
                          const isAvailable = available > 0;
                          
                          return (
                            <Badge className={
                              item.status === 'selejt' || item.status === 'karbantartas' ? 'bg-red-100 text-red-800' :
                              isAvailable ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                              'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }>
                              {item.status === 'selejt' ? 'Selejt' :
                               item.status === 'karbantartas' ? 'Karbantartás' :
                               isAvailable ? `Elérhető (${available}/${total})` : 
                               `Kiosztva (${total}/${total})`}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-slate-500">{item.description}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-1">
                            {can('equipment', 'create') && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setEditingItem(item);
                                setIsNewItemOpen(true);
                            }}>
                                <Edit className="w-4 h-4 text-slate-500" />
                            </Button>
                            )}
                            {can('equipment', 'delete') && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                if(confirm('Biztosan törlöd?')) deleteEquipmentMutation.mutate(item.id);
                            }}>
                                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                            </Button>
                            )}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEquipments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                        Nincs találat az eszközök között.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
               <CardTitle>Kölcsönzési Napló</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Eszköz</TableHead>
                    <TableHead>Ki vitte?</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Időtartam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...activeLoans, ...historyLoans].sort((a,b) => new Date(b.taken_at) - new Date(a.taken_at)).map((loan) => {
                    const program = programs.find(p => p.id === loan.program_id);
                    return (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">
                        {loan.equipment_name}
                        {loan.serial_number && <span className="text-xs font-mono text-slate-500 ml-2">({loan.serial_number})</span>}
                        {loan.status === 'aktiv' && <Badge className="ml-2 bg-amber-100 text-amber-800">Aktív</Badge>}
                      </TableCell>
                      <TableCell>
                        {loan.staff_id === 'external' ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Külsős:</span>
                            <span>{loan.staff_name}</span>
                          </div>
                        ) : (
                          loan.staff_name
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {program ? program.title : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="text-slate-700">K: {loan.taken_at ? format(new Date(loan.taken_at), 'dd/MM/yyyy HH:mm') : '-'}</span>
                          {loan.returned_at && <span className="text-emerald-600">V: {format(new Date(loan.returned_at), 'dd/MM/yyyy HH:mm')}</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                  {loans.length === 0 && (
                     <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-400">
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