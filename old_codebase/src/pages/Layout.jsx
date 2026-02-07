
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Mic2, 
  Users, 
  Menu,
  X,
  Box,
  Lightbulb,
  LogOut,
  User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from '@/api/base44Client';
import FloatingChat from '@/components/FloatingChat';
import { usePermissions } from '@/components/usePermissions';

export default function Layout({ children }) {
  const location = useLocation();
  const { can } = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [showProfileDialog, setShowProfileDialog] = React.useState(false);
  const [uploadingPicture, setUploadingPicture] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error('Failed to fetch user', e);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPicture(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture: file_url });
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setShowProfileDialog(false);
    } catch (error) {
      console.error('Failed to upload profile picture', error);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    setUploadingPicture(true);
    try {
      await base44.auth.updateMe({ profile_picture: null });
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to delete profile picture', error);
    } finally {
      setUploadingPicture(false);
    }
  };



  const allNavigation = [
    { name: 'Áttekintés', href: 'Dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Programok', href: 'Programs', icon: CalendarDays, permission: { category: 'programs', action: 'view' } },
    { name: 'Feladatok', href: 'Tasks', icon: Mic2, permission: { category: 'tasks', action: 'view' } },
    { name: 'Leltár', href: 'Inventory', icon: Box, permission: { category: 'equipment', action: 'view' } },
    { name: 'Személyzet', href: 'Staff', icon: Users, permission: { category: 'staff', action: 'view' } },
  ];

  const navigation = allNavigation.filter(item => 
    !item.permission || can(item.permission.category, item.permission.action)
  );

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          StageManager
        </h1>
        <p className="text-xs text-slate-400 mt-1">Pro Audio & Event Soft</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === `/${item.href}` || (location.pathname === '/' && item.href === 'Dashboard');
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.href)}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-4 py-2 w-full hover:bg-slate-800 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{user?.full_name || 'Felhasználó'}</p>
                <p className="text-xs text-slate-500">{user?.email || ''}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
              <User className="w-4 h-4 mr-2" />
              Profilkép módosítása
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Kijelentkezés
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan ki szeretnél jelentkezni?</AlertDialogTitle>
            <AlertDialogDescription>
              A kijelentkezés után újra be kell jelentkezned a folytatáshoz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              Kijelentkezés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profilkép módosítása</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-slate-200">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-slate-400" />
                  )}
                </div>
                {user?.profile_picture && (
                  <button
                    onClick={handleDeleteProfilePicture}
                    disabled={uploadingPicture}
                    className="absolute top-0 right-0 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="w-full">
                <Label htmlFor="profile-picture-upload" className="mb-2 block">
                  Új profilkép feltöltése
                </Label>
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                  disabled={uploadingPicture}
                />
                <Button
                  type="button"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={uploadingPicture}
                  onClick={() => document.getElementById('profile-picture-upload')?.click()}
                >
                  {uploadingPicture ? 'Feltöltés...' : 'Kép kiválasztása'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      <div className="min-h-screen bg-slate-50 flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 fixed inset-y-0 left-0 z-50">
          <NavContent />
        </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 px-4 flex items-center justify-between border-b border-slate-800">
        <h1 className="text-lg font-bold text-white">StageManager</h1>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-slate-800">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all duration-300">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      </div>

      {/* Floating Chat */}
      {can('chat', 'view') && <FloatingChat />}
      </>
      );
      }
