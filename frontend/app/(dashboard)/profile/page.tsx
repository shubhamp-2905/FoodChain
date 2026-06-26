"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Save, MapPin, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import type { UserProfile } from "@/types/auth";

const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  mobile_number: z.string().min(10).max(15),
  business_name: z.string().min(2).max(150),
  food_type: z.string().min(1),
  area: z.string().min(1, "Area is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { latitude, longitude, isLoading: locationLoading, requestLocation } = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const stored = authService.getUser();
    if (stored) {
      setUser(stored);
      reset({
        full_name: stored.full_name,
        mobile_number: stored.mobile_number,
        business_name: stored.business_name,
        food_type: stored.food_type,
        area: stored.area || "",
        city: stored.city || "",
        state: stored.state || "",
      });
    }
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const updated = await authService.updateProfile({
        ...data,
        latitude: latitude || user?.latitude || undefined,
        longitude: longitude || user?.longitude || undefined,
      });
      authService.setUser(updated);
      setUser(updated);
      toast.success("Profile updated successfully! ✅");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your vendor profile information
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" className="h-10" {...register("full_name")} />
                {errors.full_name && <p className="text-destructive text-xs">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="h-10 bg-muted/50" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input id="mobile_number" className="h-10" {...register("mobile_number")} />
                {errors.mobile_number && <p className="text-destructive text-xs">{errors.mobile_number.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input id="business_name" className="h-10" {...register("business_name")} />
                {errors.business_name && <p className="text-destructive text-xs">{errors.business_name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="food_type">Food Type</Label>
              <Select
                defaultValue={user?.food_type}
                onValueChange={(value) => setValue("food_type", value as string)}
              >
                <SelectTrigger id="food_type" className="h-10">
                  <SelectValue placeholder="Select food type" />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Select
                  defaultValue={user?.area || ""}
                  onValueChange={(value) => setValue("area", value as string)}
                >
                  <SelectTrigger id="area" className="h-10">
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((areaName) => (
                      <SelectItem key={areaName} value={areaName}>{areaName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.area && <p className="text-destructive text-xs">{errors.area.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" className="h-10" {...register("city")} />
                {errors.city && <p className="text-destructive text-xs">{errors.city.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" className="h-10" {...register("state")} />
                {errors.state && <p className="text-destructive text-xs">{errors.state.message}</p>}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {user?.latitude && user?.longitude ? (
                  <p className="text-sm">
                    📍 {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Location not set</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={requestLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Update Location"
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="gradient-orange text-white hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
