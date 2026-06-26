"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  Truck,
  ChevronRight,
  SlidersHorizontal,
  Inbox
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supplierService } from "@/services/supplier.service";
import { authService } from "@/services/auth.service";
import type { UserProfile } from "@/types/auth";
import type { SupplierRecommendation } from "@/types/recommendation";
import { AREAS, SUPPLIER_TYPES } from "@/types/supplier";
import SupplierDetailsDrawer from "../recommendations/SupplierDetailsDrawer";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

// Client-side Haversine distance calculator
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState<string>("");
  const [supplierType, setSupplierType] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "distance">("rating");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [rawSuppliers, setRawSuppliers] = useState<any[]>([]);
  const [productOfferings, setProductOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Details drawer states
  const [drawerSupplier, setDrawerSupplier] = useState<SupplierRecommendation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load User, Ingredients, and initial Suppliers
  useEffect(() => {
    setUser(authService.getUser());

    supplierService.getIngredients()
      .then((data) => setIngredients(data))
      .catch((err) => console.error("Error fetching ingredients:", err));

    // Fetch a large block of suppliers to filter and sort locally
    supplierService.getSuppliers({ page: 1, limit: 300 })
      .then((res) => {
        setRawSuppliers(res.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading suppliers:", err);
        setLoading(false);
      });
  }, []);

  // Fetch product offerings if product filter is applied
  useEffect(() => {
    if (selectedProduct) {
      supplierService.getProducts({ search: selectedProduct })
        .then((offerings) => setProductOfferings(offerings))
        .catch((err) => console.error("Error fetching product offerings:", err));
    } else {
      setProductOfferings([]);
    }
    setPage(1);
  }, [selectedProduct]);

  const clearFilters = () => {
    setSearch("");
    setArea("");
    setSupplierType("");
    setSelectedProduct("");
    setSortBy("rating");
    setPage(1);
  };

  const handleOpenDetails = async (supplierId: number) => {
    setLoadingDetails(true);
    try {
      // 1. Get detailed supplier model (with its product inventory items)
      const detail = await supplierService.getSupplier(supplierId);
      
      // Calculate distance
      const lat = user?.latitude ?? 18.5204;
      const lon = user?.longitude ?? 73.8567;
      const dist = calculateDistance(lat, lon, detail.latitude, detail.longitude);

      // Find if this supplier offers the currently selected product
      const matchingProduct = detail.products?.find(
        (p) => p.ingredient.toLowerCase() === selectedProduct.toLowerCase()
      );
      
      const price = matchingProduct?.price ?? (detail.products?.[0]?.price ?? 0);
      const unit = matchingProduct?.unit ?? (detail.products?.[0]?.unit ?? "kg");
      const stock = matchingProduct?.stock_available ?? (detail.products?.[0]?.stock_available ?? 0);
      const minOrder = matchingProduct?.minimum_order ?? (detail.products?.[0]?.minimum_order ?? 1);
      const ingredient = matchingProduct?.ingredient ?? (detail.products?.[0]?.ingredient ?? "");
      const category = matchingProduct?.category ?? (detail.products?.[0]?.category ?? "");

      // 2. Map to unified SupplierRecommendation interface
      const mapped: SupplierRecommendation = {
        id: detail.id,
        supplier_id: detail.supplier_id,
        supplier_name: detail.supplier_name,
        supplier_type: detail.supplier_type,
        market: detail.market,
        area: detail.area,
        latitude: detail.latitude,
        longitude: detail.longitude,
        ingredient: ingredient,
        category: category,
        price: price,
        unit: unit,
        stock_available: stock,
        minimum_order: minOrder,
        quality_score: detail.quality_score,
        rating: detail.rating,
        reliability_score: detail.reliability_score,
        delivery_radius_km: detail.delivery_radius_km,
        distance_km: dist,
        cluster: 0, // Placeholder
        recommendation_score: 0.0, // Placeholder
        delivery_time: detail.average_delivery_time_min,
        match_score: Math.round(detail.rating * 20), // Proxy match score
        confidence: detail.rating >= 4.5 ? "High" : detail.rating >= 3.5 ? "Medium" : "Low",
        reason: `Supplier from ${detail.area} with rating ${detail.rating.toFixed(1)} and delivery time of ${detail.average_delivery_time_min} mins.`,
      };

      setDrawerSupplier(mapped);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error("Failed to load supplier details:", err);
      alert("Failed to load supplier profile details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Resolve user coords
  const userLat = user?.latitude ?? 18.5204;
  const userLon = user?.longitude ?? 73.8567;

  // Filter & Sort Pipeline
  let processed = rawSuppliers.map((sup) => {
    const distance = calculateDistance(userLat, userLon, sup.latitude, sup.longitude);
    
    // Find offering if product filter exists
    const offering = productOfferings.find((off) => off.supplier_id === sup.id);
    const price = offering ? offering.price : 0;
    
    return { ...sup, distance_km: distance, selected_price: price };
  });

  // Filter 1: Search Name
  if (search) {
    const term = search.toLowerCase();
    processed = processed.filter(
      (s) => s.supplier_name.toLowerCase().includes(term) || s.supplier_id.toLowerCase().includes(term)
    );
  }

  // Filter 2: Area
  if (area) {
    processed = processed.filter((s) => s.area === area);
  }

  // Filter 3: Type
  if (supplierType) {
    processed = processed.filter((s) => s.supplier_type === supplierType);
  }

  // Filter 4: Selected Product
  if (selectedProduct) {
    processed = processed.filter((s) => s.selected_price > 0);
  }

  // Sort logic
  processed.sort((a, b) => {
    if (sortBy === "distance") {
      return a.distance_km - b.distance_km;
    }
    if (sortBy === "price") {
      return (a.selected_price || 99999) - (b.selected_price || 99999);
    }
    // Default sort by rating
    return b.rating - a.rating;
  });

  // Paginate
  const totalItems = processed.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedItems = processed.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-orange">
          Supplier Directory
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse and filter raw material supplier catalogs across Pune markets.
        </p>
      </div>

      {/* Filter Control Console */}
      <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-popover">
        <CardContent className="p-5 space-y-4">
          {/* Row 1: Search & Product filter */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-11 border-slate-200 dark:border-slate-800 rounded-xl text-sm"
              />
            </div>

            {/* Filter by Product */}
            <div className="md:col-span-2">
              <Select
                value={selectedProduct}
                onValueChange={(v) => {
                  setSelectedProduct(v === "all" || !v ? "" : v);
                }}
              >
                <SelectTrigger className="h-11 border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filter by Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {ingredients.map((ing) => (
                    <SelectItem key={ing} value={ing}>
                      {ing}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Area, Type, Sorting, Clear */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Area */}
            <Select
              value={area}
              onValueChange={(v) => {
                setArea(v === "all" || !v ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] h-10 border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Area Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter by Supplier Type */}
            <Select
              value={supplierType}
              onValueChange={(v) => {
                setSupplierType(v === "all" || !v ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <Truck className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Supplier Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {SUPPLIER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select
              value={sortBy}
              onValueChange={(v: any) => {
                setSortBy(v);
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px] h-10 border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Sort: Rating</SelectItem>
                <SelectItem value="distance">Sort: Distance</SelectItem>
                <SelectItem value="price" disabled={!selectedProduct}>
                  Sort: Price {!selectedProduct && "(Select Product)"}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(search || area || supplierType || selectedProduct) && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-10 rounded-xl px-4 text-xs font-semibold shrink-0"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats and Results header */}
      {!loading && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <p>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{paginatedItems.length}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> matching suppliers.
          </p>
        </div>
      )}

      {/* Grid Results */}
      {loading || loadingDetails ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginatedItems.length === 0 ? (
        <Card className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/10">
          <CardContent className="p-16 text-center space-y-4">
            <Inbox className="h-12 w-12 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold">No suppliers match filters</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No registered vendors match your exact criteria. Try resetting or adjusting the filters.
              </p>
            </div>
            <Button variant="outline" onClick={clearFilters} className="rounded-xl">
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {paginatedItems.map((supplier) => (
            <motion.div key={supplier.id} variants={cardVariants}>
              <Card className="border border-slate-150 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-popover group">
                <CardContent className="p-5 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm leading-tight text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                        {supplier.supplier_name}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 text-red-500" /> {supplier.area}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-semibold border-slate-200 dark:border-slate-800 text-slate-500 rounded-full px-2 py-0">
                      {supplier.supplier_type.split(" ")[0]}
                    </Badge>
                  </div>

                  <Separator className="bg-slate-100 dark:bg-slate-800/40" />

                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase">Rating</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-0.5 mt-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {supplier.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase">Distance</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {supplier.distance_km.toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase">Delivery</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {supplier.average_delivery_time_min}m
                      </span>
                    </div>
                  </div>

                  {/* If product filter is active, show the price */}
                  {selectedProduct && supplier.selected_price > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-semibold">Price for {selectedProduct}</span>
                      <span className="font-bold text-slate-850 dark:text-slate-100">₹{supplier.selected_price}</span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleOpenDetails(supplier.id)}
                    variant="outline"
                    className="w-full h-10 text-xs font-semibold rounded-xl group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 flex items-center justify-center gap-1"
                  >
                    View Supplier Profile
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl h-9"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Page</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{page}</span>
            <span className="text-muted-foreground">of</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl h-9"
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail drawer popup */}
      <SupplierDetailsDrawer
        supplier={drawerSupplier}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerSupplier(null);
        }}
      />
    </div>
  );
}
