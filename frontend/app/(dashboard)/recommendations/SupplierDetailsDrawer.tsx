"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Truck, Shield, Package, MapPin, Sparkles } from "lucide-react";
import type { SupplierRecommendation } from "@/types/recommendation";

interface SupplierDetailsDrawerProps {
  supplier: SupplierRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SupplierDetailsDrawer({
  supplier,
  isOpen,
  onClose,
}: SupplierDetailsDrawerProps) {
  if (!supplier) return null;

  const stockStatus =
    supplier.stock_available > supplier.minimum_order * 5
      ? { label: "In Stock", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" }
      : supplier.stock_available > 0
      ? { label: "Low Stock", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" }
      : { label: "Out of Stock", color: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto w-full max-w-md p-6 h-full flex flex-col justify-start">
        <SheetHeader className="p-0 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${stockStatus.color} px-2.5 py-0.5 border-0 rounded-full font-medium text-xs`}>
              {stockStatus.label}
            </Badge>
            <Badge className="gradient-purple text-white px-2.5 py-0.5 border-0 rounded-full font-medium text-xs">
              Cluster {supplier.cluster}
            </Badge>
          </div>
          <SheetTitle className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-slate-50 leading-tight">
            {supplier.supplier_name}
          </SheetTitle>
          <SheetDescription className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-1.5 mt-1">
            <MapPin className="h-4 w-4 text-slate-400" /> {supplier.area} &bull; {supplier.supplier_type}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 flex-1 pr-1">
          {/* Main Stats Card */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <CardContent className="p-4 flex flex-col justify-center items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Price</span>
                <span className="text-xl font-bold font-heading text-primary">
                  ₹{supplier.price.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">per {supplier.unit}</span>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <CardContent className="p-4 flex flex-col justify-center items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Match Score</span>
                <span className="text-xl font-bold font-heading text-orange-600 dark:text-orange-400">
                  {supplier.match_score}%
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{supplier.confidence} Match</span>
              </CardContent>
            </Card>
          </div>

          {/* Supplier Metrics */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Performance Metrics</h4>
            
            {/* Rating */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Rating</span>
                <span>{supplier.rating.toFixed(1)} / 5.0</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(supplier.rating / 5.0) * 100}%` }}></div>
              </div>
            </div>

            {/* Quality Score */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-blue-500" /> Quality Score</span>
                <span>{supplier.quality_score.toFixed(1)} / 5.0</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(supplier.quality_score / 5.0) * 100}%` }}></div>
              </div>
            </div>

            {/* Reliability Score */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-emerald-500" /> Reliability Score</span>
                <span>{supplier.reliability_score}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${supplier.reliability_score}%` }}></div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100 dark:bg-slate-800" />

          {/* Delivery & Logistics */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Logistics & Availability</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium">Distance</span>
                <p className="font-bold text-sm">{supplier.distance_km.toFixed(2)} km</p>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium">Avg Delivery Time</span>
                <p className="font-bold text-sm">{supplier.delivery_time} mins</p>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium">Min Order Quantity</span>
                <p className="font-bold text-sm">{supplier.minimum_order} {supplier.unit}</p>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg space-y-1">
                <span className="text-muted-foreground font-medium">Stock Available</span>
                <p className="font-bold text-sm">{supplier.stock_available} {supplier.unit}</p>
              </div>
            </div>
          </div>

          {/* Recommendation Reason */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl">
            <CardContent className="p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">AI Rationale</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {supplier.reason}
              </p>
            </CardContent>
          </Card>

          {/* AI Insights Card Placeholder */}
          <Card className="border border-purple-100 dark:border-purple-950/50 bg-purple-50/20 dark:bg-purple-950/10 rounded-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-16 w-16 bg-purple-500/10 rounded-bl-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
            </div>
            <CardContent className="p-4 space-y-2">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">AI Predictive Insight</span>
              <h5 className="font-bold text-xs text-purple-950 dark:text-purple-200">Price & Supply Forecast (Phase 3)</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Coming soon: Machine learning time-series models will predict seasonal pricing shifts and stock exhaustion rates to recommend buy-timings.
              </p>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
