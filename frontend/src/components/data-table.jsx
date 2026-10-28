"use client";

import React, { useState, useMemo } from "react";
import { Search, Calendar, AlertTriangle, Eye, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useThemeLang } from "@/lib/theme-lang-context";

export function DataTable({ data = [], onSelectCard, onUpdateStatus, onDeleteCard }) {
  const { t } = useThemeLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredData = useMemo(() => {
    return (data || [])
      .filter((item) => {
        if (filterStatus === "pending") return item.status === "open" && (item.balance_due || 0) > 0;
        if (filterStatus === "urgent") return item.status === "open" && item.needs_attention;
        if (filterStatus === "done") return item.status === "done";
        return true;
      })
      .filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.person?.toLowerCase().includes(q) ||
          item.item?.toLowerCase().includes(q) ||
          item.id?.toString().includes(q)
        );
      });
  }, [data, filterStatus, searchQuery]);

  return (
    <div className="flex flex-col gap-3 px-4 lg:px-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <Input
            placeholder={t("search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === "all"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {t("all_orders")} ({data.length})
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === "pending"
                ? "bg-red-600 text-white shadow-2xs font-bold"
                : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
            }`}
          >
            {t("pending_dues")} ({data.filter((c) => c.status === "open" && (c.balance_due || 0) > 0).length})
          </button>
          <button
            onClick={() => setFilterStatus("urgent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === "urgent"
                ? "bg-amber-600 text-white shadow-2xs font-bold"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            }`}
          >
            {t("urgent_filter")} ({data.filter((c) => c.status === "open" && c.needs_attention).length})
          </button>
          <button
            onClick={() => setFilterStatus("done")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === "done"
                ? "bg-emerald-600 text-white shadow-2xs font-bold"
                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            }`}
          >
            {t("settled_filter")} ({data.filter((c) => c.status === "done").length})
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("th_order_customer")}</th>
                <th className="py-3 px-4">{t("th_item")}</th>
                <th className="py-3 px-4 text-right">{t("th_total")}</th>
                <th className="py-3 px-4 text-right">{t("th_advance")}</th>
                <th className="py-3 px-4 text-right">{t("th_balance")}</th>
                <th className="py-3 px-4">{t("th_deadline")}</th>
                <th className="py-3 px-4 text-center">{t("th_status")}</th>
                <th className="py-3 px-4 text-right">{t("th_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                    {t("no_orders_found")}
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isPending = (row.balance_due || 0) > 0;
                  const isDone = row.status === "done";
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => onSelectCard?.(row)}
                    >
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{row.person || "Unknown Customer"}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">#{row.id}</span>
                      </td>

                      {/* Item */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{row.item || "Standard Order"}</span>
                        {row.service_type && (
                          <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-medium capitalize">
                            {row.service_type}
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        ₹{(row.amount || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Advance */}
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{(row.advance || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-extrabold ${
                            isPending ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          ₹{(row.balance_due || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{row.due_date || "Not specified"}</span>
                        </div>
                        {row.needs_attention && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> {t("pb_due_soon")}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isDone ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {t("fc_completed")}
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                            {t("fc_pending_due")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {t("fc_fully_paid")}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            onClick={() => onSelectCard?.(row)}
                            title="View Full Flashcard Slip"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            {t("card_view")}
                          </Button>
                          {onUpdateStatus && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-7 px-2 text-[11px] font-semibold ${
                                isDone
                                  ? "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  : "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                              }`}
                              onClick={() =>
                                onUpdateStatus(row.id, isDone ? "open" : "done")
                              }
                            >
                              {isDone ? t("reopen") : t("pb_mark_paid")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
