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
import {
  Star,
  Truck,
  Shield,
  Package,
  MapPin,
  Sparkles,
  Info,
  Scale,
  Brain,
  CheckCircle2,
} from "lucide-react";
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
      ? {
          label: "In Stock",
          color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        }
      : supplier.stock_available > 0
      ? {
          label: "Low Stock",
          color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
        }
      : {
          label: "Out of Stock",
          color: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
        };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto w-full max-w-md p-6 h-full flex flex-col justify-start">
        <SheetHeader className="p-0 mb-5">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge
              className={`${stockStatus.color} px-2.5 py-0.5 border-0 rounded-full font-medium text-xs`}
            >
              {stockStatus.label}
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-xs px-2.5 py-0.5 rounded-full"
            >
              Supplier ID: {supplier.supplier_id}
            </Badge>
          </div>

          <SheetTitle className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-slate-50 leading-tight">
            {supplier.supplier_name}
          </SheetTitle>
          <SheetDescription className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-1.5 mt-1">
            <MapPin className="h-4 w-4 text-slate-400" /> {supplier.area} &bull; {supplier.supplier_type}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 flex-1 pr-1">
          {/* Two-Branch Architecture Callout Cards */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-orange-500" />
              Two-Branch Recommendation Architecture
            </div>

            {/* Branch B: Business Ranking Decision */}
            <Card className="border border-orange-200 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/70 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 shadow-sm rounded-xl">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                      <Scale className="h-3 w-3" /> Branch B: Deterministic Decision
                    </span>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      Business Match Score
                    </h5>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-heading text-orange-600 dark:text-orange-400 leading-none">
                      {supplier.match_score}%
                    </span>
                    <span className="block text-[9px] text-muted-foreground font-semibold uppercase">
                      {supplier.confidence} Match
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Solely dictates recommendation rank based on normalized business weights: Distance (35%), Price (25%), Rating (15%), Quality (10%), Reliability (10%), Delivery (5%).
                </p>
              </CardContent>
            </Card>

            {/* Branch A: ML Behavioral Segmentation Context */}
            <Card className="border border-purple-200 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/70 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/10 shadow-sm rounded-xl">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Brain className="h-3 w-3" /> Branch A: ML Contextual Cohort
                    </span>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      {supplier.cluster_label || `Cluster ${supplier.cluster}`}
                    </h5>
                  </div>
                  <Badge className="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[10px] border-0">
                    Cohort #{supplier.cluster}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {supplier.cluster_desc ||
                    "K-Means behavioral segmentation cohort. Categorizes supplier operational characteristics (does NOT determine recommendation ranking)."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Deterministic Explanation Card */}
          <Card className="border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm rounded-xl">
            <CardContent className="p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Grounded Explanation (Phase 9 Deterministic)
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
                &ldquo;{supplier.reason}&rdquo;
              </p>
            </CardContent>
          </Card>

          {/* Key Verified Operational Metrics Grid */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Verified Pipeline Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Unit Price</span>
                <p className="font-bold text-base text-primary mt-0.5">
                  ₹{supplier.price.toFixed(2)}
                  <span className="text-[10px] text-muted-foreground font-normal"> /{supplier.unit}</span>
                </p>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Distance</span>
                <p className="font-bold text-base mt-0.5">{supplier.distance_km.toFixed(2)} km</p>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Fulfillment Speed</span>
                <p className="font-bold text-base mt-0.5">{supplier.delivery_time} mins</p>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Stock Available</span>
                <p className="font-bold text-base mt-0.5">
                  {supplier.stock_available}{" "}
                  <span className="text-[10px] text-muted-foreground font-normal">{supplier.unit}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Quality & Reliability Bars */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Quality & Reputation
            </h4>

            {/* Rating */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Supplier Rating
                </span>
                <span>{supplier.rating != null ? `${supplier.rating.toFixed(1)} / 5.0` : "Not rated"}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: supplier.rating != null ? `${(supplier.rating / 5.0) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Quality Score */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-blue-500" /> Quality Score
                </span>
                <span>{supplier.quality_score != null ? `${supplier.quality_score.toFixed(1)} / 5.0` : "Not available"}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: supplier.quality_score != null ? `${(supplier.quality_score / 5.0) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Reliability Score */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-emerald-500" /> Reliability Score
                </span>
                <span>{supplier.reliability_score != null ? `${supplier.reliability_score}%` : "Not available"}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: supplier.reliability_score != null ? `${supplier.reliability_score}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
