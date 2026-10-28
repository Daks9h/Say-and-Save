"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Pill,
  Cake,
  Wrench,
  Shirt,
  Mic,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  Languages,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useThemeLang } from "@/lib/theme-lang-context";

const OCCUPATION_DEFS = [
  {
    id: "tailor",
    titleKey: "tailor",
    subKey: "tailor_sub",
    icon: Scissors,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "medical",
    titleKey: "medical",
    subKey: "medical_sub",
    icon: Pill,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "baker",
    titleKey: "baker",
    subKey: "baker_sub",
    icon: Cake,
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "repair",
    titleKey: "repair",
    subKey: "repair_sub",
    icon: Wrench,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "laundry",
    titleKey: "laundry",
    subKey: "laundry_sub",
    icon: Shirt,
    color: "from-cyan-500 to-blue-600",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme, lang, toggleLang, t } = useThemeLang();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState("tailor");
  const [shopName, setShopName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Check if profile exists
  useEffect(() => {
    const saved = localStorage.getItem("dukaan_user_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.occupation) setSelectedOccupation(parsed.occupation);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.ownerEmail) setOwnerEmail(parsed.ownerEmail);
        if (parsed.ownerPhone) setOwnerPhone(parsed.ownerPhone);
      } catch (e) {}
    }
  }, []);

  const handleOpenAuth = (occId) => {
    if (occId) setSelectedOccupation(occId);
    setAuthModalOpen(true);
  };

  const handleLaunchDashboard = (e) => {
    e?.preventDefault();
    const profile = {
      shopName: shopName.trim() || `${selectedOccupation.toUpperCase()} Store`,
      occupation: selectedOccupation,
      ownerEmail: ownerEmail.trim() || "owner@sayandsave.com",
      ownerPhone: ownerPhone.trim() || "+91 9876543210",
      loggedInAt: new Date().toISOString(),
      lockedOccupation: true,
    };
    localStorage.setItem("dukaan_user_profile", JSON.stringify(profile));
    setAuthModalOpen(false);
    router.push(`/dashboard?occupation=${selectedOccupation}`);
  };

  const handleQuickDemo = () => {
    const profile = {
      shopName: "Master Tailors Demo",
      occupation: "tailor",
      ownerEmail: "owner@sayandsave.com",
      ownerPhone: "+91 9876543210",
      loggedInAt: new Date().toISOString(),
      lockedOccupation: true,
    };
    localStorage.setItem("dukaan_user_profile", JSON.stringify(profile));
    router.push("/dashboard?occupation=tailor");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 relative overflow-x-hidden">
      {/* Consistent Global Ambient Canvas Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(99,102,241,0.09),rgba(248,250,252,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(99,102,241,0.16),rgba(8,12,20,0))]" />

      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-[#080c14]/85 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo + Brand Name */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-center bg-white dark:bg-slate-900">
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
            <div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {t("brand_title")}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
                {t("brand_tagline")}
              </span>
            </div>
          </div>

          {/* Right Header Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLang}
              className="h-8 px-2.5 text-xs font-semibold gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
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
              className="h-8 w-8 p-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleQuickDemo}
              className="hidden sm:inline-flex text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {t("quick_demo")}
            </Button>

            <Button
              size="sm"
              onClick={() => handleOpenAuth("tailor")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
            >
              {t("setup_shop")}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Visual Section with Embedded Background Image */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: `url('/hero%20section.png')` }}
        />

        {/* Ambient Overlay for Visual Appeal and Readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/75 via-white/85 to-white/95 dark:hidden backdrop-blur-[1px]" />
        <div className="absolute inset-0 z-0 hidden dark:block bg-gradient-to-b from-slate-950/75 via-slate-950/88 to-slate-950 backdrop-blur-[1px]" />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200/80 dark:border-indigo-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs mb-5 animate-in fade-in duration-300">
            <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{t("brand_title")} &bull; {t("fast_badge")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 max-w-3xl leading-[1.12]">
            {t("hero_title_1")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600 dark:from-indigo-400 dark:via-purple-300 dark:to-amber-300">
              {t("hero_title_2")}
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed font-normal">
            {t("hero_desc")}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => handleOpenAuth("tailor")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 px-6 h-11 rounded-xl"
            >
              <span>{t("select_and_start")}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleQuickDemo}
              className="font-semibold text-sm shadow-2xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 px-5 h-11 rounded-xl border-slate-200 dark:border-slate-800"
            >
              {t("open_dashboard")}
            </Button>
          </div>

          {/* Visual Voice Note Slip Preview */}
          <div className="mt-12 w-full max-w-3xl rounded-2xl bg-gradient-to-b from-white/90 dark:from-slate-900/90 to-slate-50/80 dark:to-slate-950/80 p-2 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-md">
            <div className="rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/70 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center animate-pulse">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {t("spoken_note_label")}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 italic">
                      {t("spoken_note_example")}
                    </p>
                  </div>
                </div>

                <Badge variant="success" className="text-[11px] px-2.5 py-1 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t("auto_generated_pill")}
                </Badge>
              </div>

              {/* Order Specs Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t("fc_customer")}</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">Verma Uncle</p>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{t("tailor")}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t("fc_total_bill")}</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">₹1,200</p>
                  <span className="text-[10px] text-slate-500">Suit</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t("fc_advance_paid")}</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹500</p>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Received</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t("fc_balance_due")}</span>
                  <p className="text-sm font-extrabold text-red-600 dark:text-red-400 mt-0.5">₹700</p>
                  <span className="text-[10px] text-slate-500">5 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chromatic Hue Effect Transition Between Hero and Occupation Section */}
      <div className="relative w-full z-20 -mt-px pointer-events-none select-none">
        {/* Diffused Hue Ambient Aura */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-full max-w-4xl h-20 bg-gradient-to-r from-violet-600/30 via-indigo-500/35 via-purple-500/30 to-amber-500/25 blur-3xl opacity-80 rounded-full" />
        
        {/* Radiant Luminous Hue Gradient Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500 via-indigo-500 via-pink-500 to-transparent opacity-75 dark:opacity-90 shadow-[0_0_16px_rgba(99,102,241,0.6)]" />

        {/* Soft Downward Hue Wash */}
        <div className="h-6 w-full bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent" />
      </div>

      {/* Second Section: Select Occupation Section (Aligned Perfectly to Hero Section) */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 relative z-10 transition-colors">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t("select_prof_label")}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {t("professions_title")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl mx-auto">
              {t("professions_desc")}
            </p>
          </div>

          {/* 5 Occupation Cards Aligned Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {OCCUPATION_DEFS.map((occ) => {
              const IconComp = occ.icon;
              return (
                <button
                  key={occ.id}
                  onClick={() => handleOpenAuth(occ.id)}
                  className="group flex flex-col items-center text-center p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800/95 hover:border-indigo-400 dark:hover:border-indigo-500/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${occ.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-3.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {t(occ.titleKey)}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {t(occ.subKey)}
                  </p>
                  <span className="mt-4 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    {t("select_enter")} <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Consistent Footer */}
      <footer className="mt-auto py-8 px-4 sm:px-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md transition-colors relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
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
            <span className="font-bold text-slate-800 dark:text-slate-200">{t("brand_title")}</span>
            <span className="text-slate-400 dark:text-slate-600">&bull;</span>
            <span>{t("brand_tagline")}</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Fast Voice Ledger & Physical Flashcards
          </div>
        </div>
      </footer>

      {/* Login / Signup Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
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
              <DialogTitle>{t("modal_title")}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuthModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              &times;
            </Button>
          </div>
          <DialogDescription>
            {t("modal_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLaunchDashboard} className="mt-4 space-y-3.5">
          {/* Shop Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("shop_name_label")}
            </label>
            <Input
              type="text"
              placeholder={t("shop_name_placeholder")}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>

          {/* Profession Selection (Permanent) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {t("select_prof_label")}
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t("cannot_change")}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OCCUPATION_DEFS.map((occ) => {
                const IconComp = occ.icon;
                const isSelected = selectedOccupation === occ.id;
                return (
                  <button
                    type="button"
                    key={occ.id}
                    onClick={() => setSelectedOccupation(occ.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold shadow-2xs ring-1 ring-indigo-600"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`} />
                    <span className="text-xs">{t(occ.titleKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Owner Email */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("owner_email_label")}
            </label>
            <Input
              type="email"
              placeholder="owner@sayandsave.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t("owner_email_desc")}
            </p>
          </div>

          {/* Owner Phone */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t("owner_phone_label")}
            </label>
            <Input
              type="tel"
              placeholder="+91 9876543210"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t("owner_phone_desc")}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm h-10 shadow mt-2"
          >
            {t("launch_btn")}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
