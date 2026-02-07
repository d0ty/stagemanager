import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/usePermissions';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parse } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Edit, Trash2, User, Calendar, MapPin, Search, MoreVertical, History, LayoutDashboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProgramSidebar from '@/components/ProgramSidebar';

export default function Programs() {
  const { can } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProgram, setEditingProgram] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list('date'),
    initialData: []
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: []
  });

  const { data: equipments } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list(),
    initialData: []
  });

  const { data: activeLoans } = useQuery({
    queryKey: ['equipment-loans'],
    queryFn: () => base44.entities.EquipmentLoan.filter({ status: 'aktiv' }),
    initialData: []
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Program.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['programs']);
      setIsOpen(false);
      setEditingProgram(null);
    },
    onError: (error) => {
      console.error('Create error:', error);
      alert('Hiba: ' + (error.message || 'Ismeretlen hiba'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Program.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['programs']);
      setIsOpen(false);
      setEditingProgram(null);
    },
    onError: (error) => {
      console.error('Update error:', error);
      alert('Hiba: ' + (error.message || 'Ismeretlen hiba'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Program.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['programs'])
  });

  const handleProgramSubmit = (data) => {
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredPrograms = programs.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {can('programs', 'create') && (
        <ProgramSidebar 
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          staffList={staffList}
          editingProgram={editingProgram}
          setEditingProgram={setEditingProgram}
          onSubmit={handleProgramSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
      
      <div className="space-y-8 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Programok</h1>
          <p className="text-slate-500">Rendezvények kezelése és felelősök kijelölése</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            className="pl-10 w-full md:w-80 bg-white" 
            placeholder="Keresés program vagy helyszín szerint..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-8">
          {/* Aktuális Programok */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> Aktuális Programok
            </h2>
            <div className="grid gap-4">
              {filteredPrograms.filter(p => ['varakozo', 'tervezes', 'proba_alatt', 'vegeleges'].includes(p.status)).map((program) => (
                <Link key={program.id} to={`${createPageUrl('ProgramDetails')}?id=${program.id}`}>
                  <Card className={`overflow-hidden hover:shadow-md transition-shadow border-l-4 cursor-pointer ${
                      program.status === 'varakozo' ? 'border-l-slate-300' : 'border-l-indigo-500'
                  }`}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center p-6 gap-4">
                        <Link to={`${createPageUrl('ProgramDetails')}?id=${program.id}`} className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer">
                          <span className="text-xs uppercase font-bold">{program.date ? format(new Date(program.date), 'MMM', { locale: hu }) : '-'}</span>
                          <span className="text-xl font-bold">{program.date ? format(new Date(program.date), 'd') : '-'}</span>
                        </Link>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link to={`${createPageUrl('ProgramDetails')}?id=${program.id}`}>
                              <h3 className="text-xl font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer">{program.title}</h3>
                            </Link>
                            <Badge variant="secondary" className={
                              program.status === 'vegeleges' ? 'bg-emerald-100 text-emerald-800' :
                              program.status === 'proba_alatt' ? 'bg-purple-100 text-purple-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {program.status === 'proba_alatt' ? 'Próba alatt' : 
                               program.status === 'vegeleges' ? 'Végleges' : 
                               program.status === 'varakozo' ? 'Várakozó' : 'Tervezés'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {program.date ? format(new Date(program.date), 'dd/MM/yyyy') : '-'}
                              {program.time && <span className="ml-1 font-medium">{program.time}</span>}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {program.location || 'Nincs megadva'}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" /> {program.lead_staff_name || 'Nincs felelős'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`${createPageUrl('ProgramDetails')}?id=${program.id}`}>
                                  <LayoutDashboard className="w-4 h-4 mr-2" /> Program Dashboard
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingProgram(program);
                                setIsOpen(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" /> Szerkesztés
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => {
                                if(confirm('Biztosan törlöd ezt a programot?')) deleteMutation.mutate(program.id);
                              }}>
                                <Trash2 className="w-4 h-4 mr-2" /> Törlés
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {filteredPrograms.filter(p => ['varakozo', 'tervezes', 'proba_alatt', 'vegeleges'].includes(p.status)).length === 0 && (
                <div className="text-center py-8 text-slate-400 italic">Nincs aktuális program.</div>
              )}
              </div>
              </div>

              {/* Archív Programok */}
              <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 opacity-75">
              <History className="w-5 h-5" /> Archív / Lezárt
              </h2>
              <div className="grid gap-4 opacity-75">
              {filteredPrograms.filter(p => ['lezarva', 'lemondva'].includes(p.status)).map((program) => (
                <Link key={program.id} to={`${createPageUrl('ProgramDetails')}?id=${program.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow bg-slate-50 cursor-pointer">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center p-6 gap-4">
                        <div className="flex items-center gap-2 md:order-first" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem asChild>
                                <Link to={`${createPageUrl('ProgramDetails')}?id=${program.id}`}>
                                  <LayoutDashboard className="w-4 h-4 mr-2" /> Program Dashboard
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingProgram(program);
                                setIsOpen(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" /> Szerkesztés
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => {
                                if(confirm('Biztosan törlöd ezt a programot?')) deleteMutation.mutate(program.id);
                              }}>
                                <Trash2 className="w-4 h-4 mr-2" /> Törlés
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <Link to={`${createPageUrl('ProgramDetails')}?id=${program.id}`} className="flex-shrink-0 w-16 h-16 bg-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors cursor-pointer">
                          <span className="text-xs uppercase font-bold">{program.date ? format(new Date(program.date), 'MMM', { locale: hu }) : '-'}</span>
                          <span className="text-xl font-bold">{program.date ? format(new Date(program.date), 'd') : '-'}</span>
                        </Link>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link to={`${createPageUrl('ProgramDetails')}?id=${program.id}`}>
                              <h3 className="text-xl font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer">{program.title}</h3>
                            </Link>
                            <Badge variant="outline" className={
                              program.status === 'lemondva' ? 'border-red-200 text-red-700 bg-red-50' : 'border-slate-300'
                            }>
                              {program.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {program.date ? format(new Date(program.date), 'dd/MM/yyyy') : '-'}
                              {program.time && <span className="ml-1 font-medium">{program.time}</span>}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {program.location || 'Nincs megadva'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`${createPageUrl('ProgramDetails')}?id=${program.id}`}>
                                  <LayoutDashboard className="w-4 h-4 mr-2" /> Program Dashboard
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingProgram(program);
                                setIsOpen(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" /> Szerkesztés
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => {
                                if(confirm('Biztosan törlöd ezt a programot?')) deleteMutation.mutate(program.id);
                              }}>
                                <Trash2 className="w-4 h-4 mr-2" /> Törlés
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {filteredPrograms.filter(p => ['lezarva', 'lemondva'].includes(p.status)).length === 0 && (
                <div className="text-center py-4 text-slate-400 text-sm italic">Nincs archív program.</div>
              )}
              </div>
              </div>
              </div>
              </div>
              </>
              );
              }