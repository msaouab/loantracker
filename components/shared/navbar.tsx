"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CircleCheck,
  History,
  Landmark,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeMenuItems } from "@/components/shared/theme-toggle";
import { APP_NAME } from "@/lib/app-config";
import { cn } from "@/lib/utils";

const managerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loans", label: "Loans", icon: Receipt },
  { href: "/loans/recovered", label: "Recovered", icon: CircleCheck },
];

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: ShieldCheck },
  { href: "/admin/activity", label: "Activity", icon: History },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/loans") {
    return (
      pathname === "/loans" ||
      (pathname.startsWith("/loans/") && !pathname.startsWith("/loans/recovered"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function Navbar({
  userName,
  isAdmin = false,
}: {
  userName?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const displayName = userName?.trim() || "Account";
  const initials = getInitials(displayName);
  const items = isAdmin ? adminNavItems : managerNavItems;
  const homeHref = isAdmin ? "/admin/dashboard" : "/dashboard";
  const settingsHref = isAdmin ? "/admin/settings" : "/settings";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        <Link
          href={homeHref}
          className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/25 sm:h-9 sm:w-9">
            <Landmark className="h-4 w-4" />
          </div>
          <span className="hidden text-base font-semibold tracking-tight sm:inline">
            {APP_NAME}
          </span>
        </Link>

        <nav className="absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-lg border border-border/70 bg-muted/50 p-0.5 sm:gap-1 sm:p-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all sm:px-3",
                  active
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-1.5 sm:gap-2">
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              className="size-8 rounded-full border-0 text-xs font-semibold tracking-tight shadow-sm shadow-primary/25 sm:size-9 sm:text-sm"
              aria-label={`${displayName} account menu`}
            >
              <span aria-hidden="true">{initials}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="px-2 py-2 text-sm font-normal text-muted-foreground">
              <span className="block truncate">{displayName}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={settingsHref}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeMenuItems />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
