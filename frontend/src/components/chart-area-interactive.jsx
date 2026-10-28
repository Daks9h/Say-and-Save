"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ChartAreaInteractive({ cards = [] }) {
  const [metric, setMetric] = useState("balance"); // "balance", "total", "advance"

  // Aggregate metrics over dummy / real order dates
  const chartData = useMemo(() => {
    // Generate 7-day trend from orders or fallbacks
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const totalByDay = [1400, 2800, 1900, 4200, 3100, 5600, 2200];
    const advanceByDay = [600, 1200, 900, 2000, 1500, 3000, 1000];
    const balanceByDay = [800, 1600, 1000, 2200, 1600, 2600, 1200];

    // If real cards exist, factor them into recent days
    if (cards.length > 0) {
      const realTotal = cards.reduce((acc, c) => acc + (c.amount || 0), 0);
      const realAdvance = cards.reduce((acc, c) => acc + (c.advance || 0), 0);
      const realBalance = cards.reduce((acc, c) => acc + (c.balance_due || 0), 0);
      totalByDay[6] = Math.max(totalByDay[6], realTotal);
      advanceByDay[6] = Math.max(advanceByDay[6], realAdvance);
      balanceByDay[6] = Math.max(balanceByDay[6], realBalance);
    }

    return days.map((day, idx) => ({
      day,
      total: totalByDay[idx],
      advance: advanceByDay[idx],
      balance: balanceByDay[idx],
    }));
  }, [cards]);

  const activeValues = chartData.map((d) => d[metric]);
  const maxValue = Math.max(...activeValues, 100);

  // SVG dimensions
  const width = 600;
  const height = 180;
  const padding = 20;

  const points = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
    const y = height - padding - (d[metric] / maxValue) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const areaPoints = [
    `${padding},${height - padding}`,
    ...points,
    `${width - padding},${height - padding}`,
  ].join(" ");

  const colorScheme = {
    balance: { stroke: "#dc2626", fill: "rgba(220, 38, 38, 0.12)", label: "Pending Dues" },
    advance: { stroke: "#16a34a", fill: "rgba(22, 163, 74, 0.12)", label: "Advance Received" },
    total: { stroke: "#4f46e5", fill: "rgba(79, 70, 229, 0.12)", label: "Total Billed" },
  };

  const currentTheme = colorScheme[metric];

  return (
    <Card className="border-slate-200/80 bg-white shadow-2xs">
      <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900">
            Financial Ledger Trends
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Interactive breakdown of receivables, collected advances, and bill totals
          </CardDescription>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setMetric("balance")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              metric === "balance"
                ? "bg-white text-red-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending Dues
          </button>
          <button
            onClick={() => setMetric("advance")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              metric === "advance"
                ? "bg-white text-emerald-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Advance Collected
          </button>
          <button
            onClick={() => setMetric("total")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              metric === "total"
                ? "bg-white text-indigo-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Total Billed
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3">
        {/* Metric Summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active Metric:</span>
            <Badge variant="outline" className="text-xs font-bold text-slate-800">
              {currentTheme.label}
            </Badge>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            Peak: ₹{maxValue.toLocaleString("en-IN")}
          </span>
        </div>

        {/* SVG Area Chart */}
        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentTheme.stroke} stopOpacity="0.25" />
                <stop offset="100%" stopColor={currentTheme.stroke} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" />

            {/* Area fill */}
            <polygon points={areaPoints} fill="url(#areaGradient)" />

            {/* Line stroke */}
            <polyline
              fill="none"
              stroke={currentTheme.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points.join(" ")}
            />

            {/* Interactive Points */}
            {chartData.map((d, i) => {
              const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
              const y = height - padding - (d[metric] / maxValue) * (height - 2 * padding);
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#ffffff"
                    stroke={currentTheme.stroke}
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={height - 2}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-semibold"
                  >
                    {d.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

