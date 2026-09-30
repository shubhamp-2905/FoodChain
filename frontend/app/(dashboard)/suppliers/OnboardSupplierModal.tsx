"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlusCircle, CheckCircle2, AlertCircle, Building2, Package, Truck, Sparkles } from "lucide-react";
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
  const [area, setArea] = useState(AREAS[0] || "Market Yard");
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
      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      const detail = err.response?.data?.detail || "Failed to onboard supplier through data pipeline.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-popover border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-8 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl gradient-orange flex items-center justify-center text-white shadow-md">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    Onboard New Supplier
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Operational data ingestion validated through Bronze → Silver → Gold pipeline.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Supplier Identity */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Supplier Business Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Supplier Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Pune Wholesale Mandi"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Supplier Type</Label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-xs">Market Location</Label>
                    <Input
                      placeholder="e.g. Gultekdi Market Yard"
                      value={market}
                      onChange={(e) => setMarket(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Area</Label>
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
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Initial Inventory Offering
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Ingredient Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Potato, Tomato"
                      value={ingredient}
                      onChange={(e) => setIngredient(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
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
                    <Label className="text-xs">Price (₹ per unit) *</Label>
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

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Stock Available</Label>
                    <Input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Min Order</Label>
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
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Delivery Operations
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Delivery Radius (km)</Label>
                    <Input
                      type="number"
                      value={deliveryRadius}
                      onChange={(e) => setDeliveryRadius(e.target.value)}
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Avg Delivery Time (mins)</Label>
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="gradient-orange text-white text-xs rounded-xl px-5 flex items-center gap-1.5 shadow-md"
                >
                  {loading ? (
                    "Ingesting into Pipeline..."
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Onboard Supplier
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
