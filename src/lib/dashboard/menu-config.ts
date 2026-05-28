import { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  CreditCard,
  FileSignature,
  FileText,
  FolderKanban,
  Gavel,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  PlusCircle,
  Settings,
  User,
  Shield,
  Star,
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
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Job board", href: "/jobs", icon: Briefcase },
  { label: "My applications", href: "/dashboard/jobs/applications", icon: FileText },
  { label: "Saved jobs", href: "/dashboard/jobs/saved", icon: Bookmark },
  { label: "Proposals", href: "/dashboard/proposals", icon: FileText },
  { label: "Contracts", href: "/dashboard/contracts", icon: FileSignature },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Earnings", href: "/freelancer/earnings", icon: Wallet },
  { label: "Upgrade plan", href: "/dashboard/settings/plan", icon: LineChart }
];

const clientMenu: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "New project", href: "/dashboard/projects/new", icon: PlusCircle },
  { label: "My jobs", href: "/dashboard/jobs", icon: Briefcase },
  { label: "Post a job", href: "/dashboard/jobs/new", icon: PlusCircle },
  { label: "Saved jobs", href: "/dashboard/jobs/saved", icon: FileText },
  { label: "Contracts", href: "/dashboard/contracts", icon: FileSignature },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Payments", href: "/client/payments", icon: CreditCard }
];
const adminMenu: DashboardNavItem[] = [
  { label: "Admin home", href: "/admin", icon: Shield },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { label: "Moderation", href: "/admin/moderation", icon: AlertTriangle },
  { label: "Disputes", href: "/admin/disputes", icon: Gavel },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
  { label: "Reports", href: "/admin/reports", icon: LineChart },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Marketing", href: "/admin/marketing", icon: LineChart },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Contacts", href: "/admin/contacts", icon: Users }
];

const menus: Record<Role, DashboardNavItem[]> = {
  [Role.FREELANCER]: freelancerMenu,
  [Role.CLIENT]: clientMenu,
  [Role.ADMIN]: adminMenu
};

export function getMenuByRole(role: Role): DashboardNavItem[] {
  return menus[role] ?? clientMenu;
}
