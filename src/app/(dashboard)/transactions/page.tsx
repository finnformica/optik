"use client";

import _ from "lodash";
import { ArrowDown, ArrowUp, Filter, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { syncTransactions, useTransactions } from "@/api/transactions";

import { Loading } from "@/components/global/loading";
import ActionBadge from "@/components/global/trade-action-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { ITransactionAction } from "@/lib/db/schema";

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

interface AlertData {
  variant: "default" | "destructive" | "success" | "warning" | "info";
  message: string;
}

export default function TransactionsPage() {
  const [syncing, setSyncing] = useState(false);
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedBroker, setSelectedBroker] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<keyof Transaction>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const {
    transactions,
    isLoading: loading,
    mutate: refreshData,
  } = useTransactions();

  const syncData = () => {
    setSyncing(true);
    setAlert(null);

    syncTransactions()
      .then((result) => {
        refreshData();
        setAlert(result.alert);
      })
      .catch((err) => {
        setAlert({
          variant: "destructive",
          message: err instanceof Error ? err.message : "Failed to sync data",
        });
      })
      .finally(() => {
        setSyncing(false);
      });
  };

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

  // Get unique actions and brokers for filters
  const uniqueActions = useMemo(() => {
    const actions = [
      ...new Set(transactions.map((t: Transaction) => t.actionCode)),
    ] as string[];
    return actions.sort();
  }, [transactions]);

  const uniqueBrokers = useMemo(() => {
    const brokers = [
      ...new Set(transactions.map((t: Transaction) => t.brokerName)),
    ] as string[];
    return brokers.sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction: Transaction) => {
      const matchesSearch =
        transaction.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.actionDescription &&
          transaction.actionDescription
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesAction =
        selectedAction === "all" || transaction.actionCode === selectedAction;
      const matchesBroker =
        selectedBroker === "all" || transaction.brokerName === selectedBroker;

      return matchesSearch && matchesAction && matchesBroker;
    });

    // Sort transactions
    filtered.sort((a: Transaction, b: Transaction) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null values
      if (aValue === null) aValue = "";
      if (bValue === null) bValue = "";

      // Handle numeric fields
      const numericFields = [
        "quantity",
        "netAmount",
        "fees",
        "grossAmount",
        "pricePerUnit",
      ];
      if (numericFields.includes(sortField as string)) {
        const aNum = parseFloat(aValue as string) || 0;
        const bNum = parseFloat(bValue as string) || 0;
        if (aNum < bNum) return sortDirection === "asc" ? -1 : 1;
        if (aNum > bNum) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      // Handle string comparisons
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    transactions,
    searchTerm,
    selectedAction,
    selectedBroker,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
    }
  };

  const SortIcon = ({ field }: { field: keyof Transaction }) => {
    const isActive = sortField === field;
    const Icon = sortDirection === "asc" ? ArrowUp : ArrowDown;

    return (
      <Icon
        className={`w-4 h-4 transition-opacity ${
          isActive
            ? "text-gray-300 opacity-100"
            : "text-gray-400 opacity-0 group-hover:opacity-100"
        }`}
      />
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Loading message="Loading transactions..." className="h-64" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Typography variant="h2">Transactions</Typography>
          <Typography variant="muted">
            {filteredAndSortedTransactions.length} of {transactions.length}{" "}
            transaction{transactions.length !== 1 ? "s" : ""} shown
          </Typography>
        </div>

        <Button
          onClick={syncData}
          disabled={syncing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Data"}
        </Button>
      </div>

      {alert && (
        <Alert variant={alert ? alert.variant : "destructive"} className="mb-6">
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {transactions.length === 0 ? (
        <div className="bg-gray-900/50 border-gray-700">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-400">No transactions found</p>
            </div>
          </CardContent>
        </div>
      ) : (
        <>
          <CardHeader className="px-0 py-2 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between w-full">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search symbol or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            <Separator />

            {/* Filters Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-b border-gray-700 pb-4">
                <div>
                  <Label className="text-gray-300 pb-1">Action Type</Label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  >
                    <option value="all">All Actions</option>
                    {uniqueActions.map((action: string) => (
                      <option key={action} value={action}>
                        {_.startCase(action)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300 pb-1">Broker</Label>
                  <select
                    value={selectedBroker}
                    onChange={(e) => setSelectedBroker(e.target.value)}
                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  >
                    <option value="all">All Brokers</option>
                    {uniqueBrokers.map((broker: string) => (
                      <option key={broker} value={broker}>
                        {broker.charAt(0).toUpperCase() + broker.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("symbol")}
                        className="group flex items-center gap-1 hover:text-white transition-colors min-w-52"
                      >
                        Symbol
                        <SortIcon field="symbol" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("actionCode")}
                        className="group flex items-center gap-1 hover:text-white transition-colors min-w-32"
                      >
                        Action
                        <SortIcon field="actionCode" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("quantity")}
                        className="group flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Quantity
                        <SortIcon field="quantity" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("netAmount")}
                        className="group flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Amount
                        <SortIcon field="netAmount" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("fees")}
                        className="group flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Fees
                        <SortIcon field="fees" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("date")}
                        className="group flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Date
                        <SortIcon field="date" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("brokerName")}
                        className="group flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Broker
                        <SortIcon field="brokerName" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTransactions.map(
                    (transaction: Transaction, index: number) => (
                      <tr
                        key={`${transaction.brokerTransactionId}-${index}`}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-white">
                              {transaction.symbol}
                            </div>
                            {transaction.actionDescription && (
                              <div className="text-sm text-gray-400 line-clamp-2 break-words">
                                {transaction.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <ActionBadge
                              action={transaction.actionCode as any}
                            />
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
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {filteredAndSortedTransactions.length === 0 && (
              <Typography variant="muted" className="text-center py-8">
                No transactions match your current filters.
              </Typography>
            )}
          </CardContent>
        </>
      )}
    </>
  );
}
