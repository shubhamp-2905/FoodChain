import React from "react";
import { Loader2, AlertCircle, Inbox, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Spinner Loading
export function LoadingSpinner({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

// Error Message Card
export function ErrorBanner({
  title = "Error occurred",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border border-red-100 bg-red-50/20 dark:border-red-950/20 dark:bg-red-950/10 rounded-2xl">
      <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3 items-center">
          <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-300 text-sm">{title}</h3>
            <p className="text-xs text-red-650 dark:text-red-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
          >
            Try Again
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// Empty Results Box
export function EmptyState({
  title = "No results found",
  description = "Try adjusting your search query or filters.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
      <Inbox className="h-10 w-10 text-slate-400 mx-auto mb-3" />
      <h3 className="font-bold text-slate-850 dark:text-slate-200 text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// Success Alert Banner
export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="flex gap-2.5 items-center bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-4 py-3 rounded-xl text-emerald-800 dark:text-emerald-350 text-xs font-medium animate-fadeIn">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
