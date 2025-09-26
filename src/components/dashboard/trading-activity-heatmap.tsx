"use client";

import { DashboardWidget } from "@/components/dashboard/dashboard-widget";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ViewDailyActivity } from "@/lib/db/schema";
import { useEffect, useRef } from "react";

interface TradingActivityHeatmapProps {
  dailyData: ViewDailyActivity[];
}

interface HeatmapDay {
  date: string;
  tradeCount: number;
  dailyPremium: number;
  dailyReturnPercent: number;
  expiringContracts: number;
  expiringSymbols: string | null;
  isCurrentDate: boolean;
  isEmpty: boolean;
}

const TradingActivityHeatmap = ({ dailyData }: TradingActivityHeatmapProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Process data into grid format
  const processedData = dailyData.map((day) => ({
    date: day.date || "",
    tradeCount: Number(day.tradeCount || 0),
    dailyPremium: parseFloat(day.dailyPremium || "0"),
    dailyReturnPercent: parseFloat(day.dailyReturnPercent || "0"),
    expiringContracts: Number(day.expiringContracts || 0),
    expiringSymbols: day.expiringSymbols,
    isCurrentDate: Boolean(day.isCurrentDate),
    isEmpty:
      Number(day.tradeCount || 0) === 0 &&
      Number(day.expiringContracts || 0) === 0,
  }));

  // Make Tailwind color utility classes available at runtime for dynamic calculation
  // Tailwind safelist: bg-blue-500/20 bg-blue-500/30 bg-blue-500/40 bg-blue-500/50 bg-blue-500/60 bg-blue-500/70 bg-blue-500/80 bg-blue-500/90
  // Tailwind safelist: bg-red-500/20 bg-red-500/30 bg-red-500/40 bg-red-500/50 bg-red-500/60 bg-red-500/70 bg-red-500/80 bg-red-500/90

  // Get color intensity based on return percentage (interpolated opacity, max at 1.2%)
  const getColorIntensity = (returnPercent: number): string => {
    const absPercent = Math.abs(returnPercent);
    const isPositive = returnPercent >= 0;

    if (absPercent === 0) return "bg-gray-800"; // No activity

    // Interpolate opacity from 0 to 100 based on 0% to 1.2% range
    const maxPercent = 1.2;
    const normalizedPercent = Math.min(absPercent / maxPercent, 1); // Cap at 1 (100%)

    // Convert to opacity percentage (20% minimum for visibility, 100% maximum)
    const minOpacity = 20;
    const calculatedOpacity = Math.round(
      minOpacity + (100 - minOpacity) * normalizedPercent,
    );

    // Floor to nearest 10 for Tailwind compatibility
    const opacity = Math.floor(calculatedOpacity / 10) * 10;

    const baseColor = isPositive ? "bg-blue-500" : "bg-red-500";

    if (opacity >= 100) {
      return baseColor; // Full opacity, no transparency
    } else {
      return `${baseColor}/${opacity}`;
    }
  };

  // Create grid weeks from data
  const createGrid = () => {
    if (processedData.length === 0) return [];

    // Sort data by date (oldest to newest for grid layout)
    const sortedData = [...processedData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Group by weeks (Sunday start)
    const weeks: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    sortedData.forEach((day) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) return;

      // Convert to Monday-based index (1=Monday becomes 0, 5=Friday becomes 4)
      const mondayBasedIndex = dayOfWeek - 1;

      // If starting a new week or current week is complete
      if (currentWeek.length === 0 || mondayBasedIndex === 0) {
        if (currentWeek.length > 0) {
          weeks.push([...currentWeek]);
        }
        currentWeek = [];
      }

      currentWeek[mondayBasedIndex] = day;

      // Fill empty days in the week if needed
      for (let i = 0; i < 5; i++) {
        if (!currentWeek[i]) {
          const weekDate = new Date(date);
          weekDate.setDate(date.getDate() + (i - mondayBasedIndex));
          currentWeek[i] = {
            date: weekDate.toISOString().split("T")[0],
            tradeCount: 0,
            dailyPremium: 0,
            dailyReturnPercent: 0,
            expiringContracts: 0,
            expiringSymbols: null,
            isCurrentDate: false,
            isEmpty: true,
          };
        }
      }
    });

    // Push the last week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = createGrid();
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // Create month labels
  const getMonthLabels = () => {
    if (weeks.length === 0) return [];

    const monthLabels: Array<{
      month: string;
      weekIndex: number;
      span: number;
    }> = [];
    let currentMonth: number | null = null;
    let monthStart = 0;

    weeks.forEach((week, weekIndex) => {
      // Use the Monday (first day) of each week to determine the month, including empty days
      const firstDay = week[0]; // Monday is always index 0
      if (!firstDay) return;

      const weekMonth = new Date(firstDay.date).getMonth();

      if (currentMonth === null) {
        currentMonth = weekMonth;
        monthStart = weekIndex;
      } else if (weekMonth !== currentMonth) {
        // Month changed, save the previous month
        const monthName = new Date(0, currentMonth).toLocaleDateString(
          "en-US",
          { month: "short" },
        );
        monthLabels.push({
          month: monthName,
          weekIndex: monthStart,
          span: weekIndex - monthStart,
        });

        currentMonth = weekMonth;
        monthStart = weekIndex;
      }
    });

    // Add the last month
    if (currentMonth !== null) {
      const monthName = new Date(0, currentMonth).toLocaleDateString("en-US", {
        month: "short",
      });
      monthLabels.push({
        month: monthName,
        weekIndex: monthStart,
        span: weeks.length - monthStart,
      });
    }

    return monthLabels;
  };

  const monthLabels = getMonthLabels();

  // Auto-scroll to right side on mount and when data changes
  useEffect(() => {
    const scrollToRight = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft =
          scrollContainerRef.current.scrollWidth;
      }
    };

    // Scroll on mount and data change
    scrollToRight();

    // Scroll on window resize to maintain right position
    const handleResize = () => {
      scrollToRight();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [processedData.length]); // Re-run when data changes

  // Format tooltip content
  const formatTooltip = (day: HeatmapDay) => {
    const date = new Date(day.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (day.isEmpty) {
      return `${date} • No activity`;
    }

    const parts = [];
    if (day.tradeCount > 0) {
      parts.push(`${day.tradeCount} trade${day.tradeCount !== 1 ? "s" : ""}`);
      parts.push(
        `$${day.dailyPremium.toFixed(2)} (${day.dailyReturnPercent.toFixed(2)}%)`,
      );
    }
    if (day.expiringContracts > 0) {
      parts.push(`${day.expiringContracts} expiring: ${day.expiringSymbols}`);
    }

    return `${date} • ${parts.join(" • ")}`;
  };

  return (
    <DashboardWidget
      title="Trading Activity"
      contentClassName="p-4 flex flex-col justify-between"
    >
      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex overflow-x-scroll"
      >
        {/* Sticky day labels */}
        <div className="sticky left-0 z-10 flex flex-col justify-end gap-1 bg-[#1a2236] pr-2 text-xs text-gray-400">
          {dayNames.map((day) => (
            <div key={day} className="flex h-10 items-center">
              {day}
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          {/* Month labels */}
          <div className="mb-2 flex text-xs text-gray-400">
            {monthLabels.map((label, index) => (
              <div
                key={index}
                className="flex-shrink-0 text-left"
                style={{
                  width: `${label.span * 40 + (label.span - 1) * 4}px`, // w-10 (40px) * span + gap (4px) * (span - 1)
                  marginRight: index < monthLabels.length - 1 ? "4px" : "0",
                  paddingLeft: "2px",
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1 p-0.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  const baseClasses =
                    "w-10 h-10 rounded-[4px] relative cursor-pointer transition-all duration-150";
                  const colorClass = getColorIntensity(day.dailyReturnPercent);

                  return (
                    <Tooltip key={`${weekIndex}-${dayIndex}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={`${baseClasses} ${colorClass} hover:ring-2 hover:ring-neutral-50`}
                        >
                          {/* Indicator dots */}
                          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 transform gap-1">
                            {/* Current day dot */}
                            {day.isCurrentDate && (
                              <div className="h-2 w-2 rounded-full bg-purple-400" />
                            )}
                            {/* Expiry dot */}
                            {day.expiringContracts > 0 && (
                              <div className="h-2 w-2 rounded-full bg-yellow-400" />
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="border-gray-600 bg-gray-700 [&_.bg-primary]:!bg-gray-700 [&_.fill-primary]:!fill-gray-700">
                        <p className="text-sm text-white">
                          {formatTooltip(day)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-row items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-xs bg-gray-800" />
            <div className="h-3 w-3 rounded-xs bg-blue-500/30" />
            <div className="h-3 w-3 rounded-xs bg-blue-500/50" />
            <div className="h-3 w-3 rounded-xs bg-blue-500/75" />
            <div className="h-3 w-3 rounded-xs bg-blue-500" />
          </div>
          <span>More</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="relative h-3 w-3 rounded-xs bg-gray-700">
              <div className="absolute inset-1 rounded-full bg-purple-400" />
            </div>
            <span>Today</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative h-3 w-3 rounded-xs bg-gray-700">
              <div className="absolute inset-1 rounded-full bg-yellow-400" />
            </div>
            <span>Expiry</span>
          </div>
        </div>
      </div>
    </DashboardWidget>
  );
};

export default TradingActivityHeatmap;
