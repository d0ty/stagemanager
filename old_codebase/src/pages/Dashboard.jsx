import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { 
  CalendarDays, 
  MapPin, 
  User, 
  ArrowRight,
  Box,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  // Programs Query
  const { data: programs, isLoading: isProgramsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list('date', 5),
    initialData: []
  });

  // Active Loans Query (for Inventory Overview)
  const { data: loans, isLoading: isLoansLoading } = useQuery({
    queryKey: ['equipment-loans'],
    queryFn: () => base44.entities.EquipmentLoan.filter({ status: 'aktiv' }),
    initialData: []
  });

  const upcomingPrograms = programs.filter(p => p.status !== 'lezart' && p.status !== 'lemondva');
  
  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Áttekintés</h1>
          <p className="text-slate-500">Üdvözöllek a StageManagerben!</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('Programs')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <CalendarDays className="w-4 h-4 mr-2" /> Programok Kezelése
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Aktív Programok</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">
                {upcomingPrograms.length}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Kiadott Eszközök</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {loans.length}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-full">
              <Box className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Rendszer Állapot</p>
              <p className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Online
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-full">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Programs */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Következő Események</CardTitle>
            <Link to={createPageUrl('Programs')} className="text-sm text-indigo-600 hover:underline flex items-center">
              Összes <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {isProgramsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="p-4 flex gap-4 animate-pulse">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : upcomingPrograms.length > 0 ? (
                upcomingPrograms.map((program) => (
                    <Link key={program.id} to={`${createPageUrl('ProgramDetails')}?id=${program.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-700 font-bold text-sm">
                          <span className="text-xs uppercase">{format(new Date(program.date), 'MMM', { locale: hu })}</span>
                          <span>{format(new Date(program.date), 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">{program.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" /> {program.location || 'Nincs helyszín'}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <User className="w-3 h-3" /> {program.lead_staff_name || '-'}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className={
                          program.status === 'vegeleges' ? 'bg-emerald-100 text-emerald-800 whitespace-nowrap' : 'bg-amber-100 text-amber-800 whitespace-nowrap'
                        }>
                          {program.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Nincsenek közelgő események.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Loan Status */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kiadott Eszközök</CardTitle>
            <Link to={createPageUrl('Inventory')} className="text-sm text-indigo-600 hover:underline flex items-center">
              Raktár <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {isLoansLoading ? (
                 Array(3).fill(0).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : loans.length > 0 ? (
                loans.slice(0, 5).map((loan) => (
                  <div key={loan.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-full">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{loan.equipment_name}</p>
                        <p className="text-xs text-slate-500">
                          {loan.staff_name} • {loan.taken_at ? format(new Date(loan.taken_at), 'dd/MM/yyyy HH:mm') : '-'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Kiadva
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-200" />
                  <p>Minden eszköz a raktárban.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}