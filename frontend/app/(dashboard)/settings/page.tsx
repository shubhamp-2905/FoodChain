"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Moon, Sun, Shield, LogOut, Loader2, LineChart, Brain } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/providers/ThemeProvider";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "New password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "New passwords do not match",
    path: ["confirm_password"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Password changed successfully! ✅");
      reset();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Failed to change password. Please check your current password.";
      toast.error(errorMsg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-6 mx-auto px-2"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gradient-orange">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account security, theme preferences, and explore upcoming modules.
        </p>
      </div>

      {/* Appearance */}
      <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-popover rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold font-heading flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
            Appearance
          </CardTitle>
          <CardDescription className="text-xs">
            Customize the look and feel of your FoodChain AI dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Dark Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle between light and dark visual themes.
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-popover rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold font-heading flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account Security
          </CardTitle>
          <CardDescription className="text-xs">
            Update your account password to keep your business profile secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                placeholder="••••••••"
                className="h-10 border-slate-200 dark:border-slate-800 rounded-xl"
                {...register("current_password")}
              />
              {errors.current_password && (
                <p className="text-destructive text-xs mt-1">{errors.current_password.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="••••••••"
                  className="h-10 border-slate-200 dark:border-slate-800 rounded-xl"
                  {...register("new_password")}
                />
                {errors.new_password && (
                  <p className="text-destructive text-xs mt-1">{errors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  className="h-10 border-slate-200 dark:border-slate-800 rounded-xl"
                  {...register("confirm_password")}
                />
                {errors.confirm_password && (
                  <p className="text-destructive text-xs mt-1">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isChangingPassword}
              className="gradient-orange text-white hover:opacity-90 rounded-xl h-10 px-5 mt-2"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Future Intelligence Modules */}
      <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-popover rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold font-heading flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Intelligence Extensions
          </CardTitle>
          <CardDescription className="text-xs">
            Upcoming AI forecasting and predictive toolchains currently in training.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Card 1: AI Forecasting */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-dashed border-slate-250 dark:border-slate-800 bg-slate-50/20">
            <LineChart className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">AI Forecasting</h4>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Analyze historical order volumes and seasonality to generate automated smart purchase orders and forecast raw ingredient pricing fluctuations.
              </p>
            </div>
          </div>

          {/* Card 2: Inventory Intelligence */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-dashed border-slate-250 dark:border-slate-800 bg-slate-50/20">
            <Shield className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">Inventory Intelligence</h4>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your sales register to calculate minimum safety thresholds dynamically, triggering alerts when ingredients drop below minimum buffers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border border-red-100 dark:border-red-950/20 bg-red-50/10 rounded-2xl overflow-hidden shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm text-red-750 dark:text-red-300">Sign Out</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Securely log out of your FoodChain AI account.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="gap-2 rounded-xl h-10 px-4"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
