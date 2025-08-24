"use client";

import { syncTransactions, useTransactions } from "@/api/transactions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

interface Transaction {
  id: number;
  userId: number;
  transactionId: number;
  broker: string;
  date: string;
  action: string;
  ticker: string;
  description: string | null;
  quantity: string;
  fees: string;
  amount: string;
  strikePrice: string | null;
  expiryDate: string | null;
  optionType: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsPage() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedBroker, setSelectedBroker] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<keyof Transaction>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Custom hook for fetching transactions
  const {
    transactions,
    error: swrError,
    isLoading: loading,
    mutate: refreshData,
  } = useTransactions();

  const syncData = () => {
    setSyncing(true);
    setError(null);

    syncTransactions()
      .then((result) => {
        refreshData();
        setInfo(result.errors?.join(", ") ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to sync data");
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

  const getActionColor = (action: string) => {
    if (action.includes("buy") || action.includes("open")) {
      return "bg-green-100 text-green-800";
    } else if (action.includes("sell") || action.includes("close")) {
      return "bg-red-100 text-red-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("buy") || action.includes("open")) {
      return <TrendingUp className="w-4 h-4" />;
    } else if (action.includes("sell") || action.includes("close")) {
      return <TrendingDown className="w-4 h-4" />;
    }
    return null;
  };

  // Get unique actions and brokers for filters
  const uniqueActions = useMemo(() => {
    const actions = [
      ...new Set(transactions.map((t: Transaction) => t.action)),
    ] as string[];
    return actions.sort();
  }, [transactions]);

  const uniqueBrokers = useMemo(() => {
    const brokers = [
      ...new Set(transactions.map((t: Transaction) => t.broker)),
    ] as string[];
    return brokers.sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction: Transaction) => {
      const matchesSearch =
        transaction.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.description &&
          transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesAction =
        selectedAction === "all" || transaction.action === selectedAction;
      const matchesBroker =
        selectedBroker === "all" || transaction.broker === selectedBroker;

      return matchesSearch && matchesAction && matchesBroker;
    });

    // Sort transactions
    filtered.sort((a: Transaction, b: Transaction) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null values
      if (aValue === null) aValue = "";
      if (bValue === null) bValue = "";

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
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: keyof Transaction }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 mt-2">
            {filteredAndSortedTransactions.length} of {transactions.length}{" "}
            transaction{transactions.length !== 1 ? "s" : ""} shown
          </p>
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

      {(error || swrError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error ||
              (swrError instanceof Error
                ? swrError.message
                : "Failed to fetch transactions")}
          </AlertDescription>
        </Alert>
      )}

      {info && (
        <Alert className="mb-6">
          <Info className="w-4 h-4" />
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

      {transactions.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-700 p-0">
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-gray-400 mb-4">No transactions found</p>
              <Button
                onClick={syncData}
                disabled={syncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`}
                />
                Sync Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <CardHeader className="p-0">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search ticker or description..."
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

            {/* Filters Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <Label className="text-gray-300">Action Type</Label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  >
                    <option value="all">All Actions</option>
                    {uniqueActions.map((action: string) => (
                      <option key={action} value={action}>
                        {action.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-gray-300">Broker</Label>
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
                        onClick={() => handleSort("ticker")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Ticker
                        <SortIcon field="ticker" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("action")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Action
                        <SortIcon field="action" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("quantity")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Quantity
                        <SortIcon field="quantity" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("amount")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Amount
                        <SortIcon field="amount" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("fees")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Fees
                        <SortIcon field="fees" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Date
                        <SortIcon field="date" />
                      </button>
                    </th>
                    <th className="text-left p-3 text-gray-300 font-medium">
                      <button
                        onClick={() => handleSort("broker")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Broker
                        <SortIcon field="broker" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTransactions.map(
                    (transaction: Transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-white">
                              {transaction.ticker}
                            </div>
                            {transaction.description && (
                              <div className="text-sm text-gray-400 truncate max-w-48">
                                {transaction.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getActionIcon(transaction.action)}
                            <Badge
                              className={getActionColor(transaction.action)}
                            >
                              {transaction.action.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 text-white">
                          {formatQuantity(transaction.quantity)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-medium ${
                              parseFloat(transaction.amount) >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {formatCurrency(transaction.amount)}
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
                            {transaction.broker}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {filteredAndSortedTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No transactions match your current filters.
              </div>
            )}
          </CardContent>
        </>
      )}
    </div>
  );
}
