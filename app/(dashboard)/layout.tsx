"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Mic2,
  Users,
  Box,
  MessageCircle,
  Menu,
  LogOut,
  User,
} from "lucide-react";
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
import { usePermissions } from "@/hooks/use-permissions";
import { useState } from "react";

const NAV_ITEMS = [
  { name: "Áttekintés", href: "/dashboard", icon: LayoutDashboard },
  { name: "Programok", href: "/programs", icon: CalendarDays },
  { name: "Feladatok", href: "/tasks", icon: Mic2 },
  { name: "Leltár", href: "/inventory", icon: Box },
  { name: "Személyzet", href: "/staff", icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { can, staff } = usePermissions();
  const [user, setUser] = useState<{
    email?: string;
    full_name?: string;
  } | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(
        u ? { email: u.email, full_name: u.user_metadata?.full_name } : null,
      );
      if (!u) router.replace("/auth/login");
      supabase
        .from("staff")
        .select("*")
        .eq("id", u!.id)
        .limit(1)
        .maybeSingle()
        .then((staff) => {
          if (!staff.data || !staff.data.active) handleLogout();
        });
    });
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/dashboard") return true;
    if (item.href === "/programs") return can("programs", "view");
    if (item.href === "/tasks") return can("tasks", "view");
    if (item.href === "/inventory") return can("equipment", "view");
    if (item.href === "/staff") return can("staff", "view");
    return true;
  });

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          StageManager
        </h1>
        <p className="text-xs text-slate-400 mt-1">Pro Audio & Event Soft</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname === "/" && item.href === "/dashboard");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
        {can("chat", "view") && (
          <Link
            href="/chat"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              pathname === "/chat"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Chat</span>
          </Link>
        )}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-4 py-2 w-full hover:bg-slate-800 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">
                  {staff?.name || "Felhasználó"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => setShowLogoutDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
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
            <AlertDialogTitle>
              Biztosan ki szeretnél jelentkezni?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A kijelentkezés után újra be kell jelentkezned a folytatáshoz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Kijelentkezés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-slate-50 flex">
        <div className="hidden md:block w-64 fixed inset-y-0 left-0 z-50">
          <NavContent />
        </div>

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

        <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all duration-300">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </>
  );
}
