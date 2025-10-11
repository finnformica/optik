"use client";

import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { ChevronDown, Plus, RefreshCw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { importCsvTransactions, syncTransactions } from "@/api/transactions";
import { useAccountKey } from "@/api/user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/client";
import { channels } from "@/lib/utils";
import { SyncProgressData } from "@/types/sync-progress";

import { AxiosError } from "axios";
import TransactionSyncProgress from "./transaction-sync-progress";

interface TransactionHeaderProps {
  loading: boolean;
  transactionsLength: number;
  filteredTransactionsLength: number;
  onSyncComplete: () => void;
}

export function TransactionHeader({
  loading,
  transactionsLength,
  filteredTransactionsLength,
  onSyncComplete,
}: TransactionHeaderProps) {
  const { accountKey } = useAccountKey();

  const [_syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressData | null>(
    null,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "sync" | "import" | "manual"
  >(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferredDataAction");
      return (saved as "sync" | "import" | "manual") || "sync";
    }
    return "sync";
  });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subHeaderText = `${filteredTransactionsLength} of ${transactionsLength} ${
    transactionsLength !== 1 ? "transactions" : "transaction"
  } shown`;

  const syncData = () => {
    setError(null);
    setSyncing(true);

    // Start the sync process
    // Background session is started and persisted in the realtime table
    syncTransactions()
      .catch((e: AxiosError<{ message: string }>) => {
        setError(e.response?.data.message ?? "An error occurred");
      })
      .finally(() => {
        setSyncing(false);
      });
  };

  const handleFileImport = async (file: File) => {
    setError(null);
    setImporting(true);

    try {
      const result = await importCsvTransactions(file);
      setShowAlert(true);
      onSyncComplete();

      // Show success message based on result
      if (result.newTransactions === 0) {
        setError(
          `All ${result.totalRows} transactions already exist in the database`,
        );
      } else {
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to import CSV file");
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleActionSelect = (action: "sync" | "import" | "manual") => {
    setSelectedAction(action);
    setShowDropdown(false);

    // Save preference to localStorage
    localStorage.setItem("preferredDataAction", action);

    if (action === "sync") {
      syncData();
    } else if (action === "import") {
      triggerFileInput();
    } else if (action === "manual") {
      // TODO: Implement manual transaction entry
      setError("Manual transaction entry not yet implemented");
    }
  };

  const actionOptions = [
    {
      key: "sync" as const,
      label: "Sync Data",
      icon: <RefreshCw className="h-4 w-4" />,
      loadingText: "Syncing...",
    },
    {
      key: "import" as const,
      label: "Import CSV",
      icon: <Upload className="h-4 w-4" />,
      loadingText: "Importing...",
    },
    {
      key: "manual" as const,
      label: "Manual Entry",
      icon: <Plus className="h-4 w-4" />,
      loadingText: "Processing...",
    },
  ];

  const getActionOption = (action: "sync" | "import" | "manual") => {
    return actionOptions.find(option => option.key === action)!;
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Manage realtime subscription for sync progress
  useEffect(() => {
    if (!accountKey) return;

    const supabase = createClient();
    const channelName = channels.syncSessionProgress(accountKey);

    const channel = supabase
      .channel(channelName, {
        config: { private: false },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rtm_sync_progress",
        },
        (payload: RealtimePostgresChangesPayload<SyncProgressData>) => {
          const data = payload.new as SyncProgressData;

          setSyncProgress(data);

          // Handle completion
          if (data.status === "completed" || data.status === "failed") {
            onSyncComplete();
            setShowAlert(true);
            setSyncing(false);
          } else {
            setShowAlert(false);
            setSyncing(true);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [accountKey, onSyncComplete]);

  const syncing = loading || _syncing;
  const isProcessing = syncing || importing;

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Typography variant="h2">Transactions</Typography>
          <Typography variant="muted">
            {loading ? "Loading..." : subHeaderText}
          </Typography>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="relative" ref={dropdownRef}>
            <div className="flex">
              <Button
                onClick={() => handleActionSelect(selectedAction)}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-r-none border-r border-blue-500 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {getActionOption(selectedAction).loadingText}
                  </>
                ) : (
                  <>
                    {getActionOption(selectedAction).icon}
                    {getActionOption(selectedAction).label}
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isProcessing}
                className="rounded-l-none bg-blue-600 px-2 hover:bg-blue-700"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {showDropdown && (
              <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-md border border-gray-600 bg-gray-800 shadow-lg">
                <div className="py-1">
                  {actionOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => handleActionSelect(option.key)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-white transition-colors hover:bg-gray-700"
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hidden file input for CSV import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <TransactionSyncProgress
        syncProgress={syncProgress}
        showAlert={error ? false : showAlert}
      />

      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
