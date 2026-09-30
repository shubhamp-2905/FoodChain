"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Search,
  MapPin,
  Star,
  Clock,
  Sparkles,
  AlertTriangle,
  History,
  Trash2,
  Navigation,
  Compass,
  ShieldCheck
} from "lucide-react";
import dynamic from "next/dynamic";

import api from "@/lib/axios";
import { supplierService } from "@/services/supplier.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { RecommendationResponse, SupplierRecommendation } from "@/types/recommendation";

import SupplierDetailsDrawer from "./SupplierDetailsDrawer";
import AuditTraceModal from "./AuditTraceModal";


// Dynamic import for Leaflet map component (prevents Next.js SSR document undefined crashes)
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function RecommendationsPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  
  // Interaction states
  const [activeSupplierId, setActiveSupplierId] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecommendation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  
  // Geolocation state
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load ingredients and recent searches on mount
  useEffect(() => {
    supplierService.getIngredients()
      .then((data: string[]) => setIngredients(data))
      .catch((err: any) => console.error("Error loading ingredients:", err));

    const cached = localStorage.getItem("recent_recommendation_searches");
    if (cached) {
      setRecentSearches(JSON.parse(cached));
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Request browser geolocation
  const handleRequestGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      (err) => {
        console.error("GPS retrieval error:", err);
        alert("Unable to fetch location. Profile coordinates will be used instead.");
        setGpsLoading(false);
      }
    );
  };

  // Perform search call
  const executeSearch = async (ingredientName: string) => {
    if (!ingredientName.trim()) return;
    
    setLoading(true);
    setError(null);
    setIsOpen(false);
    
    // Manage search history
    const updated = [ingredientName, ...recentSearches.filter((s) => s !== ingredientName)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent_recommendation_searches", JSON.stringify(updated));

    try {
      const payload: { ingredient: string; latitude?: number; longitude?: number } = {
        ingredient: ingredientName,
      };
      
      if (userCoords) {
        payload.latitude = userCoords.latitude;
        payload.longitude = userCoords.longitude;
      }

      const response = await api.post<RecommendationResponse>("/recommend", payload);
      setResults(response.data);
    } catch (err: any) {
      console.error("Recommendation search failure:", err);
      const detail = err.response?.data?.detail || "An unexpected error occurred.";
      setError(detail);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const removeRecentSearch = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    localStorage.setItem("recent_recommendation_searches", JSON.stringify(updated));
  };

  const selectSupplier = (supplier: SupplierRecommendation) => {
    setSelectedSupplier(supplier);
    setIsDrawerOpen(true);
  };

  const filteredIngredients = ingredients.filter((ing) =>
    ing.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-orange">
            AI Supplier Procurement
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Machine learning optimized vendor ranking matching Pune supplier clustering models.
          </p>
        </div>
        
        {/* GPS Option */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRequestGPS}
          disabled={gpsLoading}
          className={`flex items-center gap-2 border-slate-200 dark:border-slate-800 ${
            userCoords ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 text-emerald-600" : ""
          }`}
        >
          <Navigation className={`h-4 w-4 ${gpsLoading ? "animate-spin" : ""}`} />
          {userCoords
            ? `GPS Active (${userCoords.latitude.toFixed(2)}, ${userCoords.longitude.toFixed(2)})`
            : "Use Browser GPS"}
        </Button>
      </div>

      {/* Search Console */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search ingredient (e.g. Potato, Onion, Tomato)..."
              className="pl-9 h-11 border-slate-200 dark:border-slate-800 rounded-xl"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </div>
          <Button
            onClick={() => executeSearch(query)}
            disabled={loading}
            className="gradient-orange text-white px-6 h-11 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            Find Suppliers
          </Button>
        </div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {isOpen && filteredIngredients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 top-[48px] bg-popover border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
            >
              {filteredIngredients.map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-sm font-medium transition-colors"
                  onClick={() => {
                    setQuery(item);
                    executeSearch(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search History / Recent searches */}
      {recentSearches.length > 0 && !results && !loading && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><History className="h-3 w-3" /> Recent Searches:</span>
          {recentSearches.map((item) => (
            <Badge
              key={item}
              onClick={() => {
                setQuery(item);
                executeSearch(item);
              }}
              variant="secondary"
              className="cursor-pointer px-2.5 py-1 flex items-center gap-1 border border-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"
            >
              {item}
              <button onClick={(e) => removeRecentSearch(item, e)} className="hover:text-red-500 rounded-full">
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Main Results Panel */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      )}

      {error && (
        <Card className="border border-red-100 bg-red-50/20 dark:border-red-950/20 dark:bg-red-950/10 rounded-2xl">
          <CardContent className="p-6 flex gap-3 items-center">
            <AlertTriangle className="h-8 w-8 text-red-500 shrink-0" />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-300">Procurement Search Error</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column: Map & Summary */}
          <div className="lg:col-span-3 space-y-4">
            <MapComponent
              vendorLat={userCoords?.latitude ?? results.best_supplier?.latitude ?? 18.5204}
              vendorLon={userCoords?.longitude ?? results.best_supplier?.longitude ?? 73.8567}
              bestSupplier={results.best_supplier}
              alternatives={results.alternatives}
              activeSupplierId={activeSupplierId}
              onSupplierSelect={selectSupplier}
            />
            
            {/* Meta summary footer with Trace Request ID */}
            <div className="flex flex-wrap justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs text-muted-foreground gap-4">
              <span className="flex items-center gap-1">
                <Brain className="h-3.5 w-3.5 text-purple-500" /> Model: {results.metadata.model_version}
              </span>
              <span>Checked: {results.metadata.suppliers_checked}</span>
              <span>Radius Eligible: {results.metadata.eligible_suppliers}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Procured in: {results.metadata.processing_time_ms} ms
              </span>
              {results.metadata.request_id && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                    ID: {results.metadata.request_id.slice(0, 8)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px] hover:text-amber-600"
                    onClick={() => {
                      if (results.metadata.request_id) {
                        navigator.clipboard.writeText(results.metadata.request_id);
                        alert(`Trace Request ID copied to clipboard:\n${results.metadata.request_id}`);
                      }
                    }}
                  >
                    Copy Trace ID
                  </Button>
                  <Separator orientation="vertical" className="h-3" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    onClick={() => setIsAuditModalOpen(true)}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Audit Trail
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recommendations List */}
          <div className="lg:col-span-2 space-y-4 max-h-[480px] overflow-y-auto pr-1">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 tracking-wide uppercase">
              Top Recommendations (Ranked by Business Score)
            </h3>
            
            {/* Empty State checks */}
            {!results.best_supplier && results.alternatives.length === 0 && (
              <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Compass className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h4 className="font-bold text-sm">No suppliers found</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  We checked {results.metadata.suppliers_checked} options, but none offer this ingredient within your radius.
                </p>
              </div>
            )}

            {/* Best Match card */}
            {results.best_supplier && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onMouseEnter={() => setActiveSupplierId(results.best_supplier!.id)}
                onMouseLeave={() => setActiveSupplierId(null)}
              >
                <Card
                  onClick={() => selectSupplier(results.best_supplier!)}
                  className="cursor-pointer border-2 border-amber-300 hover:border-amber-400 bg-amber-50/10 dark:border-amber-900/60 dark:bg-amber-950/10 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl relative overflow-hidden group"
                >
                  {/* Decorative spark flare */}
                  <div className="absolute right-0 top-0 h-10 w-20 bg-amber-300/10 rounded-bl-full flex items-center justify-end pr-3">
                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                  </div>
                  
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge className="gradient-orange text-white text-[10px] px-2 py-0.5 border-0 rounded-full font-bold">
                            Rank #{results.best_supplier.rank || 1} • Best Match
                          </Badge>
                          {results.best_supplier.cluster_label && (
                            <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 rounded-full">
                              Profile: {results.best_supplier.cluster_label}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-base leading-snug group-hover:text-primary transition-colors">
                          {results.best_supplier.supplier_name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {results.best_supplier.area}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">
                          {results.best_supplier.match_score}%
                        </div>
                        <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Match Score
                        </span>
                      </div>
                    </div>

                    <Separator className="bg-amber-200/30 dark:bg-amber-950/30" />

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase">Price</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{results.best_supplier.price} <span className="text-[9px] font-normal">/{results.best_supplier.unit}</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase">Distance</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {results.best_supplier.distance_km.toFixed(1)} km
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase">Delivery</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {results.best_supplier.delivery_time}m
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-200/10 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-300/20 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      &ldquo;{results.best_supplier.explanation || results.best_supplier.reason}&rdquo;
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Alternatives list */}
            {results.alternatives.map((supplier, idx) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onMouseEnter={() => setActiveSupplierId(supplier.id)}
                onMouseLeave={() => setActiveSupplierId(null)}
              >
                <Card
                  onClick={() => selectSupplier(supplier)}
                  className="cursor-pointer border border-slate-100 hover:border-slate-200 dark:border-slate-850 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group"
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-600 rounded-full font-medium">
                            Rank #{supplier.rank || idx + 2}
                          </Badge>
                          {supplier.cluster_label && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                              {supplier.cluster_label}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-sm mt-1 group-hover:text-primary transition-colors">
                          {supplier.supplier_name}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {supplier.area}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-150 leading-none">
                          {supplier.match_score}%
                        </div>
                        <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Match
                        </span>
                      </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800/40" />

                    <div className="grid grid-cols-4 gap-1 text-center text-[11px] text-slate-700 dark:text-slate-350">
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase block">Price</span>
                        <span className="font-semibold">₹{supplier.price}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase block">Dist</span>
                        <span className="font-semibold">{supplier.distance_km.toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase block">Rating</span>
                        {supplier.rating != null ? (
                          <span className="font-semibold flex items-center justify-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {supplier.rating.toFixed(1)}</span>
                        ) : (
                          <span className="font-semibold text-muted-foreground">Unrated</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[8px] text-muted-foreground uppercase block">Deliv</span>
                        <span className="font-semibold">{supplier.delivery_time}m</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Screen (No search made yet) */}
      {!results && !loading && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/5 dark:to-amber-950/5 rounded-2xl">
          <CardContent className="p-8 text-center max-w-2xl mx-auto space-y-4">
            <div className="h-16 w-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-50">
              Procure with AI Recommendations & Auditable Pipeline
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Select or type an ingredient to find nearby verified suppliers. Our backend features an end-to-end Medallion data engineering pipeline (Bronze → Silver → Gold) feeding a Two-Branch decision architecture: deterministic weighted business ranking for authoritative order, paired with K-Means behavioral clustering for supplier cohort profiling and deterministic, value-grounded explainability.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Drawer slide-out detailed view */}
      <SupplierDetailsDrawer
        supplier={selectedSupplier}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedSupplier(null);
        }}
      />

      {/* Decision Audit Provenance Modal */}
      <AuditTraceModal
        requestId={results?.metadata?.request_id || null}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
