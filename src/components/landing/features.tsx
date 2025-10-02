"use client";

import {
  BrokerIntegrationFeature,
  MultipleAccountsFeature,
  StockPricesFeature,
  TaxCalculationsFeature,
  TradingActivityFeature,
} from "./feature-components";

export function Features() {
  return (
    <section
      id="features"
      className="relative z-20 -mt-44 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Powerful Features to Elevate Your Financial
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-xl">
            From broker integrations to advanced analytics, Optik provides all
            the tools you need to make informed trading decisions and track your
            performance.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="mb-6 grid grid-cols-12 gap-6">
          <BrokerIntegrationFeature />
          <MultipleAccountsFeature />
          <StockPricesFeature />
          <TradingActivityFeature />
        </div>

        {/* Coming Soon Section */}
        <TaxCalculationsFeature />
      </div>
    </section>
  );
}
