"use server";

import {
  Plus,
  User,
  Phone,
  Mail,
  Trash2,
  Edit,
  UserPlus,
  CheckCircle,
  Shield,
} from "lucide-react";
import { StaffEditor } from "./client";
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
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function StaffPage() {
  return (
    <Suspense>
      <Staff />
    </Suspense>
  );
}

async function Staff() {
  const supabase = await createClient();

  const { data: staffList, error } = await supabase.from("staff_data").select();

  if (error) {
    redirect("/404");
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Személyzet</h1>
          <p className="text-slate-500">Technikusok és szervezők kezelése</p>
        </div>
        <StaffEditor>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Új Tag
          </Button>
        </StaffEditor>
      </div>
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="staff">Személyzet</TabsTrigger>
          <TabsTrigger value="admin">Admin Beállítások</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              return (
                <StaffEditor data={staff} key={staff.id}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 overflow-hidden">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-col gap-1">
                              <h3 className="font-bold text-slate-900">
                                {staff.name}
                              </h3>
                              {/*user?.custom_role && (() => {
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
                        })()*/}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(staff.role || [staff.role || "egyeb"]).map(
                                (role) => (
                                  <Badge
                                    key={role}
                                    variant="secondary"
                                    className="capitalize text-xs"
                                  >
                                    {role}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 space-y-2">
                        {staff.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {staff.phone}
                          </div>
                        )}
                        {staff.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {staff.email}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </StaffEditor>
              );
            })}
            {staffList.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed rounded-lg">
                Nincs rögzített személyzet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* && (
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
                            //const userRole = rolesList.find(r => r.name === user.custom_role);
                            const colorClasses = {
                              piros: 'bg-red-100 text-red-800 border-red-300',
                              kek: 'bg-blue-100 text-blue-800 border-blue-300',
                              zold: 'bg-green-100 text-green-800 border-green-300',
                              sarga: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                              lila: 'bg-purple-100 text-purple-800 border-purple-300'
                            };
                            return (
                              <Badge /*className={userRole?.color ? colorClasses[userRole.color] : 'bg-indigo-100 text-indigo-800'}>
                                {/*userRole?.display_name || user.custom_role || 'user' } Role
                              </Badge>
                            );
                          })()}
                          <Button
                            variant="outline"
                            size="sm"
                            /*onClick={() => {
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
          ) */}
      </Tabs>
    </div>
  );
}
