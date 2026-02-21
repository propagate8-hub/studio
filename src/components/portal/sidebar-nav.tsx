"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquareQuote,
  Users,
  CreditCard,
  Settings,
  BookCopy,
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
  { href: "/portal/admin/dashboard", icon: <LayoutDashboard />, label: "Dashboard", roles: ["Admin"] },
  { href: "/portal/b2c/dashboard", icon: <LayoutDashboard />, label: "Dashboard", roles: ["B2C"] },
  { href: "/portal/test-engine", icon: <FileText />, label: "Take Test", roles: ["B2C", "Student"] },
  { href: "/portal/surveys", icon: <MessageSquareQuote />, label: "Surveys", roles: ["Parent", "Student", "Teacher"] },
  { href: "/portal/admin/identity", icon: <Users />, label: "Identity Mgmt", roles: ["Admin"] },
  { href: "/portal/admin/assessments", icon: <BookCopy />, label: "Assessments", roles: ["Admin"] },
  { href: "/portal/admin/billing", icon: <CreditCard />, label: "Billing", roles: ["Admin"] },
  { href: "/portal/settings", icon: <Settings />, label: "Settings", roles: ["Admin", "B2C", "Student", "Teacher", "Parent"] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  if (!user) return null;

  const userNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <nav className="flex flex-col gap-2 px-2">
      {userNavItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
