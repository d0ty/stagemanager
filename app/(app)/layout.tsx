"use server";

import React, { Suspense } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Mic2,
  Users,
  Menu,
  X,
  Box,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { UserField } from "@/components/user-field";
import { ThemeProvider } from "@/components/theme";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleProfilePictureUpload = async (e) => {
    // TODO!
    alert("Not yet migrated!");
  };

  const handleDeleteProfilePicture = async () => {
    alert("Not yet migrated!");
  };

  const allNavigation = [
    {
      name: "Áttekintés",
      href: "/",
      icon: LayoutDashboard,
      permission: null,
    },
    {
      name: "Programok",
      href: "/programs",
      icon: CalendarDays,
      permission: { category: "programs", action: "view" },
    },
    {
      name: "Feladatok",
      href: "/tasks",
      icon: Mic2,
      permission: { category: "tasks", action: "view" },
    },
    {
      name: "Leltár",
      href: "/inventory",
      icon: Box,
      permission: { category: "equipment", action: "view" },
    },
    {
      name: "Személyzet",
      href: "/staff",
      icon: Users,
      permission: { category: "staff", action: "view" },
    },
  ];

  const navigation = allNavigation; /*.filter(
    (item) =>
      !item.permission || can(item.permission.category, item.permission.action),
  )*/

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
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                false
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <UserField />
      </div>
    </div>
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 fixed inset-y-0 left-0 z-50">
          <NavContent />
        </div>

        {/* Mobile Header */}

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all duration-300">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </ThemeProvider>
  );
}
