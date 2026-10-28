"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SIDEBAR_WIDTH = "18rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3.5rem";

const SidebarContext = React.createContext(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

export const SidebarProvider = React.forwardRef(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp !== undefined ? openProp : _open;
    const setOpen = React.useCallback(
      (value) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
      },
      [setOpenProp, open]
    );

    const [isMobile, setIsMobile] = React.useState(false);
    const [openMobile, setOpenMobile] = React.useState(false);

    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const toggleSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobile((prev) => !prev);
      } else {
        setOpen((prev) => !prev);
      }
    }, [isMobile, setOpen]);

    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          ref={ref}
          style={{
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          }}
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 selection:bg-indigo-500 selection:text-white transition-colors duration-200",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = "SidebarProvider";

export const Sidebar = React.forwardRef(
  ({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          ref={ref}
          className={cn("flex h-full w-[--sidebar-width] flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800", className)}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      if (!openMobile) return null;
      return (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setOpenMobile(false)}
          />
          <div
            ref={ref}
            className={cn(
              "relative flex h-full w-[--sidebar-width] max-w-[85vw] flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl z-10",
              className
            )}
            {...props}
          >
            {children}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "hidden md:flex h-svh sticky top-0 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-30",
          state === "expanded" ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]",
          variant === "inset" ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm" : "",
          className
        )}
        data-state={state}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className={cn("h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800", className)}
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarInset = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn("relative flex min-h-svh flex-1 flex-col bg-slate-50/50 dark:bg-slate-950 overflow-x-hidden transition-colors duration-200", className)}
      {...props}
    />
  );
});
SidebarInset.displayName = "SidebarInset";

export const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 p-4 border-b border-slate-100 dark:border-slate-800", className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

export const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mt-auto flex flex-col gap-2 p-3 border-t border-slate-100 dark:border-slate-800", className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

export const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3", className)}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

export const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("relative flex w-full flex-col gap-1", className)} {...props} />;
});
SidebarGroup.displayName = "SidebarGroup";

export const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-7 items-center px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none",
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

export const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("w-full text-xs", className)} {...props} />;
});
SidebarGroupContent.displayName = "SidebarGroupContent";

export const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => {
  return <ul ref={ref} className={cn("flex w-full flex-col gap-1 list-none p-0 m-0", className)} {...props} />;
});
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => {
  return <li ref={ref} className={cn("relative", className)} {...props} />;
});
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = React.forwardRef(
  ({ isActive, size = "default", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors select-none text-left",
          isActive
            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-900/50 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100",
          size === "sm" && "py-1.5 px-2 text-[11px]",
          size === "lg" && "py-2.5 px-3 text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";
