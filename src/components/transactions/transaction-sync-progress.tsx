"use client";

import { CheckCircle, Clock, Database, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { recoverSyncSession } from "@/api/sync";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { endpoints } from "@/lib/utils";

interface SyncProgressData {
  status:
    | "connecting"
    | "fetching"
    | "processing"
    | "saving"
    | "completed"
    | "failed";
  progress: number;
  message: string;
  total: number;
  processed: number;
  failed: number;
  remaining: number;
  startTime: number; // Backend provides start timestamp
  endTime?: number; // Backend provides end timestamp
  alert: {
    variant: "default" | "destructive" | "success" | "warning" | "info";
    message: string;
  } | null;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "connecting":
      return <Database className="w-5 h-5 text-blue-500 animate-pulse" />;
    case "fetching":
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    case "processing":
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    case "saving":
      return <Database className="w-5 h-5 text-blue-500 animate-pulse" />;
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    default:
      return <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />;
  }
};

const formatElapsedTime = (startTime: number, endTime?: number) => {
  const elapsed = Math.floor(
    (endTime ? endTime - startTime : Date.now() - startTime) / 1000
  );

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "connecting":
      return "Connecting to Broker";
    case "fetching":
      return "Fetching Data";
    case "processing":
      return "Processing Transactions";
    case "saving":
      return "Saving to Database";
    case "completed":
      return "Sync Complete";
    case "failed":
      return "Sync Failed";
    default:
      return "Syncing";
  }
};

interface TransactionSyncProgressProps {
  sessionId: string | null;
  onSyncComplete: () => void;
}

export function TransactionSyncProgress({
  sessionId,
  onSyncComplete,
}: TransactionSyncProgressProps) {
  const [syncProgress, setSyncProgress] = useState<SyncProgressData | null>(
    null
  );

  // Manage polling connection with active session recovery
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const pollProgress = async () => {
      try {
        // Use provided sessionId or check for active session
        let currentSessionId = sessionId;

        if (!sessionId) {
          const existingSessionId = await recoverSyncSession();

          if (!existingSessionId) {
            setSyncProgress(null);
            if (interval) clearInterval(interval);
            return;
          }

          currentSessionId = existingSessionId;
        }

        // Get progress for the current session
        const progressResponse = await fetch(
          `${endpoints.sync.progress}?sessionId=${currentSessionId}`
        );

        if (!progressResponse.ok) {
          throw new Error(`HTTP ${progressResponse.status}`);
        }

        const progress = await progressResponse.json();
        setSyncProgress(progress);

        // Handle completion
        if (progress.status === "completed" || progress.status === "failed") {
          if (interval) clearInterval(interval);
          onSyncComplete();
        }
      } catch (error) {
        console.error("Error fetching sync progress:", error);
        if (interval) clearInterval(interval);
        setSyncProgress({
          status: "failed",
          progress: 0,
          message: "Connection error during sync",
          total: 0,
          processed: 0,
          failed: 0,
          remaining: 0,
          startTime: Date.now(),
          alert: {
            variant: "destructive",
            message: "Connection error during sync. Please try again.",
          },
        });
      }
    };

    // Start polling immediately, then every second
    pollProgress();
    interval = setInterval(pollProgress, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, onSyncComplete]);

  if (!syncProgress) return null;

  const {
    status,
    progress,
    message,
    total,
    processed,
    failed,
    remaining,
    startTime,
    endTime,
    alert,
  } = syncProgress;

  const isCompleted = status === "completed";
  const elapsedTime = formatElapsedTime(startTime, endTime);
  const showProgress = total > 20;

  return (
    <div className="mb-6 space-y-4">
      {/* Progress Section - Show when appropriate */}
      {showProgress && (
        <div className="transition-all duration-500 ease-out transform opacity-100 translate-y-0">
          <Card className="bg-gray-900/80 border border-gray-700 overflow-hidden py-0">
            <CardContent className="p-6">
              {/* Header with status and elapsed time */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {getStatusLabel(status)}
                    </h3>
                    <p className="text-sm text-gray-400">{message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {elapsedTime}
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {processed.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">
                    PROCESSED
                  </div>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {total.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">
                    TOTAL
                  </div>
                </div>
                <div className="bg-red-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {failed.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">
                    FAILED
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-300">
                    {remaining.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-gray-400 mt-1">
                    REMAINING
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {!isCompleted && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Progress
                    </span>
                    <span className="text-sm font-medium text-gray-300">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 ease-out rounded-full bg-green-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {alert && (
        <Alert variant={alert.variant}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
