"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Building2, Package, Truck, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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
import { supplierService } from "@/services/supplier.service";
import { authService } from "@/services/auth.service";
import { AREAS, SUPPLIER_TYPES } from "@/types/supplier";

interface OnboardSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSupplier: any) => void;
}

const CATEGORIES = [
  "Vegetables",
  "Dairy",
  "Spices",
  "Oils & Fats",
  "Grains & Flour",
  "Bakery",
  "Sauces & Condiments",
];

export default function OnboardSupplierModal({
  isOpen,
  onClose,
  onSuccess,
}: OnboardSupplierModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [supplierName, setSupplierName] = useState("");
  const [supplierType, setSupplierType] = useState("Wholesaler");
  const [market, setMarket] = useState("Gultekdi Market Yard");
  const [area, setArea] = useState<string>(AREAS[0] || "Market Yard");
  const [latitude, setLatitude] = useState("18.4900");
  const [longitude, setLongitude] = useState("73.8600");

  // Product Offering State
  const [ingredient, setIngredient] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState("500");
  const [minOrder, setMinOrder] = useState("10");

  // Operational Specs
  const [deliveryRadius, setDeliveryRadius] = useState("15");
  const [deliveryTime, setDeliveryTime] = useState("35");

  useEffect(() => {
    if (isOpen) {
      const user = authService.getUser();
      if (user) {
        if (!supplierName) {
          setSupplierName(user.business_name || user.full_name || "");
        }
        if (user.area && (AREAS as readonly string[]).includes(user.area)) {
          setArea(user.area);
        }
      }
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !ingredient.trim() || !price) {
      setError("Please fill in supplier name, ingredient, and price.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      supplier_name: supplierName.trim(),
      supplier_type: supplierType,
      market: market.trim(),
      area: area,
      latitude: parseFloat(latitude) || 18.4900,
      longitude: parseFloat(longitude) || 73.8600,
      delivery_radius_km: parseFloat(deliveryRadius) || 15.0,
      average_delivery_time_min: parseInt(deliveryTime, 10) || 35,
      ingredient: ingredient.trim(),
      category: category,
      price: parseFloat(price),
      unit: unit.trim() || "kg",
      stock_available: parseInt(stock, 10) || 500,
      minimum_order: parseInt(minOrder, 10) || 10,
    };

    try {
      const created = await supplierService.onboardSupplier(payload);

      // Refresh current user profile so localStorage reflects new supplier_profile_id
      try {
        const freshProfile = await authService.getProfile();
        authService.setUser(freshProfile);
      } catch (profileErr) {
        console.warn("Could not refresh user profile in storage:", profileErr);
      }

      toast.success("Supplier profile created and onboarded!");
      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      const detail =
        err.response?.data?.detail ||
        "Failed to onboard supplier through data pipeline.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 my-8 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-snug">
                    Complete Supplier Onboarding
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ingested and verified via Bronze → Silver → Gold Medallion pipeline.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Supplier Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Supplier Business Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Supplier / Business Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Pune Wholesale Mandi"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Supplier Type</Label>
                    <Select value={supplierType} onValueChange={(v) => v && setSupplierType(v)}>
                      <SelectTrigger className="h-9 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPLIER_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Market Location</Label>
                    <Input
                      placeholder="e.g. Gultekdi Market Yard"
                      value={market}
                      onChange={(e) => setMarket(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Area / Hub</Label>
                    <Select value={area} onValueChange={(v) => v && setArea(v)}>
                      <SelectTrigger className="h-9 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((a) => (
                          <SelectItem key={a} value={a} className="text-xs">
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Initial Product Offering */}
              <div className="space-y-3 pt-3 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Initial Product Offering
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Ingredient / Product *</Label>
                    <Input
                      required
                      placeholder="e.g. Potato, Tomato"
                      value={ingredient}
                      onChange={(e) => setIngredient(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Category</Label>
                    <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                      <SelectTrigger className="h-9 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Price (₹ per unit) *</Label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      min="0.1"
                      placeholder="e.g. 24.50"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Unit</Label>
                    <Input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Stock Available</Label>
                    <Input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Min Order</Label>
                    <Input
                      type="number"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Operations */}
              <div className="space-y-3 pt-3 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Delivery Operations
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Delivery Radius (km)</Label>
                    <Input
                      type="number"
                      value={deliveryRadius}
                      onChange={(e) => setDeliveryRadius(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Avg. Delivery Time (mins)</Label>
                    <Input
                      type="number"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="bg-foreground text-background hover:bg-foreground/90 text-xs px-5 flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Validating Pipeline...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Complete Onboarding
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
