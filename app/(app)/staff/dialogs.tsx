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
