"use client";

import React from "react";
import { Mic, Square, Upload, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useThemeLang } from "@/lib/theme-lang-context";

export function RecorderSection({
  shopType = "tailor",
  isRecording = false,
  recordingSeconds = 0,
  isProcessing = false,
  processingStatus = "",
  lastGeneratedCard = null,
  onStartRecording,
  onStopRecording,
  onUploadAudio,
  onTestAudio,
  onViewFlashcard,
}) {
  const { t } = useThemeLang();

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 max-w-4xl mx-auto w-full py-4">
      {/* Intro Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Mic className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t("rec_title")}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("rec_desc")}
        </p>
      </div>

      {/* Main Dedicated Recording Studio */}
      <Card className="border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t("rec_studio")}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {t("rec_studio_sub")}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-semibold uppercase px-2.5 py-0.5 border-slate-200 dark:border-slate-700">
            {shopType.toUpperCase()}
          </Badge>
        </CardHeader>

        <CardContent className="p-8 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center py-10 px-6 w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40">
            {isRecording ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center animate-pulse-ring shadow-lg">
                  <Square className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-red-600 dark:text-red-400 font-extrabold font-mono text-base block">
                    {t("rec_listening")} 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t("rec_speak_hint")}
                  </p>
                </div>
                <Button
                  onClick={onStopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 h-10 shadow-md mt-2"
                >
                  {t("rec_stop_btn")}
                </Button>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center animate-spin">
                  <Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {processingStatus || "Processing Audio..."}
                  </h4>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <button
                  onClick={onStartRecording}
                  className="w-24 h-24 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition duration-150 group"
                >
                  <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                </button>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t("rec_click_speak")}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 italic">
                    {t(`rec_example_${shopType}`) || t("rec_example_hint")}
                  </p>
                </div>
              </div>
            )}

            {/* Audio Options */}
            {!isRecording && !isProcessing && (
              <div className="mt-8 pt-5 border-t border-slate-200/80 dark:border-slate-800 w-full flex flex-wrap items-center justify-center gap-4 text-xs">
                <label className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t("rec_upload_btn")}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={onUploadAudio}
                    className="hidden"
                  />
                </label>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTestAudio}
                  className="h-8 text-xs font-semibold shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                  {t("rec_test_btn")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Result Banner */}
      {lastGeneratedCard && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/80 dark:bg-emerald-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                {t("rec_card_created")}
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {lastGeneratedCard.person || "Customer"} &bull; {lastGeneratedCard.item || "Order"} &bull; {t("fc_balance_due")}: ₹{(lastGeneratedCard.balance_due || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <Button
            onClick={() => onViewFlashcard?.(lastGeneratedCard)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 px-4 shadow-2xs flex items-center gap-1.5"
          >
            <span>{t("rec_open_flashcard")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
