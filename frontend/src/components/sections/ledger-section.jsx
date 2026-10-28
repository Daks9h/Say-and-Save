"use client";

import React from "react";
import { Table2, RefreshCw } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useThemeLang } from "@/lib/theme-lang-context";

export function LedgerSection({
  cards = [],
  onSelectCard,
  onUpdateStatus,
  onRefresh,
}) {
  const { t } = useThemeLang();

  return (
    <div className="flex flex-col gap-5 py-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 lg:px-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Table2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t("ledger_title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("ledger_desc")}
          </p>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 text-xs font-semibold shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t("ledger_refresh")}
          </Button>
        )}
      </div>

      {/* Full Data Table */}
      <DataTable
        data={cards}
        onSelectCard={onSelectCard}
        onUpdateStatus={onUpdateStatus}
      />
    </div>
  );
}
