"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Clock, Brain, MapPin, Database, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import type { RecommendationAudit } from "@/types/recommendation";

interface AuditTraceModalProps {
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditTraceModal({
  requestId,
  isOpen,
  onClose,
}: AuditTraceModalProps) {
  const [audit, setAudit] = useState<RecommendationAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && requestId) {
      setLoading(true);
      setError(null);
      api
        .get<RecommendationAudit>(`/recommend/audits/${requestId}`)
        .then((res) => {
          setAudit(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load audit trace:", err);
          setError(
            err.response?.data?.detail || "Could not retrieve audit record from database."
          );
          setLoading(false);
        });
    } else {
      setAudit(null);
    }
  }, [isOpen, requestId]);

  const copyRequestId = () => {
    if (requestId) {
      navigator.clipboard.writeText(requestId);
      alert("Trace ID copied to clipboard!");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-popover border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Decision Audit Provenance Trace
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Phase 10: Immutable recommendation provenance record
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading && (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Fetching persistent audit record from PostgreSQL...
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            {audit && !loading && (
              <div className="space-y-3 text-xs">
                {/* Request Identification */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold">
                      Trace Request ID
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyRequestId}
                      className="h-5 px-1.5 text-[10px] text-amber-600 hover:text-amber-700"
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy ID
                    </Button>
                  </div>
                  <div className="font-mono text-[11px] break-all font-semibold text-slate-800 dark:text-slate-200">
                    {audit.request_id}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-slate-200/50 dark:border-slate-800">
                    <span>Timestamp: {audit.created_at}</span>
                    <span>User ID: {audit.user_id ?? "Anonymous"}</span>
                  </div>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-card">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Target Ingredient
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {audit.ingredient}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-card">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Selected Supplier
                    </span>
                    <span className="font-bold text-sm text-amber-600 dark:text-amber-400 truncate block">
                      {audit.selected_supplier_name || audit.selected_supplier_id || "None"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-card">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Suppliers Checked
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {audit.suppliers_checked} checked ({audit.eligible_suppliers} nearby)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-card">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Match Score
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {audit.match_score}% ({audit.recommendation_score ? audit.recommendation_score.toFixed(1) : "N/A"})
                    </span>
                  </div>
                </div>

                {/* System Diagnostics */}
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 block text-[11px]">
                        PostgreSQL Persistence Verified
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Latency: {audit.processing_time_ms} ms • Model v{audit.model_version} • API {audit.api_version}
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
