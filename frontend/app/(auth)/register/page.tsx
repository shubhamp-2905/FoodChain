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
  ChefHat,
  MapPin,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    .min(2, "Business name must be at least 2 characters"),
  food_type: z.string().min(1, "Please select a food type"),
  area: z.string().min(1, "Please select an area"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { latitude, longitude, isLoading: locationLoading, error: locationError, requestLocation } = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      city: "Pune",
      state: "Maharashtra",
    },
  });

  // Auto-request location on page load
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.register({
        ...data,
        latitude,
        longitude,
      });
      authService.setToken(response.access_token);
      authService.setUser(response.user);
      toast.success("Account created! Welcome to FoodChain AI 🚀");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-5/12 gradient-orange relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-black/10" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-white max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">FoodChain AI</h1>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-6">
            Join thousands of vendors optimizing their procurement
          </h2>
          <p className="text-lg text-white/80 leading-relaxed">
            Register in seconds and start finding the best suppliers near you.
            We&apos;ll use your location to show nearby options.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "🔍 Find nearby suppliers instantly",
              "💰 Compare prices across vendors",
              "⭐ Check quality ratings & reviews",
              "🤖 AI-powered recommendations (coming soon)",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white/90">
                <span className="text-base">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="flex w-full lg:w-7/12 items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="h-10 w-10 rounded-xl gradient-orange flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">FoodChain AI</span>
          </div>

          <Card className="border-0 shadow-xl shadow-black/5">
            <CardHeader className="pb-4">
              <h2 className="text-2xl font-bold">Create Your Account</h2>
              <p className="text-muted-foreground text-sm">
                Set up your vendor profile to get started
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      <p className="text-destructive text-xs">
                        {errors.full_name.message}
                      </p>
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
                      <p className="text-destructive text-xs">
                        {errors.email.message}
                      </p>
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
                      <p className="text-destructive text-xs">
                        {errors.password.message}
                      </p>
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
                      <p className="text-destructive text-xs">
                        {errors.mobile_number.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      placeholder="Rahul's Vada Pav"
                      className="h-10"
                      {...register("business_name")}
                    />
                    {errors.business_name && (
                      <p className="text-destructive text-xs">
                        {errors.business_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="food_type">Food Type</Label>
                    <Select
                      onValueChange={(value) => setValue("food_type", value as string)}
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
                    {errors.food_type && (
                      <p className="text-destructive text-xs">
                        {errors.food_type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Select
                      onValueChange={(value) => setValue("area", value as string)}
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
                      <p className="text-destructive text-xs">
                        {errors.area.message}
                      </p>
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
                      <p className="text-destructive text-xs">
                        {errors.city.message}
                      </p>
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
                      <p className="text-destructive text-xs">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location Status */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  {locationLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Detecting your location...
                    </div>
                  ) : latitude && longitude ? (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      📍 Location detected ({latitude.toFixed(4)},{" "}
                      {longitude.toFixed(4)})
                    </p>
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {locationError || "Location not set"}
                      </p>
                      <button
                        type="button"
                        onClick={requestLocation}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 gradient-orange text-white font-medium hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
