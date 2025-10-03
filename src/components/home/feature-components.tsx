"use client";

import {
  Building2,
  Calculator,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Upload,
} from "lucide-react";

import TradingActivityHeatmap from "@/components/dashboard/trading-activity-heatmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { FeatureCard } from "./feature-card";
import {
  mockAccounts,
  mockStockPrices,
  mockTradingActivity,
} from "./mock-data";

// 1. Direct Broker Integration Component
export function BrokerIntegrationFeature() {
  return (
    <FeatureCard
      title="Direct Broker Integration"
      description="Connect directly to your broker for automatic transaction retrieval, or import CSV files for manual uploads."
      className="col-span-12 lg:col-span-8"
      contentClassName="flex-grow"
    >
      <div className="h-full overflow-hidden p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Connected Brokers */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-foreground text-sm font-medium">
              Connected Brokers
            </h4>
            <div className="flex-grow space-y-2">
              <div className="bg-card/50 border-border/50 flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium">Charles Schwab</span>
                </div>
                <Badge
                  variant="secondary"
                  className="border-green-500/20 bg-green-500/10 text-green-400"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              </div>
              <div className="bg-card/50 border-border/50 flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">
                    Interactive Brokers
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="border-orange-500/20 bg-orange-500/10 text-orange-400"
                >
                  Coming Soon
                </Badge>
              </div>
              <div className="bg-card/50 border-border/50 flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">Robinhood</span>
                </div>
                <Badge
                  variant="secondary"
                  className="border-orange-500/20 bg-orange-500/10 text-orange-400"
                >
                  Coming Soon
                </Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs">
              Request Broker Integration
            </Button>
          </div>

          {/* CSV Upload */}
          <div className="flex flex-grow flex-col space-y-3">
            <h4 className="text-foreground text-sm font-medium">
              Manual Upload
            </h4>
            <div className="border-border bg-muted/20 flex flex-grow flex-col justify-center rounded-lg border-2 border-dashed p-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="text-muted-foreground h-6 w-6" />
                <span className="text-muted-foreground text-xs">
                  Drop CSV files here or click to browse
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 cursor-default text-xs"
                >
                  Upload CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureCard>
  );
}

