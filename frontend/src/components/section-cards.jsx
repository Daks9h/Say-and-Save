"use client";

import React from "react";
import { DollarSign, ShoppingBag, AlertTriangle, Zap } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useThemeLang } from "@/lib/theme-lang-context";

export function SectionCards({ cards = [], health = {} }) {
  const { t } = useThemeLang();

  const openCards = cards.filter((c) => c.status === "open");
  const pendingDueCards = openCards.filter((c) => (c.balance_due || 0) > 0);
  const totalBalanceDue = pendingDueCards.reduce((acc, c) => acc + (c.balance_due || 0), 0);
  const attentionCards = openCards.filter((c) => c.needs_attention);

  const stats = [
    {
      title: t("stat_total_pending"),
      value: `₹${totalBalanceDue.toLocaleString("en-IN")}`,
      description: `${pendingDueCards.length} ${t("stat_pending_desc")}`,
      icon: DollarSign,
      iconBg: "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400",
      valueColor: "text-red-600 dark:text-red-400 font-extrabold",
    },
    {
      title: t("stat_active_orders"),
      value: openCards.length,
      description: t("stat_active_desc"),
      icon: ShoppingBag,
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
      valueColor: "text-slate-900 dark:text-slate-100 font-bold",
    },
    {
      title: t("stat_urgent"),
      value: attentionCards.length,
      description: t("stat_urgent_desc"),
      icon: AlertTriangle,
      iconBg: attentionCards.length > 0 ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400" : "bg-slate-50 dark:bg-slate-800 text-slate-500",
      valueColor: attentionCards.length > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-700 dark:text-slate-300 font-bold",
    },
    {
      title: t("stat_engine"),
      value: health.preferred_backend === "cloud" ? "Gemini 3.5 Flash" : "Gemma 4 Local",
      description: health.last_latency_ms > 0 ? `${Math.round(health.last_latency_ms)}ms latency` : t("stat_engine_desc"),
      icon: Zap,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-700 dark:text-emerald-400 font-bold text-lg",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
      {stats.map((stat, idx) => {
        const IconComp = stat.icon;
        return (
          <Card key={idx} className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {stat.title}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <IconComp className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className={`text-2xl tracking-tight ${stat.valueColor}`}>{stat.value}</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
