import React from "react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variants = {
      default: "bg-indigo-600 text-white shadow hover:bg-indigo-700 active:scale-[0.98]",
      destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]",
      outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-300",
      secondary: "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200",
      ghost: "text-slate-700 hover:bg-slate-100",
      link: "text-indigo-600 underline-offset-4 hover:underline",
      success: "bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-[0.98]",
    };

    const sizes = {
      default: "h-9 px-4 py-2 text-sm rounded-lg",
      sm: "h-8 px-3 text-xs rounded-md",
      lg: "h-11 px-6 text-base rounded-xl font-semibold",
      icon: "h-9 w-9 rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
