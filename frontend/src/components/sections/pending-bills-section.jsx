"use client";

import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Search,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useThemeLang } from "@/lib/theme-lang-context";

export function PendingBillsSection({
  cards = [],
  onSelectCard,
  onSettleBill,
  onSendAlert,
  ownerPhone = "",
}) {
  const { t } = useThemeLang();
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");

  const pendingCards = useMemo(() => {
    return cards
      .filter((c) => c.status === "open" && (c.balance_due || 0) > 0)
      .filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          c.person?.toLowerCase().includes(q) ||
          c.item?.toLowerCase().includes(q) ||
          c.id?.toString().includes(q)
        );
      });
  }, [cards, search]);

  const totalOutstanding = pendingCards.reduce((acc, c) => acc + (c.balance_due || 0), 0);

  const handleSettle = async (cardId) => {
    if (!onSettleBill) return;
    await onSettleBill(cardId, "done");
    setFeedback(`Order #${cardId} balance settled!`);
    setTimeout(() => setFeedback(""), 4000);
  };

  const handleSendReminder = async (card) => {
    if (!onSendAlert) return;
    const res = await onSendAlert(card, "sms");
    setFeedback(res?.message || `SMS alert sent to ${ownerPhone}!`);
    setTimeout(() => setFeedback(""), 4000);
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 max-w-5xl mx-auto w-full py-4">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" /> {t("pb_title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("pb_desc")}
          </p>
        </div>

        {/* Financial Summary Pill */}
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-4 py-2 rounded-xl">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
              {t("pb_total_outstanding")}
            </span>
            <span className="text-lg font-extrabold text-red-600 dark:text-red-400">
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="border-l border-red-200 dark:border-red-900/60 pl-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
              {t("pb_unpaid_orders")}
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {pendingCards.length}
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 text-center animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
        <Input
          placeholder={t("pb_search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {/* Pending Bills Grid / List */}
      {pendingCards.length === 0 ? (
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t("pb_all_settled")}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("pb_all_settled_desc")}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingCards.map((bill) => (
            <Card
              key={bill.id}
              className="border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-300 dark:hover:border-red-900 transition-all"
            >
              <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-start justify-between space-y-0">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">
                    #{bill.id}
                  </span>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {bill.person || "Unknown Customer"}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {bill.item || "Standard Service"}
                  </CardDescription>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400 block">
                    {t("fc_balance_due")}
                  </span>
                  <span className="text-lg font-extrabold text-red-600 dark:text-red-400">
                    ₹{(bill.balance_due || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-3 flex flex-col gap-3">
                {/* Financial breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">{t("fc_total_bill")}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{(bill.amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">{t("fc_advance_paid")}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(bill.advance || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Due Date & Urgency */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{bill.due_date || "Pending"}</span>
                  </div>
                  {bill.needs_attention && (
                    <Badge variant="destructive" className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {t("pb_due_soon")}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                    onClick={() => onSelectCard?.(bill)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> {t("pb_view_slip")}
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[11px] font-semibold"
                      onClick={() => handleSendReminder(bill)}
                      title={`SMS to ${ownerPhone}`}
                    >
                      <Phone className="w-3 h-3 mr-1" /> {t("fc_sms_btn")}
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                      onClick={() => handleSettle(bill.id)}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {t("pb_mark_paid")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
