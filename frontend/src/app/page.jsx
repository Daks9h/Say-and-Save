"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Scissors,
  Pill,
  Cake,
  Wrench,
  Shirt,
  Mic,
  Zap,
  ShieldCheck,
  Calculator,
  Mail,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  User,
  Phone,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const OCCUPATIONS = [
  {
    id: "tailor",
    title: "Tailor & Boutique",
    subtitle: "Custom measurements, fittings, delivery schedules",
    icon: Scissors,
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50/80 border-blue-200 text-blue-700",
    metrics: "Chest, Waist, Shoulder, Length",
  },
  {
    id: "medical",
    title: "Pharmacy & Chemist",
    subtitle: "Batch tracking, expiry dates, prescription bills",
    icon: Pill,
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50/80 border-emerald-200 text-emerald-700",
    metrics: "Batch No, Expiry (MM/YYYY), Units",
  },
  {
    id: "baker",
    title: "Bakery & Cakes",
    subtitle: "Custom flavours, cake weights, event pickups",
    icon: Cake,
    color: "from-pink-500 to-rose-600",
    bgLight: "bg-pink-50/80 border-pink-200 text-pink-700",
    metrics: "Flavour, Weight (kg), Pickups",
  },
  {
    id: "repair",
    title: "Electronics & Repair",
    subtitle: "Device diagnosis, repair quotes, fault logs",
    icon: Wrench,
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50/80 border-amber-200 text-amber-700",
    metrics: "Device Model, Issue, Estimate",
  },
  {
    id: "laundry",
    title: "Laundry & Dry Clean",
    subtitle: "Item counting, wash & iron services",
    icon: Shirt,
    color: "from-cyan-500 to-blue-600",
    bgLight: "bg-cyan-50/80 border-cyan-200 text-cyan-700",
    metrics: "Item Count, Service Type",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState("tailor");
  const [shopName, setShopName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Check if already configured
  useEffect(() => {
    const saved = localStorage.getItem("dukaan_user_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.occupation) {
          setSelectedOccupation(parsed.occupation);
          if (parsed.shopName) setShopName(parsed.shopName);
          if (parsed.ownerEmail) setOwnerEmail(parsed.ownerEmail);
          if (parsed.ownerPhone) setOwnerPhone(parsed.ownerPhone);
        }
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
      ownerEmail: ownerEmail.trim() || "owner@dukaandiary.com",
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
      ownerEmail: "owner@dukaandiary.com",
      ownerPhone: "+91 9876543210",
      loggedInAt: new Date().toISOString(),
      lockedOccupation: true,
    };
    localStorage.setItem("dukaan_user_profile", JSON.stringify(profile));
    router.push("/dashboard?occupation=tailor");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Glass Navigation */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/80 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">Dukaan Diary</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold text-slate-500 border-l border-slate-300 pl-2">
                Voice Ledger for Indian Shops
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleQuickDemo}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Quick Demo
            </Button>
            <Button
              size="sm"
              onClick={() => handleOpenAuth("tailor")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
            >
              Sign In / Setup Shop
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Visual Section - High Design, No Text Flooding */}
      <section className="relative overflow-hidden pt-12 pb-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Primary Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-[1.15]">
            Speak your orders. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              We manage the flashcards & balance dues.
            </span>
          </h1>

          {/* Clean 1-sentence description - no text flood */}
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
            Record customer notes in natural Hinglish or English. AI automatically extracts clean English fields, calculates pending dues, and updates your ledger in 3 seconds.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => handleOpenAuth("tailor")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center gap-2"
            >
              Select Your Shop & Start
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleQuickDemo}
              className="bg-white hover:bg-slate-50 border-slate-300 text-slate-800 font-semibold text-sm shadow-sm"
            >
              Open Live Dashboard
            </Button>
          </div>

          {/* Visual Interactive Preview Graphic */}
          <div className="mt-12 w-full max-w-3xl rounded-2xl bg-gradient-to-b from-white to-slate-50/50 p-2 sm:p-4 border border-slate-200/80 shadow-xl">
            <div className="rounded-xl bg-white border border-slate-200/60 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center animate-pulse">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Spoken Voice Note
                    </span>
                    <p className="text-sm font-semibold text-slate-800 italic">
                      &quot;Verma uncle suit 5 din mein dena hai, total 1200, advance 500&quot;
                    </p>
                  </div>
                </div>

                <Badge variant="success" className="text-[11px] px-2.5 py-1 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Generated in 3.4s
                </Badge>
              </div>

              {/* Converted Card Preview */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Customer</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Verma Uncle</p>
                  <span className="text-[10px] text-indigo-600 font-semibold">Tailor Order</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Bill</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">₹1,200</p>
                  <span className="text-[10px] text-slate-500">Service: Suit</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Advance Paid</span>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">₹500</p>
                  <span className="text-[10px] text-emerald-700">Received</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Balance Due</span>
                  <p className="text-sm font-extrabold text-red-600 mt-0.5">₹700</p>
                  <span className="text-[10px] text-slate-500">Due in 5 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Select Occupation Section - Visual Grid */}
      <section className="py-12 px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Tailored for Your Exact Profession
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Selecting your occupation automatically loads custom fields, range checks, and smart alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {OCCUPATIONS.map((occ) => {
              const IconComp = occ.icon;
              return (
                <button
                  key={occ.id}
                  onClick={() => handleOpenAuth(occ.id)}
                  className="group flex flex-col items-center text-center p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-400 hover:shadow-md transition-all text-left"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${occ.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">
                    {occ.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {occ.subtitle}
                  </p>
                  <span className="mt-3 text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5">
                    Select & Enter <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Core Architecture Pillars - Visual & Concise */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="p-5">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">100% Offline Capable</CardTitle>
              <CardDescription>
                Runs privately on local Gemma 4 via Ollama. No customer audio or contact details leave your PC.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="p-5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Calculator className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Deterministic Math</CardTitle>
              <CardDescription>
                AI only extracts words. Plain Python computes all balances and delivery dates to guarantee zero financial hallucinations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="p-5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <Mail className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Instant Invoicing</CardTitle>
              <CardDescription>
                One-click customer email bills and Telegram owner notifications detailing item, advance, and due dates.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        Dukaan Diary &bull; Voice Flashcard Ledger for Small Retail &bull; Built with Next.js, FastAPI & Gemma 4
      </footer>

      {/* Login / Signup Modal with Occupation Selector */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Setup Your Shop Profile</DialogTitle>
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
            Choose your profession to load customized flashcard fields and order ledgers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLaunchDashboard} className="mt-4 space-y-3.5">
          {/* Shop Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Shop / Business Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Verma Tailors or Apollo Pharmacy"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>

          {/* Select Occupation (Permanent Identity) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Select Your Profession (Permanent)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Cannot be changed later</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OCCUPATIONS.map((occ) => {
                const IconComp = occ.icon;
                const isSelected = selectedOccupation === occ.id;
                return (
                  <button
                    type="button"
                    key={occ.id}
                    onClick={() => setSelectedOccupation(occ.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-sm ring-1 ring-indigo-600"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-500"}`} />
                    <span className="text-xs">{occ.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Owner Email Credentials */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Your Email Address (For Order Digest & Pending Due Cards)
            </label>
            <Input
              type="email"
              placeholder="owner@yourshop.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Order cards with pending balances and delivery deadlines will be emailed directly to you.
            </p>
          </div>

          {/* Owner Phone Credentials */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Your Mobile / SMS Number (For Due Date Alerts)
            </label>
            <Input
              type="tel"
              placeholder="+91 9876543210"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              SMS reminders will be sent to this number for urgent deadlines.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm h-10 shadow mt-2"
          >
            Launch {selectedOccupation.toUpperCase()} Ledger
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
