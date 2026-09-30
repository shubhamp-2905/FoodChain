"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Check,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supplierAccountService } from "@/services/supplier-account.service";
import { authService } from "@/services/auth.service";
import OnboardSupplierModal from "@/components/suppliers/OnboardSupplierModal";
import type { Product } from "@/types/supplier";
import type { InventoryCreatePayload } from "@/services/supplier-account.service";

const CATEGORIES = [
  "Vegetables",
  "Spices",
  "Grains",
  "Oils",
  "Dairy",
  "Grocery",
  "Other",
] as const;

const UNITS = ["kg", "g", "litre", "ml", "piece", "dozen", "packet"] as const;

const inventorySchema = z.object({
  ingredient: z.string().min(2, "Ingredient name is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  stock_available: z.coerce.number().int().min(0, "Stock cannot be negative"),
  minimum_order: z.coerce.number().int().min(1, "Minimum order must be at least 1"),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

function InventoryForm({
  onSuccess,
  onCancel,
  editItem,
}: {
  onSuccess: (item: Product, isEdit: boolean) => void;
  onCancel: () => void;
  editItem?: Product | null;
}) {
  const isEditing = !!editItem;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema) as any,
    defaultValues: editItem
      ? {
          ingredient: editItem.ingredient,
          category: editItem.category ?? "Vegetables",
          unit: editItem.unit ?? "kg",
          price: editItem.price,
          stock_available: editItem.stock_available,
          minimum_order: editItem.minimum_order,
        }
      : {
          category: "Vegetables",
          unit: "kg",
          minimum_order: 10,
          stock_available: 100,
        },
  });

  const onSubmit = async (data: InventoryFormData) => {
    setIsSubmitting(true);
    try {
      const payload: InventoryCreatePayload = {
        ingredient: data.ingredient,
        category: data.category,
        unit: data.unit,
        price: data.price,
        stock_available: data.stock_available,
        minimum_order: data.minimum_order,
      };

      let result: Product;
      if (isEditing && editItem) {
        result = await supplierAccountService.updateInventoryItem(
          editItem.id,
          payload
        );
        toast.success("Inventory item updated successfully.");
      } else {
        result = await supplierAccountService.addInventoryItem(payload);
        toast.success(`${data.ingredient} added to inventory.`);
      }
      onSuccess(result, isEditing);
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || "Failed to save inventory item."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-2 border-foreground/20 bg-background shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="h-4 w-4" />
              {isEditing ? "Edit Inventory Item" : "Add New Inventory Item"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update price, stock, and order details for this product."
              : "This product will be run through the Medallion data pipeline before becoming recommendation-eligible."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ingredient">
                  Ingredient / Product Name
                </Label>
                <Input
                  id="ingredient"
                  placeholder="e.g. Potato, Onion, Turmeric"
                  className="h-10"
                  disabled={isEditing}
                  {...register("ingredient")}
                />
                {errors.ingredient && (
                  <p className="text-destructive text-xs">
                    {errors.ingredient.message}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Ingredient name cannot be changed after creation.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  defaultValue={editItem?.category || "Vegetables"}
                  onValueChange={(v) => (setValue as any)("category", v)}
                >
                  <SelectTrigger id="category" className="h-10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-destructive text-xs">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 25.00"
                  className="h-10"
                  {...register("price")}
                />
                {errors.price && (
                  <p className="text-destructive text-xs">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  defaultValue={editItem?.unit || "kg"}
                  onValueChange={(v) => (setValue as any)("unit", v)}
                >
                  <SelectTrigger id="unit" className="h-10">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && (
                  <p className="text-destructive text-xs">
                    {errors.unit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_order">Min. Order</Label>
                <Input
                  id="minimum_order"
                  type="number"
                  placeholder="e.g. 10"
                  className="h-10"
                  {...register("minimum_order")}
                />
                {errors.minimum_order && (
                  <p className="text-destructive text-xs">
                    {errors.minimum_order.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_available">Stock Available (units)</Label>
              <Input
                id="stock_available"
                type="number"
                placeholder="e.g. 500"
                className="h-10 sm:max-w-[200px]"
                {...register("stock_available")}
              />
              {errors.stock_available && (
                <p className="text-destructive text-xs">
                  {errors.stock_available.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-foreground text-background hover:bg-foreground/90 gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isEditing ? "Save Changes" : "Add to Inventory"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SupplierInventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const loadInventory = () => {
    const user = authService.getUser();
    if (!user?.supplier_profile_id) {
      setProfileMissing(true);
      setLoading(false);
      return;
    }
    setProfileMissing(false);
    supplierAccountService
      .getMyInventory()
      .then(setInventory)
      .catch((err) => {
        if (err.response?.status === 404) {
          setProfileMissing(true);
          return;
        }
        console.error("Failed to load inventory:", err);
        toast.error("Failed to load inventory. Please refresh.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleOnboardSuccess = async () => {
    setLoading(true);
    setProfileMissing(false);
    try {
      const inv = await supplierAccountService.getMyInventory();
      setInventory(inv);
    } catch (err) {
      console.error("Failed to load inventory after onboarding:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = (item: Product, isEdit: boolean) => {
    if (isEdit) {
      setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    } else {
      setInventory((prev) => [...prev, item]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await supplierAccountService.deleteInventoryItem(id);
      setInventory((prev) => prev.filter((i) => i.id !== id));
      toast.success("Inventory item removed.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete item.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            Supplier Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Products you list here flow through the Medallion data pipeline and
            become visible to vendors in AI recommendation searches.
          </p>
        </div>
        {!showForm && (
          profileMissing ? (
            <Button
              onClick={() => setShowOnboardModal(true)}
              className="bg-foreground text-background hover:bg-foreground/90 flex items-center gap-2 h-10 px-5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Onboard Now
            </Button>
          ) : (
            <Button
              onClick={() => {
                setEditItem(null);
                setShowForm(true);
              }}
              className="bg-foreground text-background hover:bg-foreground/90 flex items-center gap-2 h-10 px-5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          )
        )}
      </div>

      {/* Onboarding Notice if unlinked */}
      {profileMissing && (
        <Card className="border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <AlertCircle className="h-8 w-8 text-amber-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200">
                Complete Supplier Onboarding
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                Your account is not yet linked to an active supplier profile. Complete
                onboarding with your business profile and initial offering to activate
                inventory management.
              </p>
            </div>
            <Button
              onClick={() => setShowOnboardModal(true)}
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0"
            >
              Onboard Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pipeline notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          All inventory additions and updates are validated through the
          Bronze → Silver → Gold Medallion pipeline before being persisted
          and becoming recommendation-eligible. Data that fails validation
          will be rejected with an error.
        </p>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(showForm || editItem) && (
          <InventoryForm
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditItem(null);
            }}
            editItem={editItem}
          />
        )}
      </AnimatePresence>

      {/* Inventory Table */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Listed Products
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              {inventory.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-4 border-b border-border last:border-0"
                >
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : profileMissing ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500/80 mb-4" />
              <h3 className="font-bold text-base">Onboarding Required</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Your supplier account is not yet linked to an active supplier profile.
                Complete onboarding with your business profile and initial offering to
                activate inventory management.
              </p>
              <Button
                onClick={() => setShowOnboardModal(true)}
                className="mt-4 bg-foreground text-background hover:bg-foreground/90 gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Complete Supplier Onboarding
              </Button>
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-bold text-base">No products listed</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Add your first product to begin appearing in vendor procurement
                searches.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-foreground text-background hover:bg-foreground/90 gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add First Product
              </Button>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <span className="col-span-4">Product</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-right">Stock</span>
                <span className="col-span-2 text-right">Min. Order</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              <AnimatePresence>
                {inventory.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-0 items-center hover:bg-muted/20 transition-colors"
                  >
                    <div className="col-span-4">
                      <p className="font-semibold text-sm">{item.ingredient}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="font-bold text-sm">₹{item.price}</p>
                      <p className="text-[10px] text-muted-foreground">/{item.unit}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="font-semibold text-sm">{item.stock_available}</p>
                      <p className="text-[10px] text-muted-foreground">units</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="font-semibold text-sm">{item.minimum_order}</p>
                      <p className="text-[10px] text-muted-foreground">min</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            No
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Yes, delete"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setShowForm(false);
                              setEditItem(item);
                            }}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmDeleteId(item.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboard Supplier Modal */}
      <OnboardSupplierModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSuccess={handleOnboardSuccess}
      />
    </div>
  );
}
