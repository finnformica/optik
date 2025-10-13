"use client";

import _ from "lodash";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { useTransactions } from "@/api/transactions";

import { Loading } from "@/components/global/loading";
import ActionBadge from "@/components/global/trade-action-badge";
import { TransactionHeader } from "@/components/transactions/transaction-header";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ITransactionAction } from "@/lib/db/schema";

const formatCurrency = (amount: string) => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

const formatQuantity = (quantity: string) => {
  const num = parseFloat(quantity);
  return num.toLocaleString();
};

interface Transaction {
  // Transaction facts
  quantity: string;
  pricePerUnit: string | null;
  grossAmount: string;
  fees: string;
  netAmount: string;
  brokerTransactionId: string | null;
  orderId: string | null;
  description: string | null;

  // Date information
  date: string;

  // Security information
  symbol: string;
  securityType: string;
  underlyingSymbol: string;
  optionType: string | null;
  strikePrice: string | null;
  expiryDate: string | null;

  // Transaction type
  actionCode: ITransactionAction;
  actionDescription: string | null;
  actionCategory: string | null;

  // Broker information
  brokerName: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Get current values from URL params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const searchTerm = searchParams.get("search") || "";
  const selectedAction = searchParams.get("action") || "all";
  const selectedBroker = searchParams.get("broker") || "all";
  const sortField = (searchParams.get("sortBy") || "date") as keyof Transaction;
  const sortDirection = (searchParams.get("sortOrder") || "desc") as
    | "asc"
    | "desc";

  const {
    transactions,
    pagination,
    filters,
    isLoading: loading,
    mutate: refreshData,
  } = useTransactions({
    page,
    limit,
    search: searchTerm,
    action: selectedAction,
    broker: selectedBroker,
    sortBy: sortField,
    sortOrder: sortDirection,
  });

  const handleSyncComplete = () => {
    refreshData();
  };

