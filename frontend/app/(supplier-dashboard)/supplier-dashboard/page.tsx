"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  TrendingUp,
  MapPin,
  Star,
  Clock,
  ArrowRight,
  AlertCircle,
  Plus,
  BarChart3,
  Truck,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/auth.service";
import { supplierAccountService } from "@/services/supplier-account.service";
import OnboardSupplierModal from "@/components/suppliers/OnboardSupplierModal";
import type { UserProfile } from "@/types/auth";
import type { Supplier, Product } from "@/types/supplier";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function SupplierDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<Supplier | null>(null);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  const fetchDashboardData = async () => {
    const storedUser = authService.getUser();
    setUser(storedUser);

    if (!storedUser?.supplier_profile_id) {
      setProfileMissing(true);
      setLoading(false);
      return;
    }

    setProfileMissing(false);
    try {
      const [prof, inv] = await Promise.all([
        supplierAccountService.getMyProfile(),
        supplierAccountService.getMyInventory(),
      ]);
      setProfile(prof);
      setInventory(inv);
    } catch (err: any) {
      console.error("Error loading supplier data:", err);
      if (err.response?.status === 404) {
        setProfileMissing(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOnboardSuccess = async () => {
    setLoading(true);
    await fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Supplier Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {getGreeting()},{" "}
              <span className="text-primary">
                {user?.full_name?.split(" ")[0] || "Supplier"}
              </span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your inventory, track your listings, and stay
              recommendation-eligible.
            </p>
        </div>
        {profileMissing ? (
          <Button
            onClick={() => setShowOnboardModal(true)}
            className="bg-foreground text-background hover:bg-foreground/90 flex items-center gap-2 h-10 px-5"
          >
            <Plus className="h-4 w-4" />
            Onboard Now
          </Button>
        ) : (
          <Link href="/supplier-dashboard/inventory">
            <Button className="bg-foreground text-background hover:bg-foreground/90 flex items-center gap-2 h-10 px-5">
              <Plus className="h-4 w-4" />
              Add Inventory
            </Button>
          </Link>
        )}
      </div>
    </motion.div>

    {/* Onboarding Notice */}
    {!loading && profileMissing && (
      <motion.div variants={itemVariants}>
        <Card className="border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <AlertCircle className="h-8 w-8 text-amber-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200">
                Complete Supplier Onboarding
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                Your account is not yet linked to a supplier profile. You need
                to complete onboarding to list products and become
                recommendation-eligible for vendors.
              </p>
            </div>
            <Button
              onClick={() => setShowOnboardModal(true)}
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0"
            >
              Onboard Now
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )}

      {/* Stats Grid */}
      {!profileMissing && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Products Listed
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black">
                      {loading ? "—" : inventory.length}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Active
                    </Badge>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-foreground/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Rating
                  </p>
                  <div className="flex items-baseline gap-2">
                    {loading || !profile ? (
                      <span className="text-2xl font-black">—</span>
                    ) : profile.rating != null ? (
                      <>
                        <span className="text-2xl font-black">{profile.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">/ 5.0</span>
                      </>
                    ) : (
                      <span className="text-base font-semibold text-muted-foreground">Not rated</span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Delivery Radius
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black">
                      {loading || !profile ? "—" : profile.delivery_radius_km}
                    </span>
                    <span className="text-[10px] text-muted-foreground">km</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Avg Delivery
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black">
                      {loading || !profile ? "—" : profile.average_delivery_time_min}
                    </span>
                    <span className="text-[10px] text-muted-foreground">min</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Profile & Inventory Preview */}
      {!profileMissing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="border border-border shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Supplier Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading || !profile ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Supplier Name</p>
                      <p className="font-bold text-sm mt-0.5">{profile.supplier_name}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Type</p>
                      <p className="font-semibold text-sm mt-0.5">{profile.supplier_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Market</p>
                      <p className="font-semibold text-sm mt-0.5">{profile.market}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Location</p>
                      <p className="font-semibold text-sm mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {profile.area}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Quality Score</p>
                      <p className="font-semibold text-sm mt-0.5">
                        {profile.quality_score != null
                          ? `${profile.quality_score.toFixed(1)} / 5.0`
                          : "Not available"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Reliability</p>
                      <p className="font-semibold text-sm mt-0.5">
                        {profile.reliability_score != null
                          ? `${profile.reliability_score.toFixed(1)}%`
                          : "Not available"}
                      </p>
                    </div>
                    <Separator />
                    <Link
                      href="/supplier-dashboard/profile"
                      className="flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View full profile
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Inventory Preview */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border border-border shadow-sm h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Current Inventory
                </CardTitle>
                <Link href="/supplier-dashboard/inventory">
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                    Manage All
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="font-semibold text-sm">No inventory listed yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Add your first product to become visible to vendor
                      recommendation searches.
                    </p>
                    <Link href="/supplier-dashboard/inventory" className="mt-4">
                      <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Add First Product
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inventory.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50"
                      >
                        <div>
                          <p className="font-semibold text-sm">{item.ingredient}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="font-bold text-sm">
                              ₹{item.price}{" "}
                              <span className="font-normal text-muted-foreground text-xs">
                                /{item.unit}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Stock</p>
                            <p className="font-bold text-sm">{item.stock_available}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {inventory.length > 6 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{inventory.length - 6} more items
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Onboard Supplier Modal */}
      <OnboardSupplierModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSuccess={handleOnboardSuccess}
      />
    </motion.div>
  );
}
