import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/usePermissions';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parse } from 'date-fns';
import { hu } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Save, 
  Plus, 
  Trash2,
  Users,
  ListMusic,
  LayoutList,
  MoreHorizontal,
  Mic2,
  Lightbulb,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  Package,
  ClipboardList,
  Edit,
  FileText,
  Upload,
  Download,
  MessageCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import PDFViewer from "@/components/PDFViewer";
import DocumentViewer from "@/components/DocumentViewer";
import ProgramChat from "@/components/ProgramChat";

export default function ProgramDetails() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("overview");
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [newTaskType, setNewTaskType] = useState(null); // 'sound' or 'light'
  const [viewingPDF, setViewingPDF] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [editingRehearsal, setEditingRehearsal] = useState(null);
  const [isRehearsalDialogOpen, setIsRehearsalDialogOpen] = useState(false);

  const formatDateInput = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  // Queries
  const { data: program, isLoading, error } = useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      if (!id) return null;
      return await base44.entities.Program.get(id);
    },
    enabled: !!id,
    retry: 1,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: helpers } = useQuery({
    queryKey: ['program-helpers', id],
    queryFn: () => base44.entities.ProgramHelper.filter({ program_id: id }),
    enabled: !!id && (activeTab === 'overview' || activeTab === 'staff'),
    initialData: [],
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: [],
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: equipments } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list(),
    enabled: activeTab === 'equipment' || activeTab === 'overview',
    initialData: [],
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: programs } = useQuery({
    queryKey: ['all-programs'],
    queryFn: () => base44.entities.Program.list(),
    enabled: activeTab === 'equipment',
    initialData: [],
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: soundTasks } = useQuery({
    queryKey: ['sound-tasks', id],
    queryFn: () => base44.entities.SoundTask.filter({ program_id: id }),
    enabled: !!id && (activeTab === 'tasks' || activeTab === 'overview'),
    initialData: [],
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: lightTasks } = useQuery({
    queryKey: ['light-tasks', id],
    queryFn: () => base44.entities.LightTask.filter({ program_id: id }),
    enabled: !!id && (activeTab === 'tasks' || activeTab === 'overview'),
    initialData: [],
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: programFiles } = useQuery({
    queryKey: ['program-files', id],
    queryFn: () => base44.entities.ProgramFile.filter({ program_id: id }),
    enabled: !!id && activeTab === 'files',
    initialData: [],
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: rehearsals } = useQuery({
    queryKey: ['rehearsals', id],
    queryFn: () => base44.entities.Rehearsal.filter({ program_id: id }),
    enabled: !!id && (activeTab === 'rehearsals' || activeTab === 'timeline' || activeTab === 'overview'),
    initialData: [],
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  // Mutations
  const updateProgramMutation = useMutation({
    mutationFn: (data) => base44.entities.Program.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['program', id]);
    }
  });

  const addHelperMutation = useMutation({
    mutationFn: (data) => base44.entities.ProgramHelper.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['program-helpers', id]);
      setIsHelperOpen(false);
    }
  });

  const removeHelperMutation = useMutation({
    mutationFn: (helperId) => base44.entities.ProgramHelper.delete(helperId),
    onSuccess: () => queryClient.invalidateQueries(['program-helpers', id])
  });

  const createSoundTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.SoundTask.create({ ...data, program_id: id, status: 'teendo' }),
    onSuccess: () => {
       queryClient.invalidateQueries(['sound-tasks', id]);
       setNewTaskType(null);
    }
  });

  const createLightTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.LightTask.create({ ...data, program_id: id, status: 'teendo' }),
    onSuccess: () => {
       queryClient.invalidateQueries(['light-tasks', id]);
       setNewTaskType(null);
    }
  });

  const updateSoundTaskMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.SoundTask.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(['sound-tasks', id])
  });

  const updateLightTaskMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.LightTask.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(['light-tasks', id])
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, description }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return await base44.entities.ProgramFile.create({
        program_id: id,
        file_name: file.name,
        file_url: file_url,
        file_type: file.type,
        description: description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['program-files', id]);
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId) => base44.entities.ProgramFile.delete(fileId),
    onSuccess: () => queryClient.invalidateQueries(['program-files', id])
  });

  const createRehearsalMutation = useMutation({
    mutationFn: (data) => base44.entities.Rehearsal.create({ ...data, program_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['rehearsals', id]);
      setIsRehearsalDialogOpen(false);
      setEditingRehearsal(null);
    },
    onError: (error) => console.error('Próba létrehozási hiba:', error)
  });

  const updateRehearsalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rehearsal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rehearsals', id]);
      setIsRehearsalDialogOpen(false);
      setEditingRehearsal(null);
    },
    onError: (error) => console.error('Próba frissítési hiba:', error)
  });

  const deleteRehearsalMutation = useMutation({
    mutationFn: (rehearsalId) => base44.entities.Rehearsal.delete(rehearsalId),
    onSuccess: () => queryClient.invalidateQueries(['rehearsals', id]),
    onError: (error) => console.error('Próba törlési hiba:', error)
  });

  const [fohList, setFohList] = useState('');
  const [stageList, setStageList] = useState('');
  const [otherList, setOtherList] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState({});
  const [pendingEquipmentSelection, setPendingEquipmentSelection] = useState(null);

  useEffect(() => {
    if (program) {
      setFohList(program.foh_list || '');
      setStageList(program.stage_list || '');
      setOtherList(program.other_list || '');
    }
  }, [program]);

  const handleSaveLists = () => {
    updateProgramMutation.mutate({
      foh_list: fohList,
      stage_list: stageList,
      other_list: otherList
    });
  };

  const handleEquipmentToggle = (type, eqId) => {
      const eq = equipments.find(e => e.id === eqId);

      // Mindig hozzáadás (új példány)
      if (eq?.serial_numbers && eq.serial_numbers.length > 0) {
          setPendingEquipmentSelection({ type, eqId });
      } else {
          // Nincs szériaszám, egyszerűen hozzáadjuk
          const currentIds = program[`${type}_equipment_ids`] || [];
          const newIds = [...currentIds, eqId];
          updateProgramMutation.mutate({
              [`${type}_equipment_ids`]: newIds
          });
      }
  };

  const handleRemoveEquipment = (type, index) => {
      const currentIds = program[`${type}_equipment_ids`] || [];
      const currentSerials = program[`${type}_equipment_serials`] || {};

      const newIds = currentIds.filter((_, i) => i !== index);
      const newSerials = { ...currentSerials };
      delete newSerials[index.toString()];

      // Re-index serials
      const reindexedSerials = {};
      newIds.forEach((id, i) => {
          const oldSerial = currentSerials[(i < index ? i : i + 1).toString()];
          if (oldSerial) {
              reindexedSerials[i.toString()] = oldSerial;
          }
      });

      updateProgramMutation.mutate({
          [`${type}_equipment_ids`]: newIds,
          [`${type}_equipment_serials`]: reindexedSerials
      });
  };

  const handleSerialSelection = (serial) => {
      if (!pendingEquipmentSelection) return;

      const { type, eqId } = pendingEquipmentSelection;
      const currentIds = program[`${type}_equipment_ids`] || [];
      const newIndex = currentIds.length;
      const newIds = [...currentIds, eqId];
      const currentSerials = program[`${type}_equipment_serials`] || {};
      const newSerials = { ...currentSerials, [newIndex.toString()]: serial };

      updateProgramMutation.mutate({
          [`${type}_equipment_ids`]: newIds,
          [`${type}_equipment_serials`]: newSerials
      });

      setPendingEquipmentSelection(null);
  };

  const handleAddHelper = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const staffId = formData.get('staff_id');
    const staff = staffList.find(s => s.id === staffId);
    
    addHelperMutation.mutate({
      program_id: id,
      staff_id: staffId,
      staff_name: staff?.name,
      role: formData.get('role')
    });
  };

  const handleCreateTask = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
          title: formData.get('title'),
          assigned_to: formData.get('assigned_to'),
          priority: formData.get('priority'),
          details: formData.get('details')
      };
      if (newTaskType === 'sound') createSoundTaskMutation.mutate(data);
      if (newTaskType === 'light') createLightTaskMutation.mutate(data);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(true);
      try {
        await uploadFileMutation.mutateAsync({ file, description: fileDescription });
        setFileDescription('');
        e.target.value = '';
      } catch (error) {
        console.error('Hiba a fájl feltöltésekor:', error);
      } finally {
        setUploadingFile(false);
      }
    }
  };

  if (!id) return <div className="p-8 text-center text-slate-500">Nincs program kiválasztva.</div>;
  if (isLoading) return <div className="p-8 text-center">Betöltés...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Hiba történt a betöltés során.</div>;
  if (!program) return <div className="p-8 text-center text-slate-500">A program nem található.</div>;

  const uniqueHelpers = Object.values(helpers.reduce((acc, h) => {
      if (!acc[h.staff_id]) {
          acc[h.staff_id] = { ...h, roles: [h.role] };
      } else {
          acc[h.staff_id].roles.push(h.role);
      }
      return acc;
  }, {}));

  const uniqueStaffCount = new Set([...helpers.map(h => h.staff_id), program.lead_staff_id].filter(Boolean)).size;

  const EquipmentSelector = ({ type, label }) => {
    const assignedHereIds = program[`${type}_equipment_ids`] || [];
    const assignedSerials = program[`${type}_equipment_serials`] || {};

    // Számoljuk össze, hogy programonként hány példány van kiosztva minden eszközből
    const countAssignedAcrossPrograms = (eqId) => {
        let count = 0;
        (programs || []).forEach(prog => {
            const fohCount = (prog.foh_equipment_ids || []).filter(id => id === eqId).length;
            const stageCount = (prog.stage_equipment_ids || []).filter(id => id === eqId).length;
            const otherCount = (prog.other_equipment_ids || []).filter(id => id === eqId).length;
            count += fohCount + stageCount + otherCount;
        });
        return count;
    };

    // Számoljuk meg, hány példányt választottunk ki ebben a programban
    const countAssignedHere = (eqId) => {
        return assignedHereIds.filter(id => id === eqId).length;
    };

    // Kigyűjtjük a már kiválasztott példányokat indexekkel
    const assignedItems = assignedHereIds.map((eqId, index) => {
        const eq = equipments.find(e => e.id === eqId);
        return { eq, index, serial: assignedSerials[index.toString()] };
    }).filter(item => item.eq);

    // Kigyűjtjük az elérhető eszközöket
    const availableEquipments = equipments.filter(eq => {
        const totalQuantity = eq.quantity || 1;
        const assignedCount = countAssignedAcrossPrograms(eq.id);
        const availableCount = totalQuantity - assignedCount;
        return availableCount > 0;
    });

    availableEquipments.sort((a, b) => {
        const aAssigned = countAssignedAcrossPrograms(a.id);
        const bAssigned = countAssignedAcrossPrograms(b.id);
        const aAvailable = (a.quantity || 1) - aAssigned;
        const bAvailable = (b.quantity || 1) - bAssigned;
        if (aAvailable !== bAvailable) return bAvailable - aAvailable;
        return 0;
    });

    return (
      <div className="border rounded-md h-64 overflow-hidden flex flex-col bg-slate-50 relative">
        <div className="p-3 bg-slate-100 border-b font-bold text-xs uppercase tracking-wider text-slate-600 shrink-0 z-10 shadow-sm">
            {label}
        </div>
        <div className="overflow-y-auto p-3 space-y-3 flex-1">
            {/* Elérhető eszközök */}
            <div className="space-y-2">
                {availableEquipments.map(eq => {
                    const totalQuantity = eq.quantity || 1;
                    const assignedCount = countAssignedAcrossPrograms(eq.id);
                    const availableCount = totalQuantity - assignedCount;

                    return (
                    <button
                        key={eq.id}
                        type="button"
                        onClick={() => handleEquipmentToggle(type, eq.id)}
                        className="w-full flex items-center justify-between p-2 border rounded transition-all bg-white hover:shadow-sm hover:border-indigo-300 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <Plus className="w-4 h-4 text-indigo-500" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-700">{eq.name}</span>
                                <span className="text-[10px] text-emerald-600">Elérhető: {availableCount} db</span>
                            </div>
                        </div>
                    </button>
                    )
                })}
                {availableEquipments.length === 0 && assignedItems.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">Nincs elérhető eszköz</p>
                )}
            </div>

            {/* Kiválasztott eszközök */}
            {assignedItems.length > 0 && (
                <>
                    <div className="border-t pt-2">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Kiválasztva</p>
                    </div>
                    <div className="space-y-2">
                        {assignedItems.map((item) => (
                            <div key={item.index} className="flex items-center justify-between p-2 border rounded bg-indigo-50 border-indigo-200">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">{item.eq.name}</span>
                                        {item.serial && <span className="text-[10px] text-indigo-600 font-medium">Szériaszám: {item.serial}</span>}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-400 hover:text-red-600"
                                    onClick={() => handleRemoveEquipment(type, item.index)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Programs')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{program.title}</h1>
          <div className="flex items-center gap-4 text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {program.date ? format(new Date(program.date), 'dd/MM/yyyy') : '-'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {program.location}
            </span>
            <Badge variant="secondary">{program.status === 'varakozo' ? 'Várakozó' : program.status}</Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-slate-100">
            <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Áttekintés</TabsTrigger>
            <TabsTrigger value="equipment" className="gap-2"><Package className="w-4 h-4" /> Eszközök</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2"><ClipboardList className="w-4 h-4" /> Technikai Feladatok</TabsTrigger>
            <TabsTrigger value="staff" className="gap-2"><Users className="w-4 h-4" /> Stáb</TabsTrigger>
            <TabsTrigger value="files" className="gap-2"><FileText className="w-4 h-4" /> Fájlok</TabsTrigger>
            <TabsTrigger value="rehearsals" className="gap-2"><Calendar className="w-4 h-4" /> Próbák</TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2"><Calendar className="w-4 h-4" /> Timeline</TabsTrigger>
            <TabsTrigger value="chat" className="gap-2"><MessageCircle className="w-4 h-4" /> Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Staff Overview */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Stáb & Személyzet</CardTitle>
                        <Users className="w-4 h-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueStaffCount} fő</div>
                        <p className="text-xs text-slate-500 mt-1 mb-4">Lead: {program.lead_staff_name}</p>
                        <div className="space-y-2 mb-4">
                             {uniqueHelpers.slice(0, 3).map(h => (
                                <div key={h.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                      <span>{h.staff_name}</span>
                                   </div>
                                   <span className="text-xs text-slate-500 truncate max-w-[120px] text-right">{h.roles.join(', ')}</span>
                                </div>
                             ))}
                             {uniqueHelpers.length > 3 && <p className="text-xs text-center text-slate-400">...és még {uniqueHelpers.length - 3} fő</p>}
                        </div>
                        {can('programs', 'create') && (
                        <Button className="w-full bg-indigo-600 text-white" size="sm" onClick={() => setIsHelperOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Segítő Hozzáadása
                        </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Tasks Overview */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Feladatok Állapota</CardTitle>
                        <ClipboardList className="w-4 h-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-indigo-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-indigo-600">{soundTasks.filter(t => t.status !== 'kesz').length}</div>
                                <div className="text-xs text-indigo-800 font-medium">Nyitott Hang</div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-amber-600">{lightTasks.filter(t => t.status !== 'kesz').length}</div>
                                <div className="text-xs text-amber-800 font-medium">Nyitott Fény</div>
                            </div>
                        </div>
                        {can('tasks', 'create') && (
                        <div className="space-y-2">
                           <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setNewTaskType('sound')}>
                               <Mic2 className="w-4 h-4 mr-2 text-indigo-500" /> Új Hangosítási Feladat
                           </Button>
                           <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setNewTaskType('light')}>
                               <Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Új Fénytechnikai Feladat
                           </Button>
                        </div>
                        )}
                    </CardContent>
                </Card>

                {/* Equipment Overview */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Eszközigény</CardTitle>
                        <Package className="w-4 h-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                             <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-sm text-slate-600">FOH Eszközök</span>
                                <Badge variant="secondary">{(program.foh_equipment_ids || []).length} db</Badge>
                             </div>
                             <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-sm text-slate-600">Stage Eszközök</span>
                                <Badge variant="secondary">{(program.stage_equipment_ids || []).length} db</Badge>
                             </div>
                             <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-sm text-slate-600">Egyéb Eszközök</span>
                                <Badge variant="secondary">{(program.other_equipment_ids || []).length} db</Badge>
                             </div>
                             <Button className="w-full" variant="secondary" size="sm" onClick={() => setActiveTab('equipment')}>
                                Eszközlista Kezelése
                             </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline Overview */}
                <Card className="hover:shadow-md transition-shadow md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Legutóbbi Események</CardTitle>
                        <Calendar className="w-4 h-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {[
                                { type: 'program_date', date: program.date, data: program },
                                ...rehearsals.map(r => ({ type: 'rehearsal', date: r.date, data: r }))
                            ]
                            .filter(e => e.date)
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .slice(0, 5)
                            .map((event, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-slate-50 rounded">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"></div>
                                    <div className="flex-1">
                                        {event.type === 'program_date' && <span>🎬 Program: {event.data.title}</span>}
                                        {event.type === 'rehearsal' && (
                                            <span>
                                                🎭 Próba{event.data.notes && `: ${event.data.notes}`}
                                                {event.data.lesson_period && (
                                                    <Badge variant="outline" className="ml-2 text-[10px] py-0">
                                                        {event.data.lesson_period}
                                                    </Badge>
                                                )}
                                            </span>
                                        )}
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {event.type === 'program_date' ? (event.data.time ? `${format(new Date(event.date), 'dd/MM/yyyy')} ${event.data.time}` : format(new Date(event.date), 'dd/MM/yyyy HH:mm')) : (event.date ? format(new Date(event.date), 'dd/MM/yyyy HH:mm') : '-')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!program.date && rehearsals.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">Még nincsenek próbák.</p>
                            )}
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setActiveTab('timeline')}>
                            Teljes Timeline Megtekintése
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="equipment" className="mt-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-lg">Hozzárendelt Eszközök</CardTitle>
                    {can('programs', 'create') && (
                    <Button onClick={() => setIsEquipmentDialogOpen(true)} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" /> Szerkesztés / Hozzáadás
                    </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { id: 'foh', label: 'FOH Eszközök', ids: program.foh_equipment_ids },
                            { id: 'stage', label: 'Stage Eszközök', ids: program.stage_equipment_ids },
                            { id: 'other', label: 'Egyéb Eszközök', ids: program.other_equipment_ids }
                        ].map(group => (
                            <div key={group.id} className="space-y-2">
                                <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">{group.label}</h3>
                                <div className="bg-slate-50 rounded-lg p-3 min-h-[100px]">
                                    {(group.ids || []).length > 0 ? (
                                        <ul className="space-y-1">
                                            {group.ids.map(eqId => {
                                                const eq = equipments.find(e => e.id === eqId);
                                                const serialKey = `${group.id}_equipment_serials`;
                                                const serial = program[serialKey]?.[eqId];
                                                return (
                                                    <li key={eqId} className="text-sm flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                        <div>
                                                            {eq ? eq.name : 'Ismeretlen eszköz'}
                                                            {serial && <span className="text-xs text-indigo-600 ml-2">({serial})</span>}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Nincs eszköz hozzárendelve.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Eszközök Hozzárendelése</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <EquipmentSelector type="foh" label="FOH Eszközök" />
                        <EquipmentSelector type="stage" label="Stage Eszközök" />
                        <EquipmentSelector type="other" label="Egyéb Eszközök" />
                    </div>
                    {pendingEquipmentSelection && (() => {
                        const eq = equipments.find(e => e.id === pendingEquipmentSelection.eqId);
                        if (!eq || !eq.serial_numbers || eq.serial_numbers.length === 0) return null;

                        // Kigyűjtjük az összes programban használt szériaszámokat ehhez az eszközhöz
                        const usedSerials = new Set();
                        (programs || []).forEach(prog => {
                            ['foh', 'stage', 'other'].forEach(type => {
                                const ids = prog[`${type}_equipment_ids`] || [];
                                const serials = prog[`${type}_equipment_serials`] || {};
                                ids.forEach((id, idx) => {
                                    if (id === eq.id && serials[idx.toString()]) {
                                        usedSerials.add(serials[idx.toString()]);
                                    }
                                });
                            });
                        });

                        const availableSerials = eq.serial_numbers.filter(s => !usedSerials.has(s));

                        return (
                            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg animate-in fade-in">
                                <h4 className="font-medium text-sm mb-3">Válassz szériaszámot: {eq.name}</h4>
                                <div className="grid gap-2">
                                    {availableSerials.map(serial => (
                                        <Button
                                            key={serial}
                                            variant="outline"
                                            className="justify-start hover:bg-indigo-100"
                                            onClick={() => handleSerialSelection(serial)}
                                        >
                                            {serial}
                                        </Button>
                                    ))}
                                    {availableSerials.length === 0 && (
                                        <p className="text-xs text-slate-500 italic text-center py-2">
                                            Minden szériaszám ki van osztva
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 w-full"
                                    onClick={() => setPendingEquipmentSelection(null)}
                                >
                                    Mégse
                                </Button>
                            </div>
                        );
                    })()}

                    <div className="flex justify-end mt-4">
                        <Button onClick={() => {
                            setIsEquipmentDialogOpen(false);
                            setPendingEquipmentSelection(null);
                        }}>Kész</Button>
                    </div>
                    </DialogContent>
                    </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <ListMusic className="w-4 h-4 text-indigo-600" /> FOH Lista (Szöveges)
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Textarea 
                        className="min-h-[150px] font-mono text-xs"
                        value={fohList}
                        onChange={(e) => setFohList(e.target.value)}
                    />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-indigo-600" /> Stage Lista (Szöveges)
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Textarea 
                        className="min-h-[150px] font-mono text-xs"
                        value={stageList}
                        onChange={(e) => setStageList(e.target.value)}
                    />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <MoreHorizontal className="w-4 h-4 text-indigo-600" /> Egyéb Lista (Szöveges)
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Textarea 
                        className="min-h-[150px] font-mono text-xs"
                        value={otherList}
                        onChange={(e) => setOtherList(e.target.value)}
                    />
                    </CardContent>
                </Card>
            </div>
            {can('programs', 'create') && (
            <div className="flex justify-end">
                <Button onClick={handleSaveLists} className="bg-indigo-600 text-white">
                <Save className="w-4 h-4 mr-2" /> Listák Mentése
                </Button>
            </div>
            )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sound Tasks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Mic2 className="w-5 h-5 text-indigo-600" /> Hangtechnikai Feladatok
                        </CardTitle>
                        {can('tasks', 'create') && (
                        <Button size="sm" variant="outline" onClick={() => setNewTaskType('sound')}>
                            <Plus className="w-4 h-4" />
                        </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {soundTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3 cursor-pointer select-none flex-1" onClick={() => updateSoundTaskMutation.mutate({ id: task.id, status: task.status === 'kesz' ? 'teendo' : 'kesz' })}>
                                        {task.status === 'kesz' ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500 flex-shrink-0" />}
                                        <span className={task.status === 'kesz' ? 'line-through text-slate-400' : ''}>{task.title}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs flex items-center gap-1 bg-slate-100">
                                        <User className="w-3 h-3" />
                                        {task.assigned_to || '-'}
                                    </Badge>
                                </div>
                            ))}
                            {soundTasks.length === 0 && <p className="text-xs text-slate-400 italic">Nincs feladat.</p>}
                        </div>
                    </CardContent>
                </Card>

                 {/* Light Tasks */}
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-amber-500" /> Fénytechnikai Feladatok
                        </CardTitle>
                        {can('tasks', 'create') && (
                        <Button size="sm" variant="outline" onClick={() => setNewTaskType('light')}>
                            <Plus className="w-4 h-4" />
                        </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {lightTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3 cursor-pointer select-none flex-1" onClick={() => updateLightTaskMutation.mutate({ id: task.id, status: task.status === 'kesz' ? 'teendo' : 'kesz' })}>
                                        {task.status === 'kesz' ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-amber-500 flex-shrink-0" />}
                                        <span className={task.status === 'kesz' ? 'line-through text-slate-400' : ''}>{task.title}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs flex items-center gap-1 bg-slate-100">
                                        <User className="w-3 h-3" />
                                        {task.assigned_to || '-'}
                                    </Badge>
                                </div>
                            ))}
                            {lightTasks.length === 0 && <p className="text-xs text-slate-400 italic">Nincs feladat.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Stáb
            </CardTitle>
            {can('programs', 'create') && (
            <Dialog open={isHelperOpen} onOpenChange={setIsHelperOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
              </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Segítő Hozzáadása</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddHelper} className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label>Személy</Label>
                      <Select name="staff_id" required>
                        <SelectTrigger><SelectValue placeholder="Válassz..." /></SelectTrigger>
                        <SelectContent>
                          {staffList.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Feladatkör</Label>
                      <Select name="role" required>
                        <SelectTrigger><SelectValue placeholder="Válassz..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Stage">Stage (Színpad)</SelectItem>
                          <SelectItem value="Hangtechnikus">Hangtechnikus</SelectItem>
                          <SelectItem value="Fenytechnikus">Fénytechnikus</SelectItem>
                          <SelectItem value="Fotos">Fotós</SelectItem>
                          <SelectItem value="Videos">Videós</SelectItem>
                          <SelectItem value="Vetito">Vetítő</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 text-white">Hozzáadás</Button>
                  </form>
                </DialogContent>
              </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                       L
                     </div>
                     <div>
                       <p className="text-sm font-medium">{program.lead_staff_name}</p>
                       <p className="text-xs text-slate-500">Lead / Felelős</p>
                     </div>
                   </div>
                </div>
                <Separator />
                {helpers.map(helper => (
                  <div key={helper.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium">{helper.staff_name}</p>
                        <p className="text-xs text-slate-500">{helper.role}</p>
                      </div>
                    </div>
                    {can('programs', 'create') && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                      onClick={() => removeHelperMutation.mutate(helper.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    )}
                  </div>
                ))}
                {helpers.length === 0 && <p className="text-xs text-slate-400 italic text-center">Nincsenek segítők hozzárendelve.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" /> Feltöltött Fájlok
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                  {can('programs', 'create') && (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50">
                      <div className="flex flex-col items-center gap-4">
                          <Upload className="w-12 h-12 text-slate-400" />
                          <div className="text-center">
                              <h3 className="font-medium text-slate-900 mb-1">Fájl feltöltése</h3>
                              <p className="text-sm text-slate-500 mb-4">PDF, Word (.doc, .docx) vagy Excel (.xls, .xlsx) fájl</p>
                          </div>
                          <div className="w-full max-w-md space-y-3">
                              <Input
                                  placeholder="Fájl leírása (opcionális)"
                                  value={fileDescription}
                                  onChange={(e) => setFileDescription(e.target.value)}
                              />
                              <label htmlFor="file-upload" className="block">
                                  <input
                                      id="file-upload"
                                      type="file"
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                      className="hidden"
                                      onChange={handleFileUpload}
                                      disabled={uploadingFile}
                                  />
                                  <Button 
                                      type="button"
                                      className="w-full bg-indigo-600 text-white"
                                      disabled={uploadingFile}
                                      onClick={() => document.getElementById('file-upload')?.click()}
                                  >
                                      {uploadingFile ? 'Feltöltés...' : 'Fájl kiválasztása'}
                                  </Button>
                              </label>
                          </div>
                      </div>
                  </div>
                  )}

                  <div className="space-y-3">
                      {programFiles.length === 0 ? (
                          <div className="text-center py-8 text-slate-400">
                              Még nincs feltöltött fájl ehhez a programhoz.
                          </div>
                      ) : (
                          programFiles.map(file => (
                              <div key={file.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
                                  <div className="flex items-center gap-3 flex-1">
                                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                          <FileText className="w-5 h-5 text-indigo-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-slate-900 truncate">{file.file_name}</h4>
                                          {file.description && (
                                              <p className="text-sm text-slate-500 truncate">{file.description}</p>
                                          )}
                                          <p className="text-xs text-slate-400">
                                             {file.created_date ? format(new Date(file.created_date), 'dd/MM/yyyy HH:mm') : '-'}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      {file.file_type === 'application/pdf' && (
                                          <Button 
                                              variant="default" 
                                              size="sm"
                                              onClick={() => setViewingPDF(file.file_url)}
                                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                          >
                                              <FileText className="w-4 h-4 mr-1" />
                                              Megtekintés
                                          </Button>
                                      )}
                                      {(file.file_type === 'application/msword' || 
                                        file.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                        file.file_type === 'application/vnd.ms-excel' ||
                                        file.file_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') && (
                                          <Button 
                                              variant="default" 
                                              size="sm"
                                              onClick={() => setViewingDocument({ url: file.file_url, name: file.file_name })}
                                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                          >
                                              <FileText className="w-4 h-4 mr-1" />
                                              Megtekintés
                                          </Button>
                                      )}
                                      <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => {
                                              const link = document.createElement('a');
                                              link.href = file.file_url;
                                              link.download = file.file_name;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                          }}
                                      >
                                          <Download className="w-4 h-4" />
                                      </Button>
                                      {can('programs', 'delete') && (
                                      <Button 
                                         variant="ghost" 
                                         size="sm"
                                         className="text-red-400 hover:text-red-600"
                                         onClick={() => {
                                             if (confirm('Biztosan törlöd ezt a fájlt?')) {
                                                 deleteFileMutation.mutate(file.id);
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

        <TabsContent value="rehearsals" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" /> Próbák
                  </CardTitle>
                  {can('programs', 'create') && (
                  <Button size="sm" onClick={() => {
                    setEditingRehearsal(null);
                    setIsRehearsalDialogOpen(true);
                  }}>
                      <Plus className="w-4 h-4 mr-2" /> Új Próba
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
                          rehearsals.sort((a, b) => new Date(a.date) - new Date(b.date)).map(rehearsal => (
                              <div key={rehearsal.id} className="flex items-start justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                          <Calendar className="w-4 h-4 text-indigo-600" />
                                          <div>
                                              <span className="font-medium text-slate-900">
                                                 {rehearsal.date ? format(new Date(rehearsal.date), 'dd/MM/yyyy HH:mm') : '-'}
                                              </span>
                                              {rehearsal.lesson_period && (
                                                  <Badge variant="outline" className="ml-2 text-xs">
                                                      {rehearsal.lesson_period}
                                                  </Badge>
                                              )}
                                          </div>
                                      </div>
                                      {rehearsal.notes && (
                                          <p className="text-sm text-slate-600 mt-2 pl-6">{rehearsal.notes}</p>
                                      )}
                                  </div>
                                  <div className="flex gap-2">
                                      {can('programs', 'create') && (
                                      <Button 
                                         variant="ghost" 
                                         size="icon"
                                         onClick={() => {
                                             setEditingRehearsal(rehearsal);
                                             setIsRehearsalDialogOpen(true);
                                         }}
                                         className="text-slate-400 hover:text-indigo-600"
                                      >
                                          <Edit className="w-4 h-4" />
                                      </Button>
                                      )}
                                      {can('programs', 'delete') && (
                                      <Button 
                                         variant="ghost" 
                                         size="icon"
                                         className="text-red-400 hover:text-red-600"
                                         onClick={() => {
                                             if (confirm('Biztosan törlöd ezt a próbát?')) {
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

        <TabsContent value="chat" className="mt-6">
            <ProgramChat programId={id} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" /> Program Timeline
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-8">
                      {/* Group events by date */}
                      {(() => {
                          const allEvents = [
                              { type: 'program_created', date: program.date, data: program },
                              ...rehearsals.map(r => ({ type: 'rehearsal', date: r.date, data: r }))
                          ].filter(e => e.date);

                          // Group by date
                          const groupedByDate = allEvents.reduce((acc, event) => {
                              const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
                              if (!acc[dateKey]) {
                                  acc[dateKey] = [];
                              }
                              acc[dateKey].push(event);
                              return acc;
                          }, {});

                          // Sort dates descending
                          const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

                          return sortedDates.map((dateKey) => {
                              const events = groupedByDate[dateKey].sort((a, b) => new Date(b.date) - new Date(a.date));
                              const dateObj = new Date(dateKey);
                              
                              return (
                                  <div key={dateKey} className="space-y-3">
                                      {/* Date Header - Calendar Style */}
                                      <div className="flex items-center gap-3">
                                          <div className="flex-shrink-0 w-16 h-16 bg-indigo-600 rounded-lg flex flex-col items-center justify-center text-white shadow-md">
                                              <span className="text-xs uppercase font-bold">{format(dateObj, 'MMM', { locale: hu })}</span>
                                              <span className="text-2xl font-bold">{format(dateObj, 'd')}</span>
                                          </div>
                                          <div className="flex-1">
                                              <h3 className="font-semibold text-lg text-slate-900">
                                                  {format(dateObj, 'yyyy. MMMM d., EEEE', { locale: hu })}
                                              </h3>
                                              <p className="text-sm text-slate-500">{events.length} esemény</p>
                                          </div>
                                      </div>

                                      {/* Events for this date */}
                                      <div className="ml-20 space-y-2">
                                          {events.map((event, idx) => (
                                              <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                                                  event.type === 'program_created' ? 'bg-indigo-50 border-indigo-500' :
                                                  event.type === 'rehearsal' ? 'bg-purple-50 border-purple-500' :
                                                  event.type === 'file' ? 'bg-blue-50 border-blue-500' :
                                                  event.type === 'helper' ? 'bg-emerald-50 border-emerald-500' :
                                                  event.type === 'task_done' ? 'bg-green-50 border-green-500' :
                                                  'bg-slate-50 border-slate-400'
                                              }`}>
                                                  <div className="flex items-start justify-between">
                                                      <div className="flex-1">
                                                          <div className="flex items-center gap-2">
                                                              <span className="text-xs font-medium text-slate-500">
                                                                  {event.type === 'program_created' && event.data.time ? event.data.time : format(new Date(event.date), 'HH:mm')}
                                                              </span>
                                                              <span className="font-medium text-slate-900">
                                                                  {event.type === 'program_created' && '🎬 Program Dátuma'}
                                                                                                {event.type === 'rehearsal' && `🎭 Próba`}
                                                                                                {event.type === 'rehearsal' && event.data.lesson_period && (
                                                                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                                                                        {event.data.lesson_period}
                                                                                                    </Badge>
                                                                                                )}
                                                              </span>
                                                          </div>
                                                          {event.type === 'program_created' && (
                                                              <p className="text-sm text-slate-600 mt-1">{event.data.title} - {event.data.location}</p>
                                                          )}
                                                          {event.type === 'rehearsal' && event.data.notes && (
                                                              <p className="text-sm text-slate-600 mt-1">{event.data.notes}</p>
                                                          )}
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              );
                          });
                      })()}

                      {rehearsals.length === 0 && (
                          <div className="text-center py-12 text-slate-400">
                              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                              <p>Még nincsenek próbák rögzítve.</p>
                          </div>
                      )}
                  </div>
              </CardContent>
            </Card>
        </TabsContent>
        </Tabs>

        <Dialog open={!!newTaskType} onOpenChange={(open) => !open && setNewTaskType(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Új {newTaskType === 'sound' ? 'Hang' : 'Fény'}technikai Feladat</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                <div className="grid gap-2">
                    <Label>Feladat</Label>
                    <Input name="title" required />
                </div>
                <div className="grid gap-2">
                    <Label>Részletek</Label>
                    <Textarea name="details" />
                </div>
                <div className="grid gap-2">
                    <Label>Kinek?</Label>
                    <Select name="assigned_to">
                        <SelectTrigger><SelectValue placeholder="Válassz..." /></SelectTrigger>
                        <SelectContent>
                            {staffList.map(s => (
                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}
                            <SelectItem value="Bárki">Bárki</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Prioritás</Label>
                     <Select name="priority" defaultValue="kozepes">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="alacsony">Alacsony</SelectItem>
                            <SelectItem value="kozepes">Közepes</SelectItem>
                            <SelectItem value="magas">Magas</SelectItem>
                            <SelectItem value="kritikus">Kritikus</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button type="submit" className="w-full bg-indigo-600 text-white">Létrehozás</Button>
            </form>
        </DialogContent>
       </Dialog>

       {viewingPDF && (
         <PDFViewer fileUrl={viewingPDF} onClose={() => setViewingPDF(null)} programId={id} />
       )}

       {viewingDocument && (
         <DocumentViewer 
           fileUrl={viewingDocument.url} 
           fileName={viewingDocument.name}
           onClose={() => setViewingDocument(null)} 
         />
       )}

       <Dialog open={isRehearsalDialogOpen} onOpenChange={setIsRehearsalDialogOpen}>
         <DialogContent>
             <DialogHeader>
                 <DialogTitle>{editingRehearsal ? 'Próba Szerkesztése' : 'Új Próba'}</DialogTitle>
             </DialogHeader>
             <form onSubmit={(e) => {
                 e.preventDefault();
                 const formData = new FormData(e.target);

                 const dateInput = formData.get('date');
                 const timeInput = formData.get('time');
                 const dateFormatted = dateInput.includes('/') 
                     ? format(parse(dateInput, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd')
                     : dateInput;
                 const dateTimeISO = `${dateFormatted}T${timeInput}:00`;

                 const data = {
                     date: new Date(dateTimeISO).toISOString(),
                     lesson_period: formData.get('lesson_period') || null,
                     notes: formData.get('notes')
                 };
                 if (editingRehearsal) {
                     updateRehearsalMutation.mutateAsync({ id: editingRehearsal.id, data });
                 } else {
                     createRehearsalMutation.mutateAsync(data);
                 }
             }} className="space-y-4 mt-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                         <Label>Dátum</Label>
                         <Input 
                             name="date" 
                             type="text" 
                             defaultValue={editingRehearsal ? format(new Date(editingRehearsal.date), 'dd/MM/yyyy') : ''}
                             placeholder="dd/mm/yyyy"
                             maxLength={10}
                             onChange={(e) => {
                                 const formatted = formatDateInput(e.target.value);
                                 e.target.value = formatted;
                             }}
                             required 
                         />
                     </div>
                     <div className="grid gap-2">
                         <Label>Időpont (ÓÓ:PP)</Label>
                         <Input 
                             name="time" 
                             type="text" 
                             placeholder="14:30"
                             maxLength={5}
                             defaultValue={editingRehearsal ? format(new Date(editingRehearsal.date), 'HH:mm') : ''}
                             onChange={(e) => {
                                 const value = e.target.value.replace(/[^\d:]/g, '');
                                 const parts = value.split(':');
                                 if (parts[0] && parts[0].length === 2 && !value.includes(':')) {
                                     e.target.value = parts[0] + ':';
                                 } else {
                                     e.target.value = value;
                                 }
                             }}
                             pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                             title="ÓÓ:PP formátum (pl. 14:30)"
                             required 
                         />
                     </div>
                     </div>
                     <div className="grid gap-2">
                     <Label>Tanrendi óra (opcionális)</Label>
                     <Input 
                         name="lesson_period" 
                         placeholder="pl. 3. óra, 4-5. óra"
                         defaultValue={editingRehearsal?.lesson_period || ''}
                     />
                     </div>
                     <div className="grid gap-2">
                     <Label>Megjegyzések</Label>
                     <Textarea 
                         name="notes" 
                         placeholder="Technikai igények, résztvevők, stb..."
                         defaultValue={editingRehearsal?.notes || ''}
                         className="min-h-[100px]"
                     />
                     </div>
                 <div className="flex justify-end gap-2">
                     <Button type="button" variant="outline" onClick={() => {
                         setIsRehearsalDialogOpen(false);
                         setEditingRehearsal(null);
                     }}>
                         Mégse
                     </Button>
                     <Button type="submit" className="bg-indigo-600 text-white">
                         {editingRehearsal ? 'Mentés' : 'Létrehozás'}
                     </Button>
                 </div>
             </form>
         </DialogContent>
       </Dialog>
    </div>
  );
}