  // Update URL params
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          newParams.delete(key);
        } else {
          newParams.set(key, value.toString());
        }
      });

      // Reset to page 1 when filters change
      if (Object.keys(updates).some((key) => key !== "page")) {
        newParams.delete("page");
      }

      router.push(`/transactions?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  // Event handlers
  const handleSort = (field: keyof Transaction) => {
    const newSortOrder =
      sortField === field && sortDirection === "desc" ? "asc" : "desc";
    updateUrlParams({
      sortBy: field,
      sortOrder: newSortOrder,
    });
  };

  const handleActionChange = (action: string) => {
    updateUrlParams({ action });
  };

  const handleBrokerChange = (broker: string) => {
    updateUrlParams({ broker });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    updateUrlParams({ limit: newLimit });
  };

  const handleSearchChange = (searchValue: string) => {
    updateUrlParams({ search: searchValue });
  };

  const SortIcon = ({ field }: { field: keyof Transaction }) => {
    const isActive = sortField === field;
    const Icon = sortDirection === "asc" ? ArrowUp : ArrowDown;

    return (
      <Icon
        className={`h-4 w-4 transition-opacity ${
          isActive
            ? "text-gray-300 opacity-100"
            : "text-gray-400 opacity-0 group-hover:opacity-100"
        }`}
      />
    );
  };

  return (
    <>
      <TransactionHeader
        loading={loading}
        transactionsLength={pagination?.total || 0}
        filteredTransactionsLength={transactions.length}
        onSyncComplete={handleSyncComplete}
      />

      <CardHeader className="flex flex-col gap-4 px-0 py-2">
        <div className="flex w-full flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search symbol or description..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border-gray-600 bg-gray-800 pl-10 text-white placeholder-gray-400"
            />
          </div>

          {/* Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <Separator />

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid w-full grid-cols-1 gap-4 border-b border-gray-700 pb-4 md:grid-cols-2">
            <div>
              <Label className="pb-1 text-gray-300">Action Type</Label>
              <select
                value={selectedAction}
                onChange={(e) => handleActionChange(e.target.value)}
                className="mt-1 w-full rounded border border-gray-600 bg-gray-800 p-2 text-white"
              >
                <option value="all">All Actions</option>
                {filters?.availableActions?.map((action: string) => (
                  <option key={action} value={action}>
                    {_.startCase(action)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="pb-1 text-gray-300">Broker</Label>
              <select
                value={selectedBroker}
                onChange={(e) => handleBrokerChange(e.target.value)}
                className="mt-1 w-full rounded border border-gray-600 bg-gray-800 p-2 text-white"
              >
                <option value="all">All Brokers</option>
                {filters?.availableBrokers?.map((broker: string) => (
                  <option key={broker} value={broker}>
                    {broker.charAt(0).toUpperCase() + broker.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative flex h-[calc(100vh-230px)] flex-col overflow-y-auto p-0">
        <table className="w-full">
          <thead data-tour="transactions-table">
            <tr className="border-b border-gray-700">
              <th className="p-3 text-left font-medium text-gray-300">
                <button
                  onClick={() => handleSort("symbol")}
                  className="group flex min-w-52 items-center gap-1 transition-colors hover:text-white"
                >
                  Symbol
                  <SortIcon field="symbol" />
                </button>
              </th>
              <th className="p-3 text-left font-medium text-gray-300">
                <button
                  onClick={() => handleSort("actionCode")}
                  className="group flex min-w-32 items-center gap-1 transition-colors hover:text-white"
                >
                  Action
                  <SortIcon field="actionCode" />
                </button>
              </th>
              <th className="p-3 text-left font-medium text-gray-300">
                <button
                  onClick={() => handleSort("quantity")}
                  className="group flex items-center gap-1 transition-colors hover:text-white"
                >
                  Quantity
                  <SortIcon field="quantity" />
                </button>
              </th>
              <th className="p-3 text-left font-medium text-gray-300">
                <button
                  onClick={() => handleSort("netAmount")}
                  className="group flex items-center gap-1 transition-colors hover:text-white"
                >
                  Amount
                  <SortIcon field="netAmount" />
                </button>
              </th>
              <th className="p-3 text-left font-medium text-gray-300">
                <button
                  onClick={() => handleSort("fees")}
                  className="group flex items-center gap-1 transition-colors hover:text-white"
                >
                  Fees
                  <SortIcon field="fees" />
                </button>
              </th>
              <th className="p-3 text-left font-medium text-gray-300">
                <button
                  onClick={() => handleSort("date")}
                  className="group flex items-center gap-1 transition-colors hover:text-white"
                >
                  Date
                  <SortIcon field="date" />
                </button>
              </th>
              <th className="p-3 text-left font-medium text-gray-300">
                <button
                  onClick={() => handleSort("brokerName")}
                  className="group flex items-center gap-1 transition-colors hover:text-white"
                >
                  Broker
                  <SortIcon field="brokerName" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8">
                  <Loading message="Loading transactions..." className="h-32" />
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <p className="text-gray-400">No transactions found</p>
                </td>
              </tr>
            ) : (
              transactions.map((transaction: Transaction, index: number) => (
                <tr
                  key={`${transaction.brokerTransactionId}-${index}`}
                  className="border-b border-gray-800 transition-colors hover:bg-gray-800/50"
                >
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-white">
                        {transaction.symbol}
                      </div>
                      {transaction.actionDescription && (
                        <div className="line-clamp-2 text-sm break-words text-gray-400">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <ActionBadge action={transaction.actionCode as any} />
                    </div>
                  </td>
                  <td className="p-3 text-white">
                    {formatQuantity(transaction.quantity)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`font-medium ${
                        parseFloat(transaction.netAmount) > 0
                          ? "text-green-400"
                          : parseFloat(transaction.netAmount) < 0
                            ? "text-red-400"
                            : ""
                      }`}
                    >
                      {formatCurrency(transaction.netAmount)}
                    </span>
                  </td>
                  <td className="p-3 text-gray-300">
                    {formatCurrency(transaction.fees)}
                  </td>
                  <td className="p-3 text-gray-300">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span className="text-gray-300 capitalize">
                      {transaction.brokerName}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls - Sticky */}
        <div className="sticky bottom-0 border-t border-gray-700 bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>
                Showing{" "}
                {pagination ? (pagination.page - 1) * pagination.limit + 1 : 0}{" "}
                to{" "}
                {pagination
                  ? Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )
                  : 0}{" "}
                of {pagination?.total || 0} transactions
              </span>

              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400">Show:</label>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-gray-400">per page</span>
              </div>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!pagination.hasPrevious}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNumber;
                      if (pagination.totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNumber = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNumber = pagination.totalPages - 4 + i;
                      } else {
                        pageNumber = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant={
                            pageNumber === pagination.page
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className={`h-8 w-8 p-0 ${
                            pageNumber === pagination.page
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "border-gray-600 text-gray-300 hover:bg-gray-800"
                          }`}
                        >
                          {pageNumber}
                        </Button>
                      );
                    },
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.hasNext}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </>
  );
}
