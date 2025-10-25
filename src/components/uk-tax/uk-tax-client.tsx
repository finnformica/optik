"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface TradingProfitLoss {
  totalProfitsUsd: number;
  totalLossesUsd: number;
  totalFeesUsd: number;
  netGainUsd: number;
  netGainGbp: number;
  stockProfits: number;
  stockLosses: number;
  stockFees: number;
  optionsGrossProfits: number;
  optionsGrossLosses: number;
  optionsFees: number;
  exchangeRate: number;
}

interface CgtCalculation {
  netGainGbp: number;
  annualAllowance: number;
  taxableGain: number;
  cgtLiability18: number;
  cgtLiability24: number;
}

interface UkTaxClientProps {
  profitLoss: TradingProfitLoss;
  cgtCalculation: CgtCalculation;
}

export function UkTaxClient({ profitLoss, cgtCalculation }: UkTaxClientProps) {
  const [taxRate, setTaxRate] = useState<"basic" | "higher">("higher");

  const selectedCgtLiability =
    taxRate === "basic"
      ? cgtCalculation.cgtLiability18
      : cgtCalculation.cgtLiability24;

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Profit/Loss Breakdown */}
      <Card className="border-gray-800 bg-[#1a2236]">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-white">
            Trading Profit/Loss Breakdown (2025/26)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Profits Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-green-400">
                Profits (USD)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stock Profits:</span>
                  <span className="text-green-400">
                    ${profitLoss.stockProfits.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Options Gross Profits:</span>
                  <span className="text-green-400">
                    ${profitLoss.optionsGrossProfits.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 border-t border-gray-600 pt-1">
                  <div className="h-12"></div>{" "}
                  {/* Spacer to align with fees section */}
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="font-medium text-white">Total Profits:</span>
                  <span className="font-bold text-green-400">
                    ${profitLoss.totalProfitsUsd.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Losses & Fees Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-red-400">
                Losses & Fees (USD)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stock Losses:</span>
                  <span className="text-red-400">
                    ${profitLoss.stockLosses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Options Gross Losses:</span>
                  <span className="text-red-400">
                    ${profitLoss.optionsGrossLosses.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 border-t border-gray-600 pt-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stock Fees:</span>
                    <span className="text-red-400">
                      ${profitLoss.stockFees.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Options Fees:</span>
                    <span className="text-red-400">
                      ${profitLoss.optionsFees.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="font-medium text-white">
                    Total Losses + Fees:
                  </span>
                  <span className="font-bold text-red-400">
                    $
                    {(
                      profitLoss.totalLossesUsd + profitLoss.totalFeesUsd
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Gain - Dual Currency */}
          <div className="space-y-2 border-t border-gray-700 pt-4 text-center">
            <p className="text-sm text-gray-400">Net Trading Gain</p>
            <div className="space-y-1">
              <p
                className={`text-2xl font-bold ${profitLoss.netGainUsd >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                ${profitLoss.netGainUsd.toLocaleString()} USD
              </p>
              <p
                className={`text-xl font-medium ${profitLoss.netGainGbp >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                £{profitLoss.netGainGbp.toLocaleString()} GBP
              </p>
              <p className="text-xs text-gray-500">
                Exchange rate: 1 USD = {profitLoss.exchangeRate.toFixed(4)} GBP
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CGT Calculation */}
      <Card className="border-gray-800 bg-[#1a2236]">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-white">
            Capital Gains Tax Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {/* Tax Rate Selector */}
          <div className="space-y-2">
            <Label className="text-gray-300">Tax Rate</Label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="radio"
                  name="taxRate"
                  value="basic"
                  checked={taxRate === "basic"}
                  onChange={(e) =>
                    setTaxRate(e.target.value as "basic" | "higher")
                  }
                  className="text-blue-600"
                />
                <span className="text-white">Basic Rate (18%)</span>
              </label>
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="radio"
                  name="taxRate"
                  value="higher"
                  checked={taxRate === "higher"}
                  onChange={(e) =>
                    setTaxRate(e.target.value as "basic" | "higher")
                  }
                  className="text-blue-600"
                />
                <span className="text-white">Higher Rate (24%)</span>
              </label>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Net Trading Gain (GBP):</span>
              <span className="text-white">
                £{cgtCalculation.netGainGbp.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Annual Allowance:</span>
              <span className="text-blue-400">
                -£{cgtCalculation.annualAllowance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="font-medium text-white">Taxable Gain:</span>
              <span className="font-bold text-yellow-400">
                £{cgtCalculation.taxableGain.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">CGT Rate:</span>
              <span className="text-white">
                {taxRate === "basic" ? "18%" : "24%"}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="text-lg font-medium text-white">
                CGT Liability:
              </span>
              <span className="text-lg font-bold text-red-400">
                £{selectedCgtLiability.toLocaleString()}
              </span>
            </div>
          </div>

          {cgtCalculation.taxableGain === 0 && (
            <div className="rounded border border-green-700 bg-green-900/20 p-3">
              <p className="text-sm text-green-300">
                ✓ No CGT liability - your gains are within the annual allowance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-gray-800 bg-[#1a2236]">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-white">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm text-gray-400">
            • Trading amounts in USD, automatically converted to GBP using live
            exchange rates
          </p>
          <p className="text-sm text-gray-400">
            • Stock profits/losses: Realized gains/losses + separate stock
            trading fees
          </p>
          <p className="text-sm text-gray-400">
            • Options profits/losses: Gross amounts (before fees) + separate
            options fees
          </p>
          <p className="text-sm text-gray-400">
            • CGT calculations performed in GBP as required by HMRC
          </p>
          <p className="text-sm text-gray-400">
            • Tax year: April 6, 2025 - April 5, 2026
          </p>
          <p className="text-sm text-gray-400">
            • Annual CGT allowance: £3,000 (2025/26)
          </p>
          <p className="text-sm text-gray-400">
            • Basic rate: 18% | Higher rate: 24% (for non-property assets)
          </p>
          <p className="text-sm font-medium text-yellow-400">
            ⚠️ For informational purposes only - not suitable for HMRC
            submission
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
