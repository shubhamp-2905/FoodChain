"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Truck,
  Brain,
  User,
  Settings,
  LogOut,
  Package,
  ChefHat,
  Menu,
  X,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { authService } from "@/services/auth.service";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { UserProfile } from "@/types/auth";

interface NavItem {
  href: string;
  icon: any;
  label: string;
  badge?: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/suppliers", icon: Truck, label: "Suppliers" },
  { href: "/recommendations", icon: Brain, label: "Recommendations" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/upcoming", icon: Sparkles, label: "Upcoming Features" },
];

function SidebarContent({
  user,
  pathname,
  onLogout,
  onClose,
}: {
  user: UserProfile | null;
  pathname: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="h-10 w-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-orange-500/25">
          <ChefHat className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">FoodChain AI</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Procurement Platform
          </p>
        </div>
      </div>

      <Separator className="mx-4" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href + item.label}
              href={item.disabled ? "#" : item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : item.disabled
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] px-1.5 py-0"
                >
                  {item.badge}
                </Badge>
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all w-full"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <Separator />

        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="gradient-orange text-white text-sm font-bold">
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.business_name || ""}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedUser = authService.getUser();
    const token = authService.getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setUser(storedUser);
  }, [router]);

  const handleLogout = () => {
    authService.removeToken();
    router.replace("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] border-r border-border bg-sidebar flex-col shrink-0">
        <SidebarContent
          user={user}
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Header + Sheet */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-orange flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">FoodChain AI</span>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-[280px] p-0">
              <SidebarContent
                user={user}
                pathname={pathname}
                onLogout={handleLogout}
                onClose={() => setIsOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-6 lg:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
