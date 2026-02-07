import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/usePermissions';
import { Plus, Trash2, CheckCircle2, Circle, Mic2, Lightbulb, Edit2, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export default function Tasks() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [taskType, setTaskType] = useState('sound');
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [pendingEquipmentId, setPendingEquipmentId] = useState(null);

  // Fetch Data
  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list('date'),
    initialData: []
  });

  const { data: soundTasks } = useQuery({
    queryKey: ['sound-tasks'],
    queryFn: () => base44.entities.SoundTask.list(),
    initialData: []
  });

  const { data: lightTasks } = useQuery({
    queryKey: ['light-tasks'],
    queryFn: () => base44.entities.LightTask.list(),
    initialData: []
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: []
  });

  const { data: allEquipments } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list(),
    initialData: []
  });

  const tasks = taskType === 'sound' ? soundTasks : lightTasks;
  const equipments = allEquipments.filter(e => e.category === (taskType === 'sound' ? 'hangtechnika' : 'fenytechnika'));

  // Filter tasks for selected program
  const programTasks = selectedProgramId === 'all'
    ? tasks
    : selectedProgramId === 'unassigned'
    ? tasks.filter(t => !t.program_id)
    : selectedProgramId 
    ? tasks.filter(t => t.program_id === selectedProgramId)
    : [];

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data) => {
      const entity = taskType === 'sound' ? base44.entities.SoundTask : base44.entities.LightTask;
      return entity.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`${taskType}-tasks`]);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const entity = taskType === 'sound' ? base44.entities.SoundTask : base44.entities.LightTask;
      return entity.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`${taskType}-tasks`]);
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => {
      const entity = taskType === 'sound' ? base44.entities.SoundTask : base44.entities.LightTask;
      return entity.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`${taskType}-tasks`]);
    }
  });

  const handleAddTask = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const programId = formData.get('program_id');
    const equipmentIds = selectedEquipments.map(se => se.equipmentId);
    const equipmentSerials = {};
    selectedEquipments.forEach(se => {
      if (se.serialNumber) {
        equipmentSerials[se.equipmentId] = se.serialNumber;
      }
    });

    createTaskMutation.mutate({
      title: formData.get('title'),
      details: formData.get('details'),
      priority: formData.get('priority'),
      assigned_to: formData.get('assigned_to'),
      program_id: programId === 'none' ? null : programId,
      status: 'teendo',
      related_equipment_ids: equipmentIds,
      equipment_serials: equipmentSerials
    });
    e.target.reset();
    setSelectedEquipments([]);
  };

  const handleUpdateTask = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const equipmentIds = selectedEquipments.map(se => se.equipmentId);
    const equipmentSerials = {};
    selectedEquipments.forEach(se => {
      if (se.serialNumber) {
        equipmentSerials[se.equipmentId] = se.serialNumber;
      }
    });
    
    updateTaskMutation.mutate({
        id: editingTask.id,
        data: {
            title: formData.get('title'),
            details: formData.get('details'),
            priority: formData.get('priority'),
            assigned_to: formData.get('assigned_to'),
            program_id: formData.get('program_id'),
            related_equipment_ids: equipmentIds,
            equipment_serials: equipmentSerials
        }
    });
    setEditingTask(null);
    setSelectedEquipments([]);
  };

  // Set default selected program if none selected
  React.useEffect(() => {
    if (!selectedProgramId) {
      setSelectedProgramId('all');
    }
  }, [selectedProgramId]);

  // Initialize selected equipments when editing task
  React.useEffect(() => {
    if (editingTask) {
      const initialEquipments = (editingTask.related_equipment_ids || []).map(eqId => ({
        equipmentId: eqId,
        serialNumber: editingTask.equipment_serials?.[eqId] || null
      }));
      setSelectedEquipments(initialEquipments);
    }
  }, [editingTask]);

  const activeProgram = programs.find(p => p.id === selectedProgramId);
  const themeColor = taskType === 'sound' ? 'indigo' : 'amber';
  const Icon = taskType === 'sound' ? Mic2 : Lightbulb;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          Feladatok
        </h1>
        <p className="text-slate-500">Hangtechnikai és fénytechnikai feladatok kezelése</p>
      </div>

      {/* Task Type Selector */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTaskType('sound')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            taskType === 'sound'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mic2 className="w-4 h-4" />
          Hangtechnika
        </button>
        <button
          onClick={() => setTaskType('light')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            taskType === 'light'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
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
                onClick={() => setSelectedProgramId('all')}
                className={`p-4 text-left border-l-4 transition-all hover:bg-slate-50 ${
                  selectedProgramId === 'all'
                    ? `border-${themeColor}-600 bg-${themeColor}-50` 
                    : 'border-transparent'
                }`}
              >
                <div className="font-medium">Minden program</div>
                <div className="text-xs text-slate-500">Összes feladat</div>
              </button>
              <button
                onClick={() => setSelectedProgramId('unassigned')}
                className={`p-4 text-left border-l-4 transition-all hover:bg-slate-50 ${
                  selectedProgramId === 'unassigned'
                    ? `border-${themeColor}-600 bg-${themeColor}-50` 
                    : 'border-transparent'
                }`}
              >
                <div className="font-medium">Nincs programhoz rendelve</div>
                <div className="text-xs text-slate-500">Általános feladatok</div>
              </button>
              {programs.map(prog => (
                <button
                  key={prog.id}
                  onClick={() => setSelectedProgramId(prog.id)}
                  className={`p-4 text-left border-l-4 transition-all hover:bg-slate-50 ${
                    selectedProgramId === prog.id 
                      ? `border-${themeColor}-600 bg-${themeColor}-50` 
                      : 'border-transparent'
                  }`}
                >
                  <div className="font-medium truncate">{prog.title}</div>
                  <div className="text-xs text-slate-500">{prog.date}</div>
                </button>
              ))}
              {programs.length === 0 && (
                <div className="p-4 text-sm text-slate-400">Nincs elérhető esemény.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main: Task Board */}
        <div className="lg:col-span-3 space-y-6">
          {activeProgram || selectedProgramId === 'unassigned' || selectedProgramId === 'all' ? (
            <>
              {can('tasks', 'create') && (
              <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Új Feladat Hozzáadása</CardTitle>
                        {isFormOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <form onSubmit={handleAddTask} className="space-y-4">
                    <div className="grid gap-2">
                       <label className="text-xs font-medium">Esemény (Opcionális)</label>
                       <Select name="program_id" defaultValue={selectedProgramId || 'none'}>
                          <SelectTrigger>
                             <SelectValue placeholder="Válassz eseményt..." />
                          </SelectTrigger>
                          <SelectContent>
                             <SelectItem value="none">Nincs eseményhez kötve</SelectItem>
                             {programs.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium">Feladat</label>
                      <Input name="title" required placeholder={taskType === 'sound' ? 'pl. Mikrofonozás, Soundcheck' : 'pl. Derítés beállítása'} />
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-xs font-medium">Megjegyzések</label>
                      <Textarea name="details" placeholder="Technikai részletek, igények..." className="min-h-[80px]" />
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="grid gap-2 w-full md:w-48">
                        <label className="text-xs font-medium">Kinek?</label>
                        <Select name="assigned_to">
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz..." />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList.map(s => (
                              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}
                            <SelectItem value="Bárki">Bárki</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 w-full md:w-32">
                        <label className="text-xs font-medium">Prioritás</label>
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

                    <div className="grid gap-2 w-full">
                       <label className="text-xs font-medium">Kiválasztott Eszközök ({selectedEquipments.length})</label>
                       <div className="border rounded-lg p-3 max-h-32 overflow-y-auto bg-slate-50 space-y-2">
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
                                   className="text-red-500 hover:text-red-700 h-6"
                                 >
                                   <Trash2 className="w-3 h-3" />
                                 </Button>
                               </div>
                             );
                           })
                         )}
                       </div>
                    </div>

                    <div className="grid gap-2 w-full">
                       <label className="text-xs font-medium">Eszköz hozzáadása</label>
                       <Select 
                         value={pendingEquipmentId || ""} 
                         onValueChange={(eqId) => {
                           const eq = equipments.find(e => e.id === eqId);
                           if (!eq) return;

                           if (eq.serial_numbers && eq.serial_numbers.length > 0) {
                             setPendingEquipmentId(eqId);
                           } else {
                             setSelectedEquipments(prev => [...prev, { equipmentId: eqId, serialNumber: null }]);
                           }
                         }}
                       >
                         <SelectTrigger><SelectValue placeholder="Válassz eszközt..." /></SelectTrigger>
                         <SelectContent>
                           {equipments.map(e => (
                             <SelectItem key={e.id} value={e.id}>
                               {e.name}
                               {e.serial_numbers && e.serial_numbers.length > 0 && ` (${e.serial_numbers.length} db)`}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>

                    {pendingEquipmentId && (() => {
                      const eq = equipments.find(e => e.id === pendingEquipmentId);
                      if (!eq || !eq.serial_numbers || eq.serial_numbers.length === 0) return null;
                      
                      return (
                        <div className="grid gap-2 w-full animate-in fade-in">
                          <label className="text-xs font-medium">Szériaszám kiválasztása</label>
                          <Select 
                            onValueChange={(serial) => {
                              setSelectedEquipments(prev => [...prev, { equipmentId: pendingEquipmentId, serialNumber: serial }]);
                              setPendingEquipmentId(null);
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Válassz szériaszámot..." /></SelectTrigger>
                            <SelectContent>
                              {eq.serial_numbers.map(sn => (
                                <SelectItem key={sn} value={sn}>{sn}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })()}

                        <Button type="submit" className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white w-full`}>
                          <Plus className="w-4 h-4 mr-2" /> Hozzáadás
                        </Button>
                      </form>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              )}

              <div className="grid gap-3">
                {programTasks.length === 0 && (
                   <div className="text-center py-10 text-slate-400">
                     {selectedProgramId === 'all' ? 'Nincsenek feladatok.' : selectedProgramId === 'unassigned' ? 'Nincsenek általános feladatok.' : 'Ehhez az eseményhez nincsenek technikai feladatok.'}
                   </div>
                )}
                {programTasks.map(task => (
                  <div key={task.id} className="group flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-4 flex-1">
                      <button onClick={() => updateTaskMutation.mutate({ 
                        id: task.id, 
                        data: { status: task.status === 'kesz' ? 'teendo' : 'kesz' }
                      })}>
                        {task.status === 'kesz' ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Circle className={`w-6 h-6 text-slate-300 hover:text-${themeColor}-500`} />
                        )}
                      </button>
                      <div className="flex-1 cursor-pointer" onClick={() => setViewingTask(task)}>
                        <h4 className={`font-medium hover:text-${themeColor}-600 transition-colors ${task.status === 'kesz' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs flex items-center gap-1 bg-${themeColor}-50 text-${themeColor}-700 border-${themeColor}-200`}>
                            <User className="w-3 h-3" />
                            {task.assigned_to || 'Nincs hozzárendelve'}
                          </Badge>
                          <Badge className={`text-[10px] ${
                            task.priority === 'kritikus' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                            task.priority === 'magas' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                            'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}>
                            {task.priority}
                          </Badge>
                          {task.related_equipment_ids?.length > 0 && (
                             <Popover>
                               <PopoverTrigger asChild>
                                 <Badge variant="secondary" className="cursor-pointer hover:bg-slate-200 text-[10px]">
                                   {task.related_equipment_ids.length} eszköz
                                 </Badge>
                               </PopoverTrigger>
                               <PopoverContent className="w-64">
                                  <div className="space-y-2">
                                     <h4 className="font-medium text-sm">Kapcsolódó Eszközök</h4>
                                     <ul className="text-sm text-slate-600 list-disc list-inside">
                                        {task.related_equipment_ids.map(eqId => {
                                           const eq = equipments.find(e => e.id === eqId) || allEquipments.find(e => e.id === eqId);
                                           const serial = task.equipment_serials?.[eqId];
                                           return (
                                             <li key={eqId}>
                                               {eq ? eq.name : 'Törölt eszköz'}
                                               {serial && <span className="text-xs ml-1">({serial})</span>}
                                             </li>
                                           );
                                        })}
                                     </ul>
                                  </div>
                               </PopoverContent>
                             </Popover>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                        {can('tasks', 'edit') && (
                        <Button variant="ghost" size="icon" className={`text-slate-400 hover:text-${themeColor}-600`} onClick={() => setEditingTask(task)}>
                        <Edit2 className="w-4 h-4" />
                        </Button>
                        )}
                        {can('tasks', 'delete') && (
                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => deleteTaskMutation.mutate(task.id)}>
                        <Trash2 className="w-4 h-4" />
                        </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border-2 border-dashed">
              <p className="text-slate-400">Válassz egy eseményt a bal oldali listából.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 text-${themeColor}-600`} />
                  Feladat Részletei
                </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label className="text-slate-500 text-xs">Feladat címe</Label>
                <p className="text-lg font-semibold">{viewingTask?.title}</p>
              </div>
              
              {viewingTask?.details && (
                <div className="grid gap-2">
                  <Label className="text-slate-500 text-xs">Részletek / Megjegyzések</Label>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{viewingTask.details}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-slate-500 text-xs">Hozzárendelt személy</Label>
                  <Badge variant="outline" className={`w-fit flex items-center gap-1 bg-${themeColor}-50 text-${themeColor}-700 border-${themeColor}-200`}>
                    <User className="w-3 h-3" />
                    {viewingTask?.assigned_to || 'Nincs hozzárendelve'}
                  </Badge>
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-slate-500 text-xs">Prioritás</Label>
                  <Badge className={`w-fit ${
                    viewingTask?.priority === 'magas' ? 'bg-orange-100 text-orange-800' :
                    viewingTask?.priority === 'kozepes' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {viewingTask?.priority}
                  </Badge>
                </div>
              </div>

              {viewingTask?.related_equipment_ids && viewingTask.related_equipment_ids.length > 0 && (
                <div className="grid gap-2">
                  <Label className="text-slate-500 text-xs">Kapcsolódó eszközök</Label>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <ul className="space-y-2">
                      {viewingTask.related_equipment_ids.map(eqId => {
                        const eq = equipments.find(e => e.id === eqId) || allEquipments.find(e => e.id === eqId);
                        const serial = viewingTask.equipment_serials?.[eqId];
                        return (
                          <li key={eqId} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full bg-${themeColor}-400`}></div>
                            <span className="text-sm">
                              {eq ? eq.name : 'Törölt eszköz'}
                              {serial && <span className="text-xs text-slate-500 ml-1">({serial})</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => {
                  setEditingTask(viewingTask);
                  setViewingTask(null);
                }} variant="outline" className="flex-1">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Szerkesztés
                </Button>
                <Button onClick={() => setViewingTask(null)} className={`flex-1 bg-${themeColor}-600`}>
                  Bezárás
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={(open) => {
        if (!open) {
          setEditingTask(null);
          setSelectedEquipments([]);
          setPendingEquipmentId(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Feladat Szerkesztése</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTask} className="space-y-4 mt-4">
                <div className="grid gap-2">
                    <Label>Feladat</Label>
                    <Input name="title" defaultValue={editingTask?.title} required />
                </div>
                <div className="grid gap-2">
                    <Label>Részletek / Feljegyzések</Label>
                    <Textarea name="details" defaultValue={editingTask?.details} placeholder="Írj ide feljegyzéseket..." className="min-h-[100px]" />
                </div>
                <div className="grid gap-2">
                    <Label>Esemény</Label>
                    <Select name="program_id" defaultValue={editingTask?.program_id}>
                        <SelectTrigger>
                            <SelectValue placeholder="Válassz eseményt..." />
                        </SelectTrigger>
                        <SelectContent>
                            {programs.map(prog => (
                                <SelectItem key={prog.id} value={prog.id}>{prog.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Kinek?</Label>
                    <Select name="assigned_to" defaultValue={editingTask?.assigned_to}>
                        <SelectTrigger>
                            <SelectValue placeholder="Válassz..." />
                        </SelectTrigger>
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
                    <Select name="priority" defaultValue={editingTask?.priority}>
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

                <div className="grid gap-2 w-full">
                   <Label>Kiválasztott Eszközök ({selectedEquipments.length})</Label>
                   <div className="border rounded-lg p-3 max-h-32 overflow-y-auto bg-slate-50 space-y-2">
                     {selectedEquipments.length === 0 ? (
                       <p className="text-sm text-slate-400 text-center py-2">Még nincs kiválasztott eszköz</p>
                     ) : (
                       selectedEquipments.map((sel, idx) => {
                         const eq = equipments.find(e => e.id === sel.equipmentId) || allEquipments.find(e => e.id === sel.equipmentId);
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
                               className="text-red-500 hover:text-red-700 h-6"
                             >
                               <Trash2 className="w-3 h-3" />
                             </Button>
                           </div>
                         );
                       })
                     )}
                   </div>
                </div>

                <div className="grid gap-2 w-full">
                   <Label>Eszköz hozzáadása</Label>
                   <Select 
                     value={pendingEquipmentId || ""} 
                     onValueChange={(eqId) => {
                       const eq = equipments.find(e => e.id === eqId);
                       if (!eq) return;

                       if (eq.serial_numbers && eq.serial_numbers.length > 0) {
                         setPendingEquipmentId(eqId);
                       } else {
                         setSelectedEquipments(prev => [...prev, { equipmentId: eqId, serialNumber: null }]);
                       }
                     }}
                   >
                     <SelectTrigger><SelectValue placeholder="Válassz eszközt..." /></SelectTrigger>
                     <SelectContent>
                       {equipments.map(e => (
                         <SelectItem key={e.id} value={e.id}>
                           {e.name}
                           {e.serial_numbers && e.serial_numbers.length > 0 && ` (${e.serial_numbers.length} db)`}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>

                {pendingEquipmentId && (() => {
                  const eq = equipments.find(e => e.id === pendingEquipmentId);
                  if (!eq || !eq.serial_numbers || eq.serial_numbers.length === 0) return null;
                  
                  return (
                    <div className="grid gap-2 w-full animate-in fade-in">
                      <Label>Szériaszám kiválasztása</Label>
                      <Select 
                        onValueChange={(serial) => {
                          setSelectedEquipments(prev => [...prev, { equipmentId: pendingEquipmentId, serialNumber: serial }]);
                          setPendingEquipmentId(null);
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Válassz szériaszámot..." /></SelectTrigger>
                        <SelectContent>
                          {eq.serial_numbers.map(sn => (
                            <SelectItem key={sn} value={sn}>{sn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}

                <Button type="submit" className={`w-full bg-${themeColor}-600 text-white`}>Mentés</Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}