
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  ClipboardList,
  FilePieChart,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/types";

type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  // Admin Specific
  { href: "/portal/admin/dashboard", icon: <BarChart3 className="h-4 w-4" />, label: "Overview", roles: ["Admin"] },
  { href: "/portal/admin/students", icon: <Users className="h-4 w-4" />, label: "Student Roster", roles: ["Admin"] },
  { href: "/portal/admin/assessments", icon: <ClipboardList className="h-4 w-4" />, label: "Test Management", roles: ["Admin"] },
  { href: "/portal/admin/reports", icon: <FileText className="h-4 w-4" />, label: "AI Reports & Analytics", roles: ["Admin"] },
  { href: "/portal/admin/identity", icon: <ShieldCheck className="h-4 w-4" />, label: "Identity Mgmt", roles: ["Admin"] },
  
  // B2C / Student Specific
  { href: "/portal/b2c/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard", roles: ["B2C"] },
  { href: "/portal/test-engine", icon: <ClipboardList className="h-4 w-4" />, label: "Take Test", roles: ["B2C", "Student"] },
  
  // Settings (All)
  { href: "/portal/settings", icon: <Settings className="h-4 w-4" />, label: "School Settings", roles: ["Admin"] },
  { href: "/portal/settings", icon: <Settings className="h-4 w-4" />, label: "Settings", roles: ["B2C", "Student", "Teacher", "Parent"] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  if (!user) return null;

  const userNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <nav className="flex flex-col gap-2 px-2">
      {userNavItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/portal/admin/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
