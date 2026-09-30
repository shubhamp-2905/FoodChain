"use client";

import { motion } from "framer-motion";
import { Settings, Moon, Sun, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/providers/ThemeProvider";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";

export default function SupplierSettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    authService.removeToken();
    router.replace("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
          Supplier Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your appearance and account preferences.
        </p>
      </div>

      {/* Appearance */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Color Theme</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Currently using{" "}
                <span className="font-semibold capitalize">{theme}</span> mode
              </p>
            </div>
            <Button
              variant="outline"
              onClick={toggleTheme}
              className="gap-2 h-10"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  Switch to Light
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Switch to Dark
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Sign Out</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You will be redirected to the login page.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 h-10 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
