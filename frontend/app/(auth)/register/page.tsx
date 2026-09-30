"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  UserPlus,
  Link2,
  MapPin,
  Loader2,
  Store,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authService } from "@/services/auth.service";
import { useLocation } from "@/hooks/useLocation";
import { FOOD_TYPES } from "@/types/auth";
import { AREAS } from "@/types/supplier";

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile_number: z
    .string()
    .min(10, "Enter a valid mobile number")
    .max(15, "Enter a valid mobile number"),
  business_name: z
    .string()
    .min(2, "Business / company name must be at least 2 characters"),
  role: z.enum(["vendor", "supplier"]),
  food_type: z.string().optional(),
  area: z.string().min(1, "Please select an area"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"vendor" | "supplier">("vendor");

  const {
    latitude,
    longitude,
    isLoading: locationLoading,
    error: locationError,
    requestLocation,
  } = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "vendor",
      city: "Pune",
      state: "Maharashtra",
    },
  });

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handleRoleChange = (newRole: "vendor" | "supplier") => {
    setRole(newRole);
    setValue("role", newRole);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.register({
        ...data,
        food_type: data.food_type ?? "Other",
        latitude,
        longitude,
      });
      authService.setToken(response.access_token);
      authService.setUser(response.user);
      toast.success("Account created successfully.");
      // Role-based redirect
      if (response.user.role === "supplier") {
        router.push("/supplier-dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isSupplier = role === "supplier";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-foreground relative items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-background max-w-md"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Link2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-background">FoodChain AI</h1>
              <p className="text-xs text-background/50 uppercase tracking-widest">Procurement Platform</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight mb-6 text-background">
            Join the food supply chain network
          </h2>
          <p className="text-base text-background/60 leading-relaxed mb-10">
            Register as a street food vendor to find suppliers, or as a raw
            material supplier to list your products and reach more buyers.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background/5 border border-background/10">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-background">Street Food Vendor</p>
                <p className="text-xs text-background/50 mt-0.5">
                  Search suppliers, get ML recommendations, compare prices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background/5 border border-background/10">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-background">Raw Material Supplier</p>
                <p className="text-xs text-background/50 mt-0.5">
                  List your inventory, manage stock, become recommendation-eligible
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full lg:w-7/12 items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="h-9 w-9 rounded-lg bg-foreground flex items-center justify-center">
              <Link2 className="h-5 w-5 text-background" />
            </div>
            <span className="text-xl font-bold">FoodChain AI</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Choose your role and complete the form below
            </p>
          </div>

          {/* Role Toggle */}
          <div className="mb-6">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 block">
              I am registering as
            </Label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
              <button
                type="button"
                id="role-vendor"
                onClick={() => handleRoleChange("vendor")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  role === "vendor"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Store className="h-4 w-4" />
                Street Food Vendor
              </button>
              <button
                type="button"
                id="role-supplier"
                onClick={() => handleRoleChange("supplier")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  role === "supplier"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Package className="h-4 w-4" />
                Raw Material Supplier
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("role")} value={role} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Rahul Sharma"
                  className="h-10"
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-destructive text-xs">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-10"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-destructive text-xs">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    className="h-10 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  placeholder="9876543210"
                  className="h-10"
                  {...register("mobile_number")}
                />
                {errors.mobile_number && (
                  <p className="text-destructive text-xs">{errors.mobile_number.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">
                  {isSupplier ? "Company / Business Name" : "Business Name"}
                </Label>
                <Input
                  id="business_name"
                  placeholder={isSupplier ? "Sharma Agro Traders" : "Rahul's Vada Pav"}
                  className="h-10"
                  {...register("business_name")}
                />
                {errors.business_name && (
                  <p className="text-destructive text-xs">{errors.business_name.message}</p>
                )}
              </div>

              {!isSupplier ? (
                <div className="space-y-2">
                  <Label htmlFor="food_type">Food Type</Label>
                  <Select
                    onValueChange={(value) => (setValue as any)("food_type", value)}
                  >
                    <SelectTrigger id="food_type" className="h-10">
                      <SelectValue placeholder="Select food type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOOD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {"food_type" in errors && errors.food_type && (
                    <p className="text-destructive text-xs">
                      {(errors as any).food_type?.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="area">Operating Area</Label>
                  <Select
                    onValueChange={(value) => (setValue as any)("area", value)}
                  >
                    <SelectTrigger id="area" className="h-10">
                      <SelectValue placeholder="Select Area" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((areaName) => (
                        <SelectItem key={areaName} value={areaName}>
                          {areaName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.area && (
                    <p className="text-destructive text-xs">{errors.area.message}</p>
                  )}
                </div>
              )}
            </div>

            {!isSupplier && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area-vendor">Area</Label>
                  <Select
                    onValueChange={(value) => (setValue as any)("area", value)}
                  >
                    <SelectTrigger id="area-vendor" className="h-10">
                      <SelectValue placeholder="Select Area" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((areaName) => (
                        <SelectItem key={areaName} value={areaName}>
                          {areaName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.area && (
                    <p className="text-destructive text-xs">{errors.area.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Pune"
                    className="h-10"
                    {...register("city")}
                  />
                  {errors.city && (
                    <p className="text-destructive text-xs">{errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Maharashtra"
                    className="h-10"
                    {...register("state")}
                  />
                  {errors.state && (
                    <p className="text-destructive text-xs">{errors.state.message}</p>
                  )}
                </div>
              </div>
            )}

            {isSupplier && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-sup">City</Label>
                  <Input
                    id="city-sup"
                    placeholder="Pune"
                    className="h-10"
                    {...register("city")}
                  />
                  {errors.city && (
                    <p className="text-destructive text-xs">{errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state-sup">State</Label>
                  <Input
                    id="state-sup"
                    placeholder="Maharashtra"
                    className="h-10"
                    {...register("state")}
                  />
                  {errors.state && (
                    <p className="text-destructive text-xs">{errors.state.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Location Status */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              {locationLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Detecting location...
                </div>
              ) : latitude && longitude ? (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Location detected ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                </p>
              ) : (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {locationError || "Location not detected"}
                  </p>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="text-xs text-foreground hover:underline mt-0.5"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {isSupplier ? "Register as Supplier" : "Register as Vendor"}
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
