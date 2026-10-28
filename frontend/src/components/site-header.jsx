"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Scissors,
  Pill,
  Cake,
  Wrench,
  Shirt,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useThemeLang } from "@/lib/theme-lang-context";

const OCCUPATION_KEYS = {
  tailor: { key: "tailor", icon: Scissors },
  medical: { key: "medical", icon: Pill },
  baker: { key: "baker", icon: Cake },
  repair: { key: "repair", icon: Wrench },
  laundry: { key: "laundry", icon: Shirt },
};

export function SiteHeader({
  activeSection = "overview",
  shopType = "tailor",
  shopName = "My Shop",
}) {
  const router = useRouter();
  const { theme, toggleTheme, lang, toggleLang, t } = useThemeLang();

  const occConfig = OCCUPATION_KEYS[shopType] || { key: "tailor", icon: Store };
  const CurrentIcon = occConfig.icon;

  const sectionTitles = {
    overview: t("title_overview"),
    recorder: t("title_recorder"),
    flashcards: t("title_flashcards"),
    "pending-bills": t("title_pending_bills"),
    ledger: t("title_ledger"),
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 lg:px-6 shadow-2xs transition-colors duration-200">
      {/* Sidebar Trigger */}
      <SidebarTrigger className="-ml-1" />

      {/* Breadcrumb Section Indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <span className="relative w-5 h-5 shrink-0 overflow-hidden rounded border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
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
          </span>
          <span>{t("brand_title")}</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
        <span className="text-slate-800 dark:text-slate-200 font-bold capitalize">
          {sectionTitles[activeSection] || activeSection}
        </span>
      </div>

      {/* Center/Right Controls: Clean, Non-text flooded, Theme & Language toggles */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Permanent Locked Profession Badge */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <CurrentIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t(occConfig.key)}</span>
          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-1 py-0.2 rounded font-mono ml-0.5">
            {t("locked")}
          </span>
        </div>

        {/* Language Toggle: English / Hindi */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLang}
          className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-700"
          title={lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
        >
          <Languages className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold">{lang === "en" ? "हिंदी" : "English"}</span>
        </Button>

        {/* Dark / Light Mode Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0 border-slate-200 dark:border-slate-700"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
          <span className="sr-only">Toggle Theme</span>
        </Button>

        {/* Exit Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="h-8 px-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          title={t("exit")}
        >
          <LogOut className="w-3.5 h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">{t("exit")}</span>
        </Button>
      </div>
    </header>
  );
}
