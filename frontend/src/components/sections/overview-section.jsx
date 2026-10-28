"use client";

import React from "react";
import { SectionCards } from "@/components/section-cards";
import { DataTable } from "@/components/data-table";

export function OverviewSection({
  cards = [],
  health = {},
  onSelectCard,
  onUpdateStatus,
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-5 md:py-5">
          {/* Top Metric Summary Cards */}
          <SectionCards cards={cards} health={health} />

          {/* Clean Master Orders Table (Chart removed per user request) */}
          <DataTable
            data={cards}
            onSelectCard={onSelectCard}
            onUpdateStatus={onUpdateStatus}
          />
        </div>
      </div>
    </div>
  );
}