// 2. Multiple Accounts Feature Component
export function MultipleAccountsFeature() {
  return (
    <FeatureCard
      title="Track Multiple Accounts"
      description="Manage multiple brokerage accounts in one place. Switch between portfolios effortlessly."
      className="col-span-12 lg:col-span-4"
      contentClassName="h-64"
    >
      <div className="h-full space-y-4 overflow-hidden p-6">
        <div className="space-y-2">
          {mockAccounts.map((account) => {
            const IconComponent = account.icon;
            return (
              <div
                key={account.id}
                className={`${account.bgColor} ${account.borderColor} flex items-center justify-between rounded-lg border p-3`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`${account.avatarBg} flex h-8 w-8 items-center justify-center rounded-full`}
                  >
                    <IconComponent className={`${account.iconColor} h-4 w-4`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{account.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {account.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${account.isPrimary ? "text-primary" : ""}`}
                  >
                    {account.balance}
                  </div>
                  <div className={`text-xs ${account.changeColor}`}>
                    {account.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FeatureCard>
  );
}

// 3. Trading Activity Feature Component
export function TradingActivityFeature() {
  return (
    <FeatureCard
      title="Track Trading Activity"
      description="Visualise your trading patterns and activity with comprehensive performance analytics and trade history."
      className="col-span-12 lg:col-span-8"
      contentClassName="h-96"
    >
      <TradingActivityHeatmap dailyData={mockTradingActivity} />
    </FeatureCard>
  );
}

// 4. Real-time Stock Prices Feature Component
export function StockPricesFeature() {
  return (
    <FeatureCard
      title="Real-Time Stock Prices"
      description="Easily evaluate if your options are in-the-money"
      className="col-span-12 lg:col-span-4"
      contentClassName="h-96"
    >
      <div className="h-full space-y-2 overflow-hidden p-6">
        <h4 className="text-foreground mb-4 text-sm font-medium">
          Live Market Data
        </h4>

        {mockStockPrices.map((stock, index) => {
          const IconComponent = stock.icon;

          return (
            <div
              key={stock.symbol}
              className="bg-card/50 border-border/50 hover:bg-card/70 flex items-center justify-between rounded-lg border p-3 transition-colors duration-200"
            >
              <div className="flex flex-grow items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${stock.color}20`,
                    border: `1px solid ${stock.color}40`,
                  }}
                >
                  <IconComponent
                    className="h-5 w-5"
                    style={{ color: stock.color }}
                  />
                </div>
                <div className="flex-grow">
                  <div className="text-sm font-semibold">{stock.symbol}</div>
                  <div className="text-muted-foreground max-w-[80%] truncate text-xs">
                    {stock.company}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  ${stock.price.toFixed(2)}
                </div>
                <div
                  className={`flex items-center justify-end gap-1 text-xs font-medium ${stock.isUp ? "text-green-400" : "text-red-400"}`}
                >
                  <TrendingUp
                    className={`h-3 w-3 ${!stock.isUp ? "rotate-180" : ""}`}
                  />
                  {stock.isUp ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </FeatureCard>
  );
}

// 5. UK Tax Calculations Coming Soon Component
export function TaxCalculationsFeature() {
  return (
    <div className="border-border/50 from-card via-card/80 to-card/60 relative overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm">
      {/* Animated background elements */}
      <div className="from-primary/10 absolute inset-0 bg-gradient-to-br via-transparent to-purple-500/10" />
      <div className="from-primary/20 absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-bl to-transparent blur-2xl" />
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-gradient-to-tr from-purple-500/20 to-transparent blur-xl" />

      <div className="relative p-8">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="from-primary to-primary/80 shadow-primary/25 rounded-xl bg-gradient-to-br p-3 shadow-lg">
              <Calculator className="text-primary-foreground h-8 w-8" />
            </div>
            <div>
              <h3 className="mb-1 text-2xl font-bold">UK Tax Calculations</h3>
              <p className="text-muted-foreground text-sm">
                Tools to help with UK tax obligations
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="from-primary/20 text-primary border-primary/30 bg-gradient-to-r to-purple-500/20 shadow-md"
          >
            <span className="relative mr-2 flex h-2 w-2">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
            </span>
            Coming Soon - Q1 2026
          </Badge>
        </div>

        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          Get assistance with UK tax obligations including Capital Gains Tax
          calculations, FX conversions, and broker fee tracking to help simplify
          your tax reporting.
        </p>

        {/* Enhanced mock calculator interface */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <div className="text-primary flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4" />
              Capital Gains Summary
            </div>
            <div className="from-card/80 to-card/40 border-border/50 rounded-lg border bg-gradient-to-br p-4 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Gains:</span>
                  <span className="font-medium text-green-400">£2,450.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Losses:</span>
                  <span className="font-medium text-red-400">£580.00</span>
                </div>
                <div className="via-border h-px bg-gradient-to-r from-transparent to-transparent" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Net Gains:</span>
                  <span className="text-primary">£1,870.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
              <RefreshCw className="h-4 w-4" />
              FX & Conversions
            </div>
            <div className="from-card/80 to-card/40 border-border/50 rounded-lg border bg-gradient-to-br p-4 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>USD → GBP:</span>
                  <span className="font-medium">1.2750</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>FX Fees:</span>
                  <span className="font-medium text-red-400">£125.30</span>
                </div>
                <div className="via-border h-px bg-gradient-to-r from-transparent to-transparent" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Converted:</span>
                  <span className="text-purple-400">£13,245.80</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
              <Building2 className="h-4 w-4" />
              Broker Fees
            </div>
            <div className="from-card/80 to-card/40 border-border/50 rounded-lg border bg-gradient-to-br p-4 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Trading Fees:</span>
                  <span className="font-medium">£45.20</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fees:</span>
                  <span className="font-medium">£15.00</span>
                </div>
                <div className="via-border h-px bg-gradient-to-r from-transparent to-transparent" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Fees:</span>
                  <span className="text-amber-400">£60.20</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className="from-primary/10 border-primary/30 hover:bg-primary/20 bg-gradient-to-r to-purple-500/10"
          >
            Get Notified When Available
          </Button>
        </div>
      </div>
    </div>
  );
}
