"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { ROLE_LABELS, ROLE_PERMISSIONS, type UserRole } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";
import {
  LayoutDashboard, Users, BarChart3, Settings, LogOut, Menu, X, BookOpen, UserCog, UserCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: keyof typeof ROLE_PERMISSIONS[UserRole];
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/santri", label: "Data Santri", icon: Users, permission: "canManageStudents" },
  { href: "/admin/users", label: "Kelola Pengguna", icon: UserCog, permission: "canManageUsers" },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3, roles: ["admin", "piket", "wali_kelas", "guru_wali"] },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings, permission: "canAccessSettings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const logout = useAppStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    toast.success("Berhasil keluar");
    router.push("/");
  };

  const hasAccess = (item: NavItem) => {
    if (!user) return false;
    if (item.roles && !item.roles.includes(user.role)) return false;
    if (item.permission) return ROLE_PERMISSIONS[user.role]?.[item.permission] ?? false;
    return true;
  };

  const visibleNav = navItems.filter(hasAccess);
  const roleInfo = user ? ROLE_LABELS[user.role] : null;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-emerald-800 text-white transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-emerald-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Absensi Sholat</h2>
                <p className="text-emerald-300 text-xs">{process.env.NEXT_PUBLIC_SCHOOL_NAME || "Pesantren"}</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-emerald-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-lg">{roleInfo?.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <Badge variant="outline" className="text-[10px] text-emerald-200 border-emerald-500 mt-0.5">
                  {roleInfo?.label}
                </Badge>
              </div>
            </div>
            {user.assignedClass && (
              <p className="text-[10px] text-emerald-300 mt-2 ml-12">Kelas: {user.assignedClass}</p>
            )}
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-emerald-700 text-white" : "text-emerald-200 hover:bg-emerald-700/50 hover:text-white"}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-emerald-700">
            <Button variant="ghost" className="w-full justify-start text-emerald-200 hover:bg-emerald-700/50 hover:text-white" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-3" />Keluar
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">
            {visibleNav.find((n) => n.href === pathname)?.label || "Admin"}
          </h1>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
