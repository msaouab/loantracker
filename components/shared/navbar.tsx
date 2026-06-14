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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { APP_NAME } from "@/lib/app-config";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loans", label: "Loans", icon: Receipt },
  { href: "/loans/recovered", label: "Recovered", icon: CircleCheck },
];

const adminNavItems = [
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

export function Navbar({
  userName,
  isAdmin = false,
}: {
  userName?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6 md:gap-10">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/25 sm:h-9 sm:w-9">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="hidden text-base font-semibold tracking-tight sm:inline">
              {APP_NAME}
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/50 p-0.5 sm:gap-1 sm:p-1">
            {navItems.map((item) => {
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
            {isAdmin
              ? adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all sm:px-3",
                        isItemActive(pathname, item.href)
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })
              : null}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="max-w-26 border-border/70 bg-background/80 px-2.5 sm:max-w-none sm:px-4"
            >
              <span className="truncate">{userName ?? "Account"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
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
