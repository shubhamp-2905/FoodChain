"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Package,
  Brain,
  Search,
  MapPin,
  Clock,
  ArrowRight,
  Compass,
  Store,
  History,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/auth.service";
import { supplierService } from "@/services/supplier.service";
import type { UserProfile } from "@/types/auth";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supplierCount, setSupplierCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // 1. Fetch current profile
    const profile = authService.getUser();
    setUser(profile);

    // 2. Fetch statistics from API
    Promise.all([
      supplierService.getSuppliers({ limit: 1 }).then(res => setSupplierCount(res.total)),
      supplierService.getProducts().then(res => setProductCount(res.length))
    ])
      .catch(err => console.error("Error fetching stats:", err))
      .finally(() => setLoadingStats(false));

    // 3. Load recent searches
    const cached = localStorage.getItem("recent_recommendation_searches");
    if (cached) {
      setRecentSearches(JSON.parse(cached));
    }
  }, []);

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
      className="space-y-6 max-w-7xl mx-auto px-2"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading leading-tight">
            {getGreeting()},{" "}
            <span className="text-gradient-orange">
              {user?.full_name?.split(" ")[0] || "Vendor"}
            </span>{" "}
            👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back! Here is a summary of your food supply chain dashboard today.
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Suppliers Card */}
        <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-popover">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Total Suppliers
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-heading">
                    {loadingStats ? "..." : supplierCount}
                  </span>
                  <span className="text-[10px] text-green-500 font-bold bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-popover">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Ingredients Available
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-heading">
                    {loadingStats ? "..." : productCount}
                  </span>
                  <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded-full">
                    Catalog
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-md shadow-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation Searches */}
        <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-popover">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Searches Saved
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-heading">
                    {recentSearches.length}
                  </span>
                  <span className="text-[10px] text-purple-500 font-bold bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded-full">
                    History
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-md shadow-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <History className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-popover">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Engine Status
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-heading text-emerald-600 dark:text-emerald-400">
                    Ready
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full">
                    KMeans
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid: Business Profile Details & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vendor Location Info */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold font-heading">
                Vendor Profile & Current Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">Business Name</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {user?.business_name || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">Food Type Category</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {user?.food_type || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">Registered Area</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                    {user?.area || "N/A"}, {user?.city || "Pune"}, {user?.state || "Maharashtra"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">GPS Coordinates</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                    {user?.latitude && user?.longitude
                      ? `${user.latitude.toFixed(4)}° N, ${user.longitude.toFixed(4)}° E`
                      : "No coordinates enabled"}
                  </p>
                </div>
              </div>
              
              <Separator className="my-2 bg-slate-100 dark:bg-slate-800" />
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Coordinates missing or incorrect?</span>
                <Link href="/profile" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  Update location in Profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Search Widget */}
          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold font-heading flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Recent Search Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentSearches.length === 0 ? (
                <div className="text-center py-6">
                  <Compass className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No recent search history. Try querying an ingredient!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <Link
                      key={item}
                      href="/recommendations"
                      className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-350 px-3.5 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-200 hover:text-orange-600 transition-all flex items-center gap-1.5"
                    >
                      <History className="h-3 w-3" /> {item}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Quick Action Cards */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Quick Actions</h3>

          {/* Action 1: Find Suppliers */}
          <Link href="/recommendations" className="block group">
            <Card className="border border-slate-100 dark:border-slate-800 bg-popover hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all duration-300 overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                    Find Suppliers
                  </h4>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">
                    Search, filter, and discover raw material offerings.
                  </p>
                </div>
                <div className="h-9 w-9 bg-slate-50 group-hover:bg-orange-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-center transition-colors">
                  <Compass className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Action 2: AI Recommendations */}
          <Link href="/recommendations" className="block group">
            <Card className="border border-slate-100 dark:border-slate-800 bg-popover hover:border-purple-200 dark:hover:border-purple-900/50 hover:shadow-md transition-all duration-300 overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors">
                    AI Recommendations
                  </h4>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">
                    KMeans optimized cluster mapping based on business parameters.
                  </p>
                </div>
                <div className="h-9 w-9 bg-slate-50 group-hover:bg-purple-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-center transition-colors">
                  <Brain className="h-4 w-4 text-slate-500 group-hover:text-purple-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Action 3: Supplier Directory */}
          <Link href="/suppliers" className="block group">
            <Card className="border border-slate-100 dark:border-slate-800 bg-popover hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md transition-all duration-300 overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                    Supplier Directory
                  </h4>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">
                    Browse the complete registered food supplier catalog.
                  </p>
                </div>
                <div className="h-9 w-9 bg-slate-50 group-hover:bg-blue-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-center transition-colors">
                  <Truck className="h-4 w-4 text-slate-500 group-hover:text-blue-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Action 4: Inventory (Coming Soon) */}
          <div className="cursor-not-allowed opacity-75">
            <Card className="border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-500">
                      Inventory Intelligence
                    </h4>
                    <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-slate-200 dark:border-slate-800 text-slate-400">
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">
                    Track safety stocks and automate procurement triggers.
                  </p>
                </div>
                <div className="h-9 w-9 bg-slate-100 dark:bg-slate-900/10 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-slate-350" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
