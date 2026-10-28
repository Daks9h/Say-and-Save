"use client";

import React from "react";
import {
  LayoutDashboard,
  Mic,
  Layers,
  DollarSign,
  Table2,
  Store,
  Scissors,
  Pill,
  Cake,
  Wrench,
  Shirt,
  Mail,
  Phone,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useThemeLang } from "@/lib/theme-lang-context";

const OCCUPATION_KEYS = {
  tailor: { key: "tailor", icon: Scissors, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60" },
  medical: { key: "medical", icon: Pill, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60" },
  baker: { key: "baker", icon: Cake, color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60" },
  repair: { key: "repair", icon: Wrench, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60" },
  laundry: { key: "laundry", icon: Shirt, color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60" },
};

export function AppSidebar({
  variant = "inset",
  activeSection = "overview",
  onSelectSection,
  shopType = "tailor",
  shopName = "My Shop",
  ownerEmail = "",
  ownerPhone = "",
  cards = [],
}) {
  const { t } = useThemeLang();

  const occInfo = OCCUPATION_KEYS[shopType] || { key: "tailor", icon: Store, color: "text-indigo-600 bg-indigo-50" };
  const OccIcon = occInfo.icon;

  const pendingCount = cards.filter((c) => c.status === "open" && (c.balance_due || 0) > 0).length;
  const totalOpen = cards.filter((c) => c.status === "open").length;

  const navItems = [
    {
      id: "overview",
      label: t("nav_overview"),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "recorder",
      label: t("nav_recorder"),
      icon: Mic,
      badge: t("fast_badge"),
      badgeColor: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300",
    },
    {
      id: "flashcards",
      label: t("nav_flashcards"),
      icon: Layers,
      badge: totalOpen > 0 ? `${totalOpen}` : null,
      badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    },
    {
      id: "pending-bills",
      label: t("nav_pending_bills"),
      icon: DollarSign,
      badge: pendingCount > 0 ? `${pendingCount}` : null,
      badgeColor: "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 font-bold",
    },
    {
      id: "ledger",
      label: t("nav_ledger"),
      icon: Table2,
      badge: cards.length > 0 ? `${cards.length}` : null,
      badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    },
  ];

  return (
    <Sidebar variant={variant}>
      {/* Sidebar Header: Business Profile & Locked Profession */}
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-center shadow-xs">
            <img
              src="/light-mode-logo.png"
              alt="Say & Save"
              className="w-full h-full object-cover dark:hidden"
            />
            <img
              src="/dark-mode-logo.png"
              alt="Say & Save"
              className="w-full h-full object-cover hidden dark:block"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{shopName}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              {t("brand_title")}
            </span>
          </div>
        </div>

        {/* Permanent Profession Locked Indicator */}
        <div className="mt-2 flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${occInfo.color}`}>
              <OccIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{t(occInfo.key)}</span>
          </div>
          <span className="text-[9px] font-mono font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
            {t("locked")}
          </span>
        </div>
      </SidebarHeader>

      {/* Navigation Groups */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav_workspace_sections")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const ItemIcon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onSelectSection?.(item.id)}
                      className="justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <ItemIcon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Owner Credentials Card in Sidebar */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>{t("nav_owner_info")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                <Mail className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{ownerEmail || "owner@dukaandiary.com"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                <Phone className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{ownerPhone || "+91 9876543210"}</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight pt-1 border-t border-slate-200/60 dark:border-slate-800">
                {t("nav_owner_note")}
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium px-2 py-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {t("safe_badge")}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {t("fast_badge")}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
