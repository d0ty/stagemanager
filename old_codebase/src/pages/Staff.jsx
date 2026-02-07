import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/usePermissions';
import { Plus, User, Phone, Mail, Trash2, Edit, UserPlus, CheckCircle, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Staff() {
  const { can } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [assignmentMode, setAssignmentMode] = useState('new');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showContactEmail, setShowContactEmail] = useState(false);
  const [showContactPhone, setShowContactPhone] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [roleColor, setRoleColor] = useState('kek');
  const [rolePermissions, setRolePermissions] = useState({});
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const checkAdmin = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            // Check if user has admin custom_role
            if (user && user.custom_role === 'admin') {
                setIsAdmin(true);
            }
        } catch (e) {
            console.error("Auth check failed", e);
        }
    };
    checkAdmin();
  }, []);

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: []
  });

  const { data: usersList } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers');
      return res.data.users;
    },
    initialData: []
  });

  const { data: rolesList } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Staff.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setIsOpen(false);
      setEditingStaff(null);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({id, data, oldStaff}) => {
      const oldName = oldStaff?.name;
      
      await base44.entities.Staff.update(id, data);
      
      if (data.login_email && data.name) {
        const users = await base44.entities.User.filter({ email: data.login_email });
        if (users.length > 0 && users[0].full_name !== data.name) {
          await base44.entities.User.update(users[0].id, { full_name: data.name });
        }
      }
      
      if (oldName && data.name && oldName !== data.name) {
        const chatMessages = await base44.entities.ChatMessage.filter({ sender_name: oldName });
        for (const msg of chatMessages) {
          await base44.entities.ChatMessage.update(msg.id, { sender_name: data.name });
        }
        
        const soundTasks = await base44.entities.SoundTask.filter({ assigned_to: oldName });
        for (const task of soundTasks) {
          await base44.entities.SoundTask.update(task.id, { assigned_to: data.name });
        }
        
        const lightTasks = await base44.entities.LightTask.filter({ assigned_to: oldName });
        for (const task of lightTasks) {
          await base44.entities.LightTask.update(task.id, { assigned_to: data.name });
        }
        
        const programs = await base44.entities.Program.filter({ lead_staff_name: oldName });
        for (const prog of programs) {
          await base44.entities.Program.update(prog.id, { lead_staff_name: data.name });
        }
        
        const helpers = await base44.entities.ProgramHelper.filter({ staff_name: oldName });
        for (const helper of helpers) {
          await base44.entities.ProgramHelper.update(helper.id, { staff_name: data.name });
        }
        
        const loans = await base44.entities.EquipmentLoan.filter({ staff_name: oldName });
        for (const loan of loans) {
          await base44.entities.EquipmentLoan.update(loan.id, { staff_name: data.name });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setIsOpen(false);
      setEditingStaff(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Staff.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['staff'])
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role, staffId, staffName }) => {
      await base44.users.inviteUser(email, role);
      if (staffId) {
        await base44.entities.Staff.update(staffId, { login_email: email });
      } else {
        await base44.entities.Staff.create({
          name: email.split('@')[0],
          login_email: email,
          roles: ['egyeb']
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setInviteDialogOpen(null);
      setInviteEmail('');
      setInviteRole('user');
      setAssignmentMode('new');
      setSelectedUserId('');
    }
  });

  const assignExistingUserMutation = useMutation({
    mutationFn: async ({ userId, staffId }) => {
      const user = usersList.find(u => u.id === userId);
      await base44.entities.Staff.update(staffId, { login_email: user.email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setInviteDialogOpen(null);
      setInviteEmail('');
      setInviteRole('user');
      setAssignmentMode('new');
      setSelectedUserId('');
    }
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      await base44.functions.invoke('updateUserRole', { userId, role });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setRoleDialogOpen(null);
      setSelectedRole('');
    }
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setIsRoleDialogOpen(false);
      setEditingRole(null);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setRoleColor('kek');
      setRolePermissions({});
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setIsRoleDialogOpen(false);
      setEditingRole(null);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setRoleColor('kek');
      setRolePermissions({});
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['roles'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const selectedRoles = Array.from(formData.getAll('roles'));
    const assignMode = formData.get('assign_mode');
    const assignUserId = formData.get('assign_user_id');
    const assignEmail = formData.get('assign_email');
    const assignRole = formData.get('assign_role');
    
    const name = formData.get('name');
    const mentionName = name.toLowerCase().replace(/\s+/g, '_');
    
    const data = {
      name: name,
      mention_name: mentionName,
      roles: selectedRoles.length > 0 ? selectedRoles : ['egyeb'],
      contact_phone: formData.get('contact_phone') || null,
      contact_email: formData.get('contact_email') || null,
    };

    if (assignMode === 'existing' && assignUserId) {
      const user = usersList.find(u => u.id === assignUserId);
      data.login_email = user?.email;
    } else if (assignMode === 'new' && assignEmail) {
      data.login_email = assignEmail;
    } else if (assignMode === 'none') {
      data.login_email = null;
    } else if (assignMode === 'keep') {
      delete data.login_email;
    }

    if (editingStaff) {
        updateMutation.mutate({ id: editingStaff.id, data, oldStaff: editingStaff });
        if (assignMode === 'new' && assignEmail && !editingStaff.login_email) {
          inviteUserMutation.mutate({ email: assignEmail, role: assignRole || 'user', staffId: editingStaff.id });
        }
    } else {
        createMutation.mutate(data);
        if (assignMode === 'new' && assignEmail) {
          setTimeout(() => {
            const newStaff = staffList.find(s => s.email === formData.get('email') && s.name === formData.get('name'));
            if (newStaff) {
              inviteUserMutation.mutate({ email: assignEmail, role: assignRole || 'user', staffId: newStaff.id });
            }
          }, 500);
        }
    }
  };

  const handleInviteUser = (e) => {
    e.preventDefault();
    if (assignmentMode === 'new') {
      inviteUserMutation.mutate({ 
        email: inviteEmail, 
        role: inviteRole, 
        staffId: inviteDialogOpen 
      });
    } else {
      assignExistingUserMutation.mutate({
        userId: selectedUserId,
        staffId: inviteDialogOpen
      });
    }
  };

  const handleRoleChange = async (e) => {
    e.preventDefault();
    if (roleDialogOpen && selectedRole) {
      await updateUserRoleMutation.mutateAsync({ userId: roleDialogOpen, role: selectedRole });
      setRoleDialogOpen(null);
      setSelectedRole('');
    }
  };

  const handleSaveRole = (e) => {
    e.preventDefault();
    const data = {
      name: newRoleName,
      display_name: newRoleDisplayName,
      color: roleColor,
      permissions: rolePermissions
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDisplayName(role.display_name);
    setRoleColor(role.color || 'kek');
    setRolePermissions(role.permissions || {});
    setIsRoleDialogOpen(true);
  };

  const handleNewRole = () => {
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleDisplayName('');
    setRoleColor('kek');
    setRolePermissions({
      equipment: { view: true, create: false, edit: false, delete: false },
      programs: { view: true, create: false, edit: false, delete: false },
      staff: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: false, edit: false, delete: false },
      chat: { view: true, send: true },
      admin_settings: { view: false, create: false, edit: false, delete: false }
    });
    setIsRoleDialogOpen(true);
  };

  const updatePermission = (category, action, value) => {
    setRolePermissions(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [action]: value
      }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Személyzet</h1>
          <p className="text-slate-500">Technikusok és szervezők kezelése</p>
        </div>
        {isAdmin && (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if(!open) setEditingStaff(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Új Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Szerkesztés' : 'Új Munkatárs'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4" onChange={(e) => {
              const form = e.currentTarget;
              const assignMode = form.querySelector('[name="assign_mode"]')?.value;
              const existingDiv = form.querySelector('#assign-existing');
              const newDiv = form.querySelector('#assign-new');
              if (existingDiv && newDiv) {
                existingDiv.classList.toggle('hidden', assignMode !== 'existing');
                newDiv.classList.toggle('hidden', assignMode !== 'new');
              }
            }}>
              <div className="grid gap-2">
                <Label>Név</Label>
                <Input name="name" defaultValue={editingStaff?.name} required />
              </div>
              <div className="grid gap-2">
                <Label>Munkakörök</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['hangtechnikus', 'fenytechnikus', 'szervezo', 'stage', 'egyeb'].map((role) => (
                    <label key={role} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                          type="checkbox" 
                          name="roles" 
                          value={role} 
                          defaultChecked={editingStaff?.roles?.includes(role) || editingStaff?.role === role}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                      <span className="text-sm text-slate-700 capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-semibold mb-2 block">Bejelentkezési hozzáférés (opcionális)</Label>
                {editingStaff?.login_email && (
                  <div className="mb-3 p-3 bg-emerald-50 rounded-md border border-emerald-200">
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Jelenlegi bejelentkezés: <strong>{editingStaff.login_email}</strong></span>
                    </div>
                  </div>
                )}
                <Select name="assign_mode" defaultValue={editingStaff?.login_email ? "keep" : "none"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editingStaff?.login_email && <SelectItem value="keep">Megtartás (nem változik)</SelectItem>}
                    <SelectItem value="none">{editingStaff?.login_email ? "Hozzáférés eltávolítása" : "Nincs bejelentkezési hozzáférés"}</SelectItem>
                    <SelectItem value="existing">Már regisztrált felhasználó</SelectItem>
                    <SelectItem value="new">Meghívó küldése új felhasználónak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div id="assign-existing" className="grid gap-2 hidden">
                <Label>Válassz felhasználót</Label>
                <Select name="assign_user_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Felhasználó kiválasztása..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usersList.filter(u => !staffList.some(s => s.login_email === u.email && s.id !== editingStaff?.id)).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div id="assign-new" className="space-y-2 hidden">
                <div className="grid gap-2">
                  <Label>Bejelentkezési e-mail</Label>
                  <Input name="assign_email" type="email" placeholder="pelda@email.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Jogosultsági szint</Label>
                  <Select name="assign_role" defaultValue="user">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Felhasználó</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <Label className="text-sm font-medium mb-2 block">Kapcsolattartási adatok (opcionális)</Label>
                
                {!showContactEmail ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full mb-2"
                    onClick={() => setShowContactEmail(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Kapcsolattartási e-mail
                  </Button>
                ) : (
                  <div className="grid gap-2 mb-2">
                    <Label>Kapcsolattartási e-mail</Label>
                    <Input name="contact_email" type="email" defaultValue={editingStaff?.contact_email} placeholder="email@pelda.com" />
                  </div>
                )}

                {!showContactPhone ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowContactPhone(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Kapcsolattartási telefonszám
                  </Button>
                ) : (
                  <div className="grid gap-2">
                    <Label>Kapcsolattartási telefonszám</Label>
                    <Input name="contact_phone" defaultValue={editingStaff?.contact_phone} placeholder="+36..." />
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button type="submit" className="bg-indigo-600 text-white w-full">Mentés</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="staff">Személyzet</TabsTrigger>
          {can('admin_settings', 'view') && <TabsTrigger value="admin">Admin Beállítások</TabsTrigger>}
        </TabsList>

        <TabsContent value="staff" className="mt-6">
        {!can('staff', 'view') ? (
        <div className="text-center py-12 text-slate-400">Nincs jogosultságod megtekinteni ezt az oldalt.</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((staff) => {
          const user = usersList.find(u => u.email === staff.login_email);
          const profilePicture = user?.profile_picture;
          
          return (
          <Card key={staff.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 overflow-hidden">
                    {profilePicture ? (
                      <img src={profilePicture} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-slate-900">{staff.name}</h3>
                      {user?.custom_role && (() => {
                        const userRole = rolesList.find(r => r.name === user.custom_role);
                        const colorClasses = {
                          piros: 'bg-red-100 text-red-800 border-red-300',
                          kek: 'bg-blue-100 text-blue-800 border-blue-300',
                          zold: 'bg-green-100 text-green-800 border-green-300',
                          sarga: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                          lila: 'bg-purple-100 text-purple-800 border-purple-300'
                        };
                        return (
                          <Badge className={`text-xs w-fit ${userRole?.color ? colorClasses[userRole.color] : 'bg-indigo-100 text-indigo-800'}`}>
                            {userRole?.display_name || user.custom_role}
                          </Badge>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(staff.roles || [staff.role || 'egyeb']).map(role => (
                        <Badge key={role} variant="secondary" className="capitalize text-xs">{role}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {(can('staff', 'edit') || can('staff', 'delete')) && (
                <div className="flex gap-1">
                    {can('staff', 'edit') && (
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 h-8 w-8" onClick={() => {
                        setEditingStaff(staff);
                        setIsOpen(true);
                        setShowContactEmail(!!staff.contact_email);
                        setShowContactPhone(!!staff.contact_phone);
                    }}>
                    <Edit className="w-4 h-4" />
                    </Button>
                    )}
                    {can('staff', 'delete') && (
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 h-8 w-8" onClick={() => {
                        if(confirm('Biztosan törlöd?')) deleteMutation.mutate(staff.id)
                    }}>
                    <Trash2 className="w-4 h-4" />
                    </Button>
                    )}
                </div>
                )}
              </div>
              
              <div className="mt-6 space-y-2">
                {staff.contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {staff.contact_phone}
                  </div>
                )}
                {staff.contact_email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {staff.contact_email}
                  </div>
                )}
                {staff.login_email && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      <CheckCircle className="w-4 h-4" />
                      Bejelentkezés: {staff.login_email}
                    </div>
                  </>
                )}
                {isAdmin && !staff.login_email && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => {
                      setInviteDialogOpen(staff.id);
                      setInviteEmail(staff.email || '');
                      setAssignmentMode('new');
                      setSelectedUserId('');
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Meghívás az Appba
                  </Button>
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

        {can('admin_settings', 'view') && (
          <TabsContent value="admin" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      Szerepkörök Kezelése
                    </CardTitle>
                    <Button onClick={handleNewRole} className="bg-indigo-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Új Szerepkör
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-4">
                    {rolesList.filter((role, index, self) => 
                      index === self.findIndex(r => r.name === role.name)
                    ).map(role => {
                      const colorClasses = {
                        piros: 'bg-red-100 border-red-300',
                        kek: 'bg-blue-100 border-blue-300',
                        zold: 'bg-green-100 border-green-300',
                        sarga: 'bg-yellow-100 border-yellow-300',
                        lila: 'bg-purple-100 border-purple-300'
                      };
                      return (
                      <AccordionItem key={role.id} value={role.id} className={`border rounded-lg ${colorClasses[role.color] || 'bg-white'}`}>
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div>
                              <h3 className="font-semibold text-slate-900 text-left">{role.display_name}</h3>
                              <p className="text-sm text-slate-500">Azonosító: {role.name}</p>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  if (confirm('Biztosan törölni szeretnéd ezt a szerepkört?')) {
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
                          {role.permissions?.equipment && (
                            <div className="bg-slate-50 p-2 rounded">
                              <strong className="text-slate-900">Leltár:</strong>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {role.permissions.equipment.view && <Badge variant="outline" className="text-xs">👁️ Megtekintés</Badge>}
                                {role.permissions.equipment.create && <Badge variant="outline" className="text-xs">➕ Létrehozás</Badge>}
                                {role.permissions.equipment.edit && <Badge variant="outline" className="text-xs">✏️ Szerkesztés</Badge>}
                                {role.permissions.equipment.delete && <Badge variant="outline" className="text-xs">🗑️ Törlés</Badge>}
                              </div>
                            </div>
                          )}
                          {role.permissions?.programs && (
                            <div className="bg-slate-50 p-2 rounded">
                              <strong className="text-slate-900">Programok:</strong>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {role.permissions.programs.view && <Badge variant="outline" className="text-xs">👁️ Megtekintés</Badge>}
                                {role.permissions.programs.create && <Badge variant="outline" className="text-xs">➕ Létrehozás/Szerkesztés</Badge>}
                                {role.permissions.programs.delete && <Badge variant="outline" className="text-xs">🗑️ Törlés</Badge>}
                              </div>
                            </div>
                          )}
                          {role.permissions?.staff && (
                            <div className="bg-slate-50 p-2 rounded">
                              <strong className="text-slate-900">Személyzet:</strong>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {role.permissions.staff.view && <Badge variant="outline" className="text-xs">👁️ Megtekintés</Badge>}
                                {role.permissions.staff.create && <Badge variant="outline" className="text-xs">➕ Létrehozás</Badge>}
                                {role.permissions.staff.edit && <Badge variant="outline" className="text-xs">✏️ Szerkesztés</Badge>}
                                {role.permissions.staff.delete && <Badge variant="outline" className="text-xs">🗑️ Törlés</Badge>}
                              </div>
                            </div>
                          )}
                          {role.permissions?.tasks && (
                            <div className="bg-slate-50 p-2 rounded">
                              <strong className="text-slate-900">Feladatok:</strong>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {role.permissions.tasks.view && <Badge variant="outline" className="text-xs">👁️ Megtekintés</Badge>}
                                {role.permissions.tasks.create && <Badge variant="outline" className="text-xs">➕ Létrehozás</Badge>}
                                {role.permissions.tasks.edit && <Badge variant="outline" className="text-xs">✏️ Szerkesztés</Badge>}
                                {role.permissions.tasks.delete && <Badge variant="outline" className="text-xs">🗑️ Törlés</Badge>}
                              </div>
                            </div>
                          )}
                          {role.permissions?.chat && (
                            <div className="bg-slate-50 p-2 rounded">
                              <strong className="text-slate-900">Chat:</strong>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {role.permissions.chat.view && <Badge variant="outline" className="text-xs">👁️ Megtekintés</Badge>}
                                {role.permissions.chat.send && <Badge variant="outline" className="text-xs">✉️ Üzenet küldés</Badge>}
                              </div>
                            </div>
                          )}
                          {role.permissions?.admin_settings && (
                            <div className="bg-slate-50 p-2 rounded">
                              <strong className="text-slate-900">Admin Beállítások:</strong>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {role.permissions.admin_settings.view && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">👁️ Megtekintés</Badge>}
                                {role.permissions.admin_settings.create && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">➕ Létrehozás</Badge>}
                                {role.permissions.admin_settings.edit && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">✏️ Szerkesztés</Badge>}
                                {role.permissions.admin_settings.delete && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">🗑️ Törlés</Badge>}
                              </div>
                            </div>
                          )}
                        </div>
                        </AccordionContent>
                      </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-col">
                  <CardTitle className="text-left">Felhasználók Rangjai</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {usersList.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900">{user.full_name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {(() => {
                            const userRole = rolesList.find(r => r.name === user.custom_role);
                            const colorClasses = {
                              piros: 'bg-red-100 text-red-800 border-red-300',
                              kek: 'bg-blue-100 text-blue-800 border-blue-300',
                              zold: 'bg-green-100 text-green-800 border-green-300',
                              sarga: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                              lila: 'bg-purple-100 text-purple-800 border-purple-300'
                            };
                            return (
                              <Badge className={userRole?.color ? colorClasses[userRole.color] : 'bg-indigo-100 text-indigo-800'}>
                                {userRole?.display_name || user.custom_role || 'user'}
                              </Badge>
                            );
                          })()}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setRoleDialogOpen(user.id);
                              setSelectedRole(user.custom_role || 'user');
                            }}
                          >
                            Rang módosítása
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
                    </Tabs>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Szerepkör Szerkesztése' : 'Új Szerepkör'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRole} className="space-y-6 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Szerepkör azonosító (egyedi, kisbetűs)</Label>
                <Input 
                  value={newRoleName} 
                  onChange={(e) => setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="pl: moderator"
                  required
                  disabled={!!editingRole}
                />
              </div>
              <div className="grid gap-2">
                <Label>Megjelenítési név</Label>
                <Input 
                  value={newRoleDisplayName} 
                  onChange={(e) => setNewRoleDisplayName(e.target.value)}
                  placeholder="pl: Moderátor"
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
              <h3 className="font-semibold text-slate-900 border-b pb-2">Jogosultságok</h3>
              
              {['equipment', 'staff', 'tasks', 'admin_settings'].map(category => (
                <div key={category} className="border rounded-lg p-4 bg-slate-50">
                  <h4 className="font-medium text-slate-900 mb-3 capitalize">
                    {category === 'equipment' ? 'Leltár' :
                     category === 'staff' ? 'Személyzet' :
                     category === 'tasks' ? 'Feladatok' :
                     'Admin Beállítások'}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rolePermissions[category]?.view || false}
                        onChange={(e) => updatePermission(category, 'view', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">Megtekintés</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rolePermissions[category]?.create || false}
                        onChange={(e) => updatePermission(category, 'create', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">Létrehozás</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rolePermissions[category]?.edit || false}
                        onChange={(e) => updatePermission(category, 'edit', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">Szerkesztés</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rolePermissions[category]?.delete || false}
                        onChange={(e) => updatePermission(category, 'delete', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">Törlés</span>
                    </label>
                  </div>
                </div>
              ))}

              <div className="border rounded-lg p-4 bg-slate-50">
                <h4 className="font-medium text-slate-900 mb-3">Programok</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rolePermissions.programs?.view || false}
                      onChange={(e) => updatePermission('programs', 'view', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Megtekintés</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rolePermissions.programs?.create || false}
                      onChange={(e) => updatePermission('programs', 'create', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Létrehozás/Szerkesztés</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rolePermissions.programs?.delete || false}
                      onChange={(e) => updatePermission('programs', 'delete', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Törlés</span>
                  </label>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-slate-50">
                <h4 className="font-medium text-slate-900 mb-3">Chat</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rolePermissions.chat?.view || false}
                      onChange={(e) => updatePermission('chat', 'view', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Megtekintés</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rolePermissions.chat?.send || false}
                      onChange={(e) => updatePermission('chat', 'send', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Üzenet küldés</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Mégse
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                Mentés
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roleDialogOpen} onOpenChange={(open) => !open && setRoleDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rang Módosítása</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleChange} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label>Válassz szerepkört</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRoleDialogOpen(null)}>
                Mégse
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                Mentés
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!inviteDialogOpen} onOpenChange={(open) => !open && setInviteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Felhasználó Hozzárendelése</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label>Hozzárendelés típusa</Label>
              <Select value={assignmentMode} onValueChange={setAssignmentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Már regisztrált felhasználó</SelectItem>
                  <SelectItem value="new">Meghívó küldése új felhasználónak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {assignmentMode === 'existing' ? (
              <div className="grid gap-2">
                <Label>Válassz felhasználót</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Felhasználó kiválasztása..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usersList.filter(u => !staffList.some(s => s.login_email === u.email)).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Csak azok a felhasználók láthatók, akik még nincsenek hozzárendelve.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>E-mail cím</Label>
                  <Input 
                    type="email" 
                    value={inviteEmail} 
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required 
                    placeholder="pelda@email.com"
                  />
                  <p className="text-xs text-slate-500">
                    Erre az e-mail címre kap meghívót a felhasználó.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Jogosultsági Szint</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Felhasználó</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Admin: teljes hozzáférés. Felhasználó: korlátozott hozzáférés.
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(null)}>
                Mégse
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                {assignmentMode === 'existing' ? 'Hozzárendelés' : 'Meghívás Küldése'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}