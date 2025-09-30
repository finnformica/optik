"use client";

import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import {
  mockPortfolioSummary,
  mockWeeklyData,
  mockPositions,
  mockPortfolioDistribution,
} from "./mock-data";

export function DashboardMockup() {
  return (
    <div className="relative">
      {/* Glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl backdrop-blur-sm" />

      <div className="relative bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <svg className="h-4 w-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Portfolio Dashboard</h2>
                <p className="text-sm text-muted-foreground">Real-time analytics</p>
              </div>
            </div>
            <div className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
              Live
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <SummaryStats portfolioSummary={mockPortfolioSummary} />

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Returns Chart */}
            <WeeklyReturnsChart weeklyData={mockWeeklyData} />

            {/* Portfolio Distribution */}
            <PortfolioDistribution
              distribution={mockPortfolioDistribution}
              cashBalance={parseFloat(mockPortfolioSummary.cashBalance || "0")}
            />
          </div>

          {/* Current Positions */}
          <CurrentPositions positions={mockPositions} />
        </div>
      </div>
    </div>
  );
}