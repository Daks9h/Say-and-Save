"use client";

import React, { useState } from "react";
import {
  Layers,
  Edit3,
  Mail,
  Phone,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useThemeLang } from "@/lib/theme-lang-context";

export function FlashcardsSection({
  cards = [],
  activeCard = null,
  onSelectCard,
  onUpdateCard,
  onSendAlert,
  ownerEmail = "",
  ownerPhone = "",
  shopType = "tailor",
}) {
  const { t } = useThemeLang();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [alertFeedback, setAlertFeedback] = useState("");

  const currentCard = activeCard || cards[0] || null;
  const currentIndex = cards.findIndex((c) => c.id === currentCard?.id);

  const handleStartEdit = () => {
    if (!currentCard) return;
    setEditForm({
      person: currentCard.person || "",
      item: currentCard.item || "",
      amount: currentCard.amount || 0,
      advance: currentCard.advance || 0,
      due_date: currentCard.due_date || "",
      delivery_deadline: currentCard.delivery_deadline || "",
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!currentCard || !onUpdateCard) return;
    await onUpdateCard(currentCard.id, editForm);
    setEditing(false);
  };

  const handleTriggerAlert = async (type) => {
    if (!currentCard || !onSendAlert) return;
    const res = await onSendAlert(currentCard, type);
    setAlertFeedback(res?.message || `${type.toUpperCase()} alert processed successfully.`);
    setTimeout(() => setAlertFeedback(""), 4000);
  };

  const handleNavigate = (direction) => {
    if (cards.length === 0) return;
    const nextIdx = (currentIndex + direction + cards.length) % cards.length;
    onSelectCard?.(cards[nextIdx]);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 max-w-4xl mx-auto w-full py-4">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t("fc_title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("fc_desc")}
          </p>
        </div>

        {cards.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("fc_slip_counter")} {currentIndex + 1} {t("fc_of")} {cards.length}
            </span>
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleNavigate(-1)}
                disabled={cards.length <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleNavigate(1)}
                disabled={cards.length <= 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Flashcard Container */}
      {!currentCard ? (
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t("fc_no_cards")}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {t("fc_no_cards_desc")}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Physical Flashcard Slip Card */}
          <div className="relative rounded-2xl bg-gradient-to-b from-amber-50/40 dark:from-slate-900 to-white dark:to-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md p-6 sm:p-8 overflow-hidden transition-colors">
            {/* Top Slip Perforation Graphic */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Slip Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  #{currentCard.id}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
                    {t("fc_slip_prefix")} &bull; {shopType.toUpperCase()}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                    {currentCard.person || "Unknown Customer"}
                  </h3>
                </div>
              </div>

              {/* Status and Edit Toggle */}
              <div className="flex items-center gap-2">
                {currentCard.status === "done" ? (
                  <Badge variant="success" className="text-xs font-bold px-2.5 py-1">
                    {t("fc_completed")}
                  </Badge>
                ) : (currentCard.balance_due || 0) > 0 ? (
                  <Badge variant="destructive" className="text-xs font-bold px-2.5 py-1 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                    {t("fc_pending_due")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs font-bold px-2.5 py-1">
                    {t("fc_fully_paid")}
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={editing ? () => setEditing(false) : handleStartEdit}
                  className="h-8 text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  {editing ? t("fc_cancel_edit") : t("fc_edit_btn")}
                </Button>
              </div>
            </div>

            {/* Slip Body: Edit Mode vs View Mode */}
            {editing ? (
              <div className="py-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("fc_customer")}</label>
                    <Input
                      value={editForm.person}
                      onChange={(e) => setEditForm({ ...editForm, person: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("fc_item")}</label>
                    <Input
                      value={editForm.item}
                      onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("fc_total_bill")} (₹)</label>
                    <Input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("fc_advance_paid")} (₹)</label>
                    <Input
                      type="number"
                      value={editForm.advance}
                      onChange={(e) => setEditForm({ ...editForm, advance: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{t("fc_balance_due")}:</span>
                  <span className="font-extrabold text-red-600 dark:text-red-400 text-sm">
                    ₹{Math.max(0, (editForm.amount || 0) - (editForm.advance || 0)).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> {t("fc_save_btn")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-6">
                {/* 4 Financial Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                  <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">{t("fc_item")}</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">{currentCard.item || "Standard Order"}</p>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{currentCard.service_type || "Custom Service"}</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">{t("fc_total_bill")}</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">₹{(currentCard.amount || 0).toLocaleString("en-IN")}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">{t("fc_advance_paid")}</span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(currentCard.advance || 0).toLocaleString("en-IN")}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 shadow-2xs">
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider block">{t("fc_balance_due")}</span>
                    <p className="text-base font-extrabold text-red-600 dark:text-red-400 mt-0.5">₹{(currentCard.balance_due || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Pack-Specific Measurements */}
                {currentCard.measurements && Object.keys(currentCard.measurements).length > 0 && (
                  <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2 font-mono">
                      {t("fc_specs")}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {Object.entries(currentCard.measurements).map(([key, val]) => (
                        <div key={key} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">{key}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Deadline */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t("fc_deadline")}: </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{currentCard.due_date || "Within 5 days"}</span>
                    </div>
                  </div>
                  {currentCard.needs_attention && (
                    <Badge variant="destructive" className="text-[10px] font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-3 h-3" /> {t("pb_due_soon")}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Slip Footer: Dispatch to Owner Credentials */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-left text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  {t("fc_owner_creds")}
                </span>
                <p className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {ownerEmail || "owner@dukaandiary.com"}
                  <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                  <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {ownerPhone || "+91 9876543210"}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={() => handleTriggerAlert("email")}
                  className="flex-1 sm:flex-initial h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" /> {t("fc_email_btn")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTriggerAlert("sms")}
                  className="flex-1 sm:flex-initial h-8 text-xs font-semibold shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 mr-1.5" /> {t("fc_sms_btn")}
                </Button>
              </div>
            </div>

            {/* Notification Feedback Toast */}
            {alertFeedback && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold text-center animate-in fade-in">
                {alertFeedback}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
