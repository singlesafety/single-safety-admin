"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Package,
  FileCheck,
  Settings,
  Activity,
  MapPin,
} from "lucide-react";

const navigation = [
  {
    name: "개요",
    href: "/protected",
    icon: LayoutDashboard,
  },
  {
    name: "신청 관리",
    href: "/protected/applications",
    icon: FileCheck,
  },
  {
    name: "세이프 존 관리",
    href: "/protected/safezone",
    icon: MapPin,
  },
  {
    name: "제품 관리",
    href: "/protected/products",
    icon: Package,
  },
  {
    name: "설정",
    href: "/protected/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col fixed inset-y-0 z-50 bg-background border-r">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="font-semibold text-lg">Single Safety</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}