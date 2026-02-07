import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, parse } from 'date-fns';

export default function ProgramSidebar({ 
  isOpen, 
  setIsOpen, 
  staffList, 
  editingProgram, 
  setEditingProgram,
  onSubmit,
  isLoading
}) {
  const [formStatus, setFormStatus] = useState('varakozo');
  const [formLeadStaff, setFormLeadStaff] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');

  React.useEffect(() => {
    if (editingProgram) {
      setFormStatus(editingProgram.status || 'varakozo');
      setFormLeadStaff(editingProgram.lead_staff_id || '');
      setFormDate(editingProgram.date ? format(new Date(editingProgram.date), 'dd/MM/yyyy') : '');
      setFormTime(editingProgram.time || '');
    } else {
      setFormStatus('varakozo');
      setFormLeadStaff('');
      setFormDate('');
      setFormTime('');
    }
  }, [editingProgram]);

  const formatDateInput = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const staff = staffList.find(s => s.id === formLeadStaff);
    
    if (!formDate) {
      alert('Kérlek add meg a dátumot!');
      return;
    }
    
    const dateFormatted = formDate.includes('/') 
      ? format(parse(formDate, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd')
      : formDate;
    
    const data = {
      title: formData.get('title') || '',
      date: dateFormatted,
      time: formTime || null,
      location: formData.get('location') || '',
      status: formStatus,
      description: formData.get('description') || '',
      lead_staff_id: formLeadStaff || null,
      lead_staff_name: staff ? staff.name : ''
    };

    onSubmit(data);
  };

  return (
    <div className="fixed right-0 top-20 md:right-0 md:top-0 md:pt-6 md:pr-4 z-40 md:z-0">
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if(!open) {
          setEditingProgram(null);
        }
      }}>
        <DialogTrigger asChild>
          <Button className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg md:shadow-md rounded-lg md:rounded-lg">
            <Plus className="w-4 h-4 mr-2" /> 
            <span className="hidden md:inline">Új Program</span>
            <span className="md:hidden">Új</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
              {editingProgram ? 'Program Szerkesztése' : 'Új Program Létrehozása'}
            </DialogTitle>
          </DialogHeader>
          <form key={editingProgram?.id || 'new'} onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label>Esemény Neve</Label>
              <Input name="title" defaultValue={editingProgram?.title} required placeholder="pl. Nyári Fesztivál Nagyszínpad" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Dátum</Label>
                  <Input 
                    type="text" 
                    name="date" 
                    value={formDate}
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    onChange={(e) => {
                      const formatted = formatDateInput(e.target.value);
                      setFormDate(formatted);
                    }}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Időpont</Label>
                  <Input 
                    type="time" 
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="óó:pp"
                  />
                </div>
            </div>
            <div className="grid gap-2">
              <Label>Státusz</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="varakozo">Várakozó</SelectItem>
                  <SelectItem value="tervezes">Tervezés</SelectItem>
                  <SelectItem value="proba_alatt">Próba alatt</SelectItem>
                  <SelectItem value="vegeleges">Végleges</SelectItem>
                  <SelectItem value="lezarva">Lezárva</SelectItem>
                  <SelectItem value="lemondva">Lemondva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Helyszín</Label>
              <Input name="location" defaultValue={editingProgram?.location} placeholder="pl. Művelődési Ház" />
            </div>
            <div className="grid gap-2">
              <Label>Felelős Személy (Lead)</Label>
              <Select value={formLeadStaff} onValueChange={setFormLeadStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz felelőst" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Leírás / Jegyzetek</Label>
              <Textarea name="description" defaultValue={editingProgram?.description} placeholder="Technikai igények, kontaktok..." />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Mégse</Button>
              <Button type="submit" className="bg-indigo-600 text-white" disabled={isLoading}>
                {isLoading ? 'Mentés...' : 'Mentés'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}