'use client';

import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Trophy, 
  HelpCircle, 
  Clock, 
  MessageSquare, 
  Bell, 
  Settings,
  FileQuestion,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const menuItems = [
  { label: "Dashboard", icon: Home, href: "/admindashboard" },
  { label: "Registered Users", icon: Users, href: "/admindashboard/users" },
  { label: "Competitions", icon: Trophy, href: "/admindashboard/competitions" },
  { label: "Questions", icon: FileQuestion, href: "/admindashboard/question" },
  { label: "Payouts", icon: DollarSign, href: "/admindashboard/payout" },
  { label: "Support", icon: HelpCircle, href: "/admindashboard/support" },
  { label: "Notification", icon: Bell, href: "/admindashboard/notification" },
  { label: "Settings", icon: Settings, href: "/admindashboard/settings" },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  // Normalize pathname to remove trailing slashes
  const normalizedPathname = pathname?.replace(/\/$/, '') || '/';

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        // Check if the current pathname matches or starts with the item href
        const isActive = normalizedPathname === item.href ||
                         (item.href !== '/admindashboard' && normalizedPathname.startsWith(item.href));

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={clsx(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
              isActive ? "bg-lime-400 text-black" : "text-gray-300 hover:bg-[#1f2a3c] hover:text-white"
            )}
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}