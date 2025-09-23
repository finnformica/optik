"use client";

import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { syncTransactions } from "@/api/transactions";
import { useSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { supabase } from "@/lib/supabase";
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
  const { session } = useSession();

  const [_syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressData | null>(
    null
  );

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

  // Manage realtime subscription for sync progress
  useEffect(() => {
    const accountKey = session.accountKey;
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
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session?.accountKey, onSyncComplete, setShowAlert, syncProgress]);

  const syncing = loading || _syncing;

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Typography variant="h2">Transactions</Typography>
          <Typography variant="muted">
            {loading ? "Loading..." : subHeaderText}
          </Typography>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={syncData}
            disabled={syncing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Data"}
          </Button>
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
