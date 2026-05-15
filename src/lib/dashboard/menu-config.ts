import { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  PlusCircle,
  Settings,
  Users,
  Wallet
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const freelancerMenu: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/freelancer/jobs", icon: Briefcase },
  { label: "Proposals", href: "/dashboard/proposals", icon: FileText },
  { label: "Earnings", href: "/freelancer/earnings", icon: Wallet }
];

const clientMenu: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "New project", href: "/dashboard/projects/new", icon: PlusCircle },
  { label: "Payments", href: "/client/payments", icon: CreditCard }
];

const adminMenu: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reports", href: "/admin/reports", icon: LineChart },
  { label: "System Settings", href: "/admin/settings", icon: Settings }
];

const menus: Record<Role, DashboardNavItem[]> = {
  [Role.FREELANCER]: freelancerMenu,
  [Role.CLIENT]: clientMenu,
  [Role.ADMIN]: adminMenu
};

export function getMenuByRole(role: Role): DashboardNavItem[] {
  return menus[role] ?? clientMenu;
}
