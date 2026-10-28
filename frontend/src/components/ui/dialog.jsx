import React from "react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Dialog Body */}
      <div className="relative z-50 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-6 shadow-2xl transition-all">
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ className, children, ...props }) {
  return (
    <h2 className={cn("text-lg font-bold text-slate-900 dark:text-slate-100", className)} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({ className, children, ...props }) {
  return (
    <p className={cn("text-xs text-slate-500 dark:text-slate-400", className)} {...props}>
      {children}
    </p>
  );
}